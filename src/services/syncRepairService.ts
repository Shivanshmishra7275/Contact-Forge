/**
 * ContactForge — Sync Repair Service
 *
 * Best-effort cleanup for duplicate native contacts.
 * This runs locally and never touches network or device contacts.
 */

import { getDatabase } from '../db';
import {
  getContactById,
  getPhonesByContactId,
  getEmailsByContactId,
  updateContact,
} from '../db/repositories/contactRepository';
import { reassignNotes } from '../db/repositories/noteRepository';
import { reassignRelationships } from '../db/repositories/relationshipRepository';
import { transferTemporaryContact } from '../db/repositories/temporaryContactRepository';
import { isGhostContact } from '../utils/normalization';

interface ContactRow {
  id: number;
  native_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  normalized_name: string;
  company: string | null;
  job_title: string | null;
  notes: string | null;
  birthday: string | null;
  image_uri: string | null;
  has_thumbnail: number;
  is_temporary: number;
  is_ghost: number;
  tags: string;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NativeIdRepairSummary {
  groups: number;
  mergedContacts: number;
  removedContacts: number;
  updatedContacts: number;
}

const UNIQUE_NATIVE_ID_INDEX =
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_native_id_unique ON contacts(native_id) WHERE native_id IS NOT NULL";

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function mergeTags(primary: string[], secondary: string[]): string[] {
  const set = new Set([...primary, ...secondary].filter(Boolean));
  return Array.from(set);
}

function countRows(db: ReturnType<typeof getDatabase>, table: string, contactId: number): number {
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${table} WHERE contact_id = ?`,
    [contactId],
  );
  return row?.count ?? 0;
}

function countRelationships(db: ReturnType<typeof getDatabase>, contactId: number): number {
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM contact_relationships
      WHERE contact_id_from = ? OR contact_id_to = ?`,
    [contactId, contactId],
  );
  return row?.count ?? 0;
}

