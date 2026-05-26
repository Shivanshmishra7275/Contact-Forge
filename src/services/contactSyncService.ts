/**
 * ContactForge — Contact Ingestion Service
 *
 * Reads native contacts via expo-contacts and mirrors them into SQLite.
 * Uses chunked processing to keep the UI responsive for large libraries.
 *
 * Limitations documented:
 * - expo-contacts does not provide real-time call-log data
 * - Contact change listener support varies by platform/Expo version
 */

import * as Contacts from 'expo-contacts';
import {
  insertContact,
  updateContact,
  getContactByNativeId,
  getPhonesByContactId,
  getEmailsByContactId,
  insertPhoneNumber,
  insertEmail,
  deletePhonesByContactId,
  deleteEmailsByContactId,
  deleteContact,
  listNativeContactIds,
} from '../db/repositories/contactRepository';
import { upsertContactFts } from '../db/repositories/searchRepository';
import { getDatabase } from '../db';
import { logAction } from '../db/repositories/auditRepository';
import { normalizeEmail, normalizePhone, now } from '../utils/normalization';
import { SYNC_CHUNK_SIZE } from '../constants';
import { repairDuplicateNativeContacts, type NativeIdRepairSummary } from './syncRepairService';

export interface SyncProgress {
  processed: number;
  total: number;
}

export interface SyncResult {
  synced: number;
  errors: number;
  added: number;
  updated: number;
  unchanged: number;
  removed: number;
  repairs?: NativeIdRepairSummary;
}

type ProgressCallback = (progress: SyncProgress) => void;

/**
 * Requests contacts permission.
 * Returns true if granted, false otherwise.
 */
export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Gets the current contacts permission status without requesting.
 */
export async function getContactsPermissionStatus(): Promise<Contacts.PermissionStatus> {
  const { status } = await Contacts.getPermissionsAsync();
  return status;
}

/**
 * Fetches all native contacts and mirrors them into the local SQLite database.
 * Uses pagination (chunks) to avoid loading thousands of contacts at once.
 *
 * @param onProgress - optional callback called after each chunk
 */
export async function syncContactsToLocal(
  onProgress?: ProgressCallback,
): Promise<SyncResult> {
  const db = getDatabase();
  let synced = 0;
  let errors = 0;
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let removed = 0;
  let total = 0;
  let repairs: NativeIdRepairSummary | undefined;
  const syncTimestamp = now();
  const seenNativeIds = new Set<string>();

  const currentState = db.getFirstSync<{ status: string }>(
    'SELECT status FROM sync_state WHERE id = 1',
    [],
  );
  if (currentState?.status === 'running') {
    throw new Error('Sync is already running. Please wait for it to finish.');
  }

  // Mark sync as running
  db.runSync(
    `UPDATE sync_state SET status = 'running', error_message = NULL WHERE id = 1`,
    [],
  );

  try {
    repairs = repairDuplicateNativeContacts();

    // First pass — count the native contacts using the documented pageOffset API.
    total = await countNativeContacts();

    let pageOffset = 0;

    while (true) {
      const page = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.ID,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Note,
          Contacts.Fields.Birthday,
          Contacts.Fields.Image,
        ],
        pageSize: SYNC_CHUNK_SIZE,
        pageOffset,
      });

      for (const contact of page.data as Contacts.ExistingContact[]) {
        try {
          seenNativeIds.add(contact.id);
          const outcome = upsertNativeContact(contact, syncTimestamp);
          if (outcome === 'added') added++;
          else if (outcome === 'updated') updated++;
          else unchanged++;
          synced++;
        } catch {
          errors++;
        }
      }

      onProgress?.({ processed: synced, total });

      if (!page.hasNextPage) break;
      pageOffset += page.data.length;
    }

    // Remove local contacts that no longer exist in native address book.
    const localNativeContacts = listNativeContactIds();
    const toRemove = localNativeContacts.filter((row) => !seenNativeIds.has(row.nativeId));
    if (toRemove.length > 0) {
      db.withTransactionSync(() => {
        for (const row of toRemove) {
          deleteContact(row.id);
          removed++;
        }
      });
    }

    // Update sync state on success
    db.runSync(
      `UPDATE sync_state
         SET status = 'idle',
             last_sync_at = ?,
             total_native_contacts = ?,
             total_local_contacts = (SELECT COUNT(*) FROM contacts)
       WHERE id = 1`,
      [syncTimestamp, total],
    );
    logAction('contacts_synced', null, {
      synced,
      errors,
      totalNative: total,
      added,
      updated,
      unchanged,
      removed,
      repairs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    db.runSync(
      `UPDATE sync_state SET status = 'error', error_message = ? WHERE id = 1`,
      [message],
    );
    throw err;
  }

  return { synced, errors, added, updated, unchanged, removed, repairs };
}

