/**
 * ContactForge — Temporary Contact Repository
 *
 * Database operations for the temporary_contacts table.
 * A temporary contact is a LocalContact that has been flagged with
 * is_temporary = 1 AND has an entry here carrying an optional expiry timestamp.
 *
 * Expiry notes:
 * - expires_at = NULL means the contact does not auto-expire (kept until manual deletion).
 * - expires_at < NOW means the contact has expired and should be reviewed / deleted.
 */

import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type { TemporaryContact } from '../../types';

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

function rowToTemporaryContact(row: Record<string, unknown>): TemporaryContact {
  return {
    id: row.id as number,
    contactId: row.contact_id as number,
    expiresAt: (row.expires_at as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Insert / upsert
// ---------------------------------------------------------------------------

/**
 * Records a contact as temporary with an optional expiry timestamp.
 * If the contact is already in the table, updates the expiry and notes.
 */
export function upsertTemporaryContact(params: {
  contactId: number;
  expiresAt?: string | null;
  notes?: string | null;
}): void {
  const db = getDatabase();
  const ts = now();
  const existing = db.getFirstSync<{ id: number }>(
    'SELECT id FROM temporary_contacts WHERE contact_id = ?',
    [params.contactId],
  );

  if (existing) {
    db.runSync(
      `UPDATE temporary_contacts SET expires_at = ?, notes = ? WHERE contact_id = ?`,
      [params.expiresAt ?? null, params.notes ?? null, params.contactId],
    );
  } else {
    db.runSync(
      `INSERT INTO temporary_contacts (contact_id, expires_at, notes, created_at)
       VALUES (?,?,?,?)`,
      [params.contactId, params.expiresAt ?? null, params.notes ?? null, ts],
    );
    db.runSync(
      `UPDATE contacts SET is_temporary = 1, updated_at = ? WHERE id = ?`,
      [ts, params.contactId]
    );
  }
}

/**
 * Removes the temporary_contacts entry for a contact.
 * Does NOT delete the contact itself.
 */
export function removeTemporaryContactEntry(contactId: number): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync(
      'DELETE FROM temporary_contacts WHERE contact_id = ?',
      [contactId],
    );
    db.runSync(
      `UPDATE contacts SET is_temporary = 0, updated_at = ? WHERE id = ?`,
      [now(), contactId]
    );
  });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns all temporary_contacts rows ordered by creation date (newest first).
 */
export function getAllTemporaryContacts(): TemporaryContact[] {
  return getDatabase()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM temporary_contacts ORDER BY created_at DESC',
      [],
    )
    .map(rowToTemporaryContact);
}

/**
 * Returns temporary_contacts entries whose expiry timestamp is in the past.
 * Uses a joined query so callers can immediately act on the contact IDs.
 */
export function getExpiredTemporaryContacts(): TemporaryContact[] {
  const nowIso = now();
  return getDatabase()
    .getAllSync<Record<string, unknown>>(
      `SELECT tc.*
         FROM temporary_contacts tc
        WHERE tc.expires_at IS NOT NULL
          AND tc.expires_at < ?
        ORDER BY tc.expires_at ASC`,
      [nowIso],
    )
    .map(rowToTemporaryContact);
}

/**
 * Returns the number of temporary contacts that have expired.
 */
export function countExpiredTemporaryContacts(): number {
  const nowIso = now();
  const row = getDatabase().getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count
       FROM temporary_contacts
      WHERE expires_at IS NOT NULL AND expires_at < ?`,
    [nowIso],
  );
  return row?.count ?? 0;
}

/**
 * Returns the TemporaryContact entry for a specific contact, or null.
 */
export function getTemporaryContactEntry(contactId: number): TemporaryContact | null {
  const row = getDatabase().getFirstSync<Record<string, unknown>>(
    'SELECT * FROM temporary_contacts WHERE contact_id = ?',
    [contactId],
  );
  return row ? rowToTemporaryContact(row) : null;
}

/**
 * Moves a temporary contact entry to a new contact ID.
 * Returns true if an entry was moved.
 */
export function transferTemporaryContact(fromContactId: number, toContactId: number): boolean {
  const entry = getTemporaryContactEntry(fromContactId);
  if (!entry) return false;

  upsertTemporaryContact({
    contactId: toContactId,
    expiresAt: entry.expiresAt,
    notes: entry.notes,
  });

  return true;
}

/**
 * Hard-deletes the contacts row (and cascades to phone_numbers, emails,
 * and the temporary_contacts entry) for all expired temporary contacts.
 *
 * Returns the number of contacts deleted.
 * This is a destructive action — callers should confirm with the user first.
 */
export function purgeExpiredTemporaryContacts(): number {
  const expired = getExpiredTemporaryContacts();
  if (expired.length === 0) return 0;

  const db = getDatabase();
  db.withTransactionSync(() => {
    for (const tc of expired) {
      // Cascade deletes phone_numbers, emails, and temporary_contacts entries
      db.runSync('DELETE FROM contacts WHERE id = ?', [tc.contactId]);
    }
  });

  return expired.length;
}