function scoreContact(db: ReturnType<typeof getDatabase>, row: ContactRow): number {
  let score = 0;
  if (row.first_name) score += 2;
  if (row.last_name) score += 2;
  if (row.company) score += 1;
  if (row.job_title) score += 1;
  if (row.notes) score += 1;
  if (row.birthday) score += 1;
  if (row.image_uri) score += 1;
  if (parseTags(row.tags).length > 0) score += 1;

  const phones = countRows(db, 'phone_numbers', row.id);
  const emails = countRows(db, 'emails', row.id);
  const notes = countRows(db, 'contact_notes', row.id);
  const relationships = countRelationships(db, row.id);

  score += phones * 3 + emails * 3 + notes * 2 + relationships * 2;
  return score;
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function reassignContactReferences(
  db: ReturnType<typeof getDatabase>,
  fromContactId: number,
  toContactId: number,
): void {
  db.runSync('UPDATE phone_numbers SET contact_id = ? WHERE contact_id = ?', [toContactId, fromContactId]);
  db.runSync('UPDATE emails SET contact_id = ? WHERE contact_id = ?', [toContactId, fromContactId]);

  reassignNotes(fromContactId, toContactId);
  reassignRelationships(fromContactId, toContactId);
  transferTemporaryContact(fromContactId, toContactId);

  db.runSync(
    `UPDATE duplicate_candidates SET contact_id_a = ? WHERE contact_id_a = ?`,
    [toContactId, fromContactId],
  );
  db.runSync(
    `UPDATE duplicate_candidates SET contact_id_b = ? WHERE contact_id_b = ?`,
    [toContactId, fromContactId],
  );

  db.runSync(
    `UPDATE undo_history SET contact_id = ? WHERE contact_id = ?`,
    [toContactId, fromContactId],
  );

  // Archive/protection rows are UNIQUE per contact_id; prefer keeping the primary.
  db.runSync(
    `UPDATE contact_archive
        SET contact_id = ?
      WHERE contact_id = ?
        AND NOT EXISTS (SELECT 1 FROM contact_archive WHERE contact_id = ?)`,
    [toContactId, fromContactId, toContactId],
  );
  db.runSync('DELETE FROM contact_archive WHERE contact_id = ?', [fromContactId]);

  db.runSync(
    `UPDATE contact_protection
        SET contact_id = ?
      WHERE contact_id = ?
        AND NOT EXISTS (SELECT 1 FROM contact_protection WHERE contact_id = ?)`,
    [toContactId, fromContactId, toContactId],
  );
  db.runSync('DELETE FROM contact_protection WHERE contact_id = ?', [fromContactId]);
}

function dedupePhonesAndEmails(db: ReturnType<typeof getDatabase>, contactId: number): void {
  db.runSync(
    `DELETE FROM phone_numbers
      WHERE id NOT IN (
        SELECT MIN(id) FROM phone_numbers
        WHERE contact_id = ?
        GROUP BY normalized_number
      )
      AND contact_id = ?`,
    [contactId, contactId],
  );

  db.runSync(
    `DELETE FROM emails
      WHERE id NOT IN (
        SELECT MIN(id) FROM emails
        WHERE contact_id = ?
        GROUP BY normalized_email
      )
      AND contact_id = ?`,
    [contactId, contactId],
  );
}

function normalizeDuplicateCandidates(db: ReturnType<typeof getDatabase>): void {
  db.runSync(
    `DELETE FROM duplicate_candidates WHERE contact_id_a = contact_id_b`,
    [],
  );

  db.runSync(
    `UPDATE duplicate_candidates
        SET contact_id_a = CASE WHEN contact_id_a < contact_id_b THEN contact_id_a ELSE contact_id_b END,
            contact_id_b = CASE WHEN contact_id_a < contact_id_b THEN contact_id_b ELSE contact_id_a END`,
    [],
  );

  db.runSync(
    `DELETE FROM duplicate_candidates
      WHERE id NOT IN (
        SELECT MIN(id)
          FROM duplicate_candidates
         GROUP BY contact_id_a, contact_id_b
      )`,
    [],
  );
}

function ensureUniqueNativeIdIndex(db: ReturnType<typeof getDatabase>): void {
  try {
    db.execSync(UNIQUE_NATIVE_ID_INDEX);
  } catch {
    // Ignore failures to avoid blocking sync if legacy data is inconsistent.
  }
}

function refreshGhostFlag(contactId: number): void {
  const contact = getContactById(contactId);
  if (!contact) return;

  const phones = getPhonesByContactId(contactId).map((p) => p.number);
  const emails = getEmailsByContactId(contactId).map((e) => e.email);
  const ghost = isGhostContact({
    displayName: contact.displayName,
    phoneNumbers: phones,
    emails,
    company: contact.company,
  });

  if (ghost !== contact.isGhost) {
    updateContact(contactId, { isGhost: ghost });
  }
}

export function repairDuplicateNativeContacts(): NativeIdRepairSummary {
  const db = getDatabase();
  const duplicates = db.getAllSync<{ native_id: string; count: number }>(
    `SELECT native_id, COUNT(*) as count
       FROM contacts
      WHERE native_id IS NOT NULL
      GROUP BY native_id
     HAVING count > 1`,
    [],
  );

  const summary: NativeIdRepairSummary = {
    groups: duplicates.length,
    mergedContacts: 0,
    removedContacts: 0,
    updatedContacts: 0,
  };

  if (duplicates.length === 0) {
    ensureUniqueNativeIdIndex(db);
    return summary;
  }

  db.withTransactionSync(() => {
    for (const dupe of duplicates) {
      const rows = db.getAllSync<ContactRow>(
        `SELECT * FROM contacts WHERE native_id = ? ORDER BY updated_at DESC, id DESC`,
        [dupe.native_id],
      );
      if (rows.length < 2) continue;

      const scored = rows.map((row) => ({
        row,
        score: scoreContact(db, row),
      }));

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.row.updated_at !== a.row.updated_at) return b.row.updated_at > a.row.updated_at ? 1 : -1;
        return b.row.id - a.row.id;
      });

      let primary = scored[0].row;
      let primaryTags = parseTags(primary.tags);

      for (const secondary of scored.slice(1).map((s) => s.row)) {
        const secondaryTags = parseTags(secondary.tags);
        const mergedTags = mergeTags(primaryTags, secondaryTags);
        const mergedSyncedAt = maxIso(primary.synced_at, secondary.synced_at);

        const updateParams: Parameters<typeof updateContact>[1] = {};

        if (!primary.first_name && secondary.first_name) {
          updateParams.firstName = secondary.first_name;
          primary = { ...primary, first_name: secondary.first_name };
        }
        if (!primary.last_name && secondary.last_name) {
          updateParams.lastName = secondary.last_name;
          primary = { ...primary, last_name: secondary.last_name };
        }
        if (!primary.company && secondary.company) {
          updateParams.company = secondary.company;
          primary = { ...primary, company: secondary.company };
        }
        if (!primary.job_title && secondary.job_title) {
          updateParams.jobTitle = secondary.job_title;
          primary = { ...primary, job_title: secondary.job_title };
        }
        if (!primary.notes && secondary.notes) {
          updateParams.notes = secondary.notes;
          primary = { ...primary, notes: secondary.notes };
        }
        if (!primary.birthday && secondary.birthday) {
          updateParams.birthday = secondary.birthday;
          primary = { ...primary, birthday: secondary.birthday };
        }
        if (!primary.image_uri && secondary.image_uri) {
          updateParams.imageUri = secondary.image_uri;
          updateParams.hasThumbnail = Boolean(secondary.has_thumbnail);
          primary = { ...primary, image_uri: secondary.image_uri, has_thumbnail: secondary.has_thumbnail };
        }
        if (secondary.is_temporary === 1 && primary.is_temporary !== 1) {
          updateParams.isTemporary = true;
          primary = { ...primary, is_temporary: 1 };
        }
        if (mergedTags.length !== primaryTags.length) {
          updateParams.tags = mergedTags;
          primaryTags = mergedTags;
        }
        if (mergedSyncedAt !== primary.synced_at && mergedSyncedAt) {
          updateParams.syncedAt = mergedSyncedAt;
          primary = { ...primary, synced_at: mergedSyncedAt };
        }

        if (Object.keys(updateParams).length > 0) {
          updateContact(primary.id, updateParams);
          summary.updatedContacts += 1;
        }

        reassignContactReferences(db, secondary.id, primary.id);
        db.runSync('DELETE FROM contacts WHERE id = ?', [secondary.id]);
        summary.mergedContacts += 1;
        summary.removedContacts += 1;
      }

      dedupePhonesAndEmails(db, primary.id);
      refreshGhostFlag(primary.id);
    }

    normalizeDuplicateCandidates(db);

    ensureUniqueNativeIdIndex(db);
  });

  return summary;
}