/**
 * Upserts a single native contact into the local database.
 * If the contact already exists (by native ID), its fields are updated.
 * Phone numbers and emails are replaced wholesale on update.
 */
async function countNativeContacts(): Promise<number> {
  let total = 0;
  let pageOffset = 0;

  while (true) {
    const page = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.ID],
      pageSize: SYNC_CHUNK_SIZE,
      pageOffset,
    });

    total += page.data.length;
    if (!page.hasNextPage) break;
    pageOffset += page.data.length;
  }

  return total;
}

type UpsertOutcome = 'added' | 'updated' | 'unchanged';

function upsertNativeContact(
  contact: Contacts.ExistingContact,
  syncTimestamp: string,
): UpsertOutcome {
  const existing = getContactByNativeId(contact.id);
  const incomingPhones = (contact.phoneNumbers ?? [])
    .map((p) => normalizePhone(p.number))
    .filter(Boolean);
  const incomingEmails = (contact.emails ?? [])
    .map((e) => normalizeEmail(e.email))
    .filter(Boolean);

  const hasFieldChanges = (base: typeof existing): boolean => {
    if (!base) return true;
    const normalize = (value: string | null | undefined) => value ?? null;
    const hasChanged = (
      normalize(base.firstName) !== normalize(contact.firstName) ||
      normalize(base.lastName) !== normalize(contact.lastName) ||
      normalize(base.company) !== normalize(contact.company) ||
      normalize(base.jobTitle) !== normalize(contact.jobTitle) ||
      normalize(base.notes) !== normalize(contact.note) ||
      normalize(base.imageUri) !== normalize(contact.imageAvailable ? contact.image?.uri ?? null : null) ||
      Boolean(base.hasThumbnail) !== Boolean(contact.imageAvailable)
    );

    const currentPhones = new Set(getPhonesByContactId(base.id).map((p) => p.normalizedNumber));
    const nextPhones = new Set(incomingPhones);
    const currentEmails = new Set(getEmailsByContactId(base.id).map((e) => e.normalizedEmail));
    const nextEmails = new Set(incomingEmails);

    const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
      if (a.size !== b.size) return false;
      for (const val of a) {
        if (!b.has(val)) return false;
      }
      return true;
    };

    return hasChanged || !setsEqual(currentPhones, nextPhones) || !setsEqual(currentEmails, nextEmails);
  };

  if (existing) {
    const changed = hasFieldChanges(existing);
    updateContact(existing.id, {
      firstName: contact.firstName ?? null,
      lastName: contact.lastName ?? null,
      company: contact.company ?? null,
      jobTitle: contact.jobTitle ?? null,
      notes: contact.note ?? null,
      imageUri: contact.imageAvailable ? contact.image?.uri ?? null : null,
      hasThumbnail: Boolean(contact.imageAvailable),
      syncedAt: syncTimestamp,
    });

    if (changed) {
      deletePhonesByContactId(existing.id);
      deleteEmailsByContactId(existing.id);

      for (const p of contact.phoneNumbers ?? []) {
        if (p.number) {
          insertPhoneNumber({ contactId: existing.id, label: p.label ?? undefined, number: p.number });
        }
      }
      for (const e of contact.emails ?? []) {
        if (e.email) {
          insertEmail({ contactId: existing.id, label: e.label ?? undefined, email: e.email });
        }
      }
      
      // Update FTS after all sub-entities are added
      upsertContactFts(existing.id);
    }

    return changed ? 'updated' : 'unchanged';
  } else {
    // Insert new contact
    const contactId = insertContact({
      nativeId: contact.id,
      firstName: contact.firstName ?? undefined,
      lastName: contact.lastName ?? undefined,
      company: contact.company ?? undefined,
      jobTitle: contact.jobTitle ?? undefined,
      notes: contact.note ?? undefined,
      imageUri: contact.imageAvailable ? contact.image?.uri ?? undefined : undefined,
      hasThumbnail: Boolean(contact.imageAvailable),
      syncedAt: syncTimestamp,
    });

    for (const p of contact.phoneNumbers ?? []) {
      if (p.number) {
        insertPhoneNumber({ contactId, label: p.label ?? undefined, number: p.number });
      }
    }
    for (const e of contact.emails ?? []) {
      if (e.email) {
        insertEmail({ contactId, label: e.label ?? undefined, email: e.email });
      }
    }

    // Update FTS after all sub-entities are added
    upsertContactFts(contactId);

    return 'added';
  }
}
