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
  insertPhoneNumber,
  insertEmail,
  deletePhonesByContactId,
  deleteEmailsByContactId,
} from '../db/repositories/contactRepository';
import { getDatabase } from '../db';
import { now } from '../utils/normalization';
import { SYNC_CHUNK_SIZE } from '../constants';

export interface SyncProgress {
  processed: number;
  total: number;
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
): Promise<{ synced: number; errors: number }> {
  const db = getDatabase();
  let cursor: string | undefined = undefined;
  let synced = 0;
  let errors = 0;
  let total = 0;
  const syncTimestamp = now();

  // Mark sync as running
  db.runSync(
    `UPDATE sync_state SET status = 'running', error_message = NULL WHERE id = 1`,
    [],
  );

  try {
    // First pass — get a count estimate
    const firstPage = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.ID],
      pageSize: 1,
    });
    total = firstPage.total ?? 0;

    // Reset cursor for actual sync
    cursor = undefined;

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
        after: cursor,
      });

      for (const contact of page.data) {
        try {
          upsertNativeContact(contact, syncTimestamp);
          synced++;
        } catch {
          errors++;
        }
      }

      onProgress?.({ processed: synced, total });

      if (!page.hasNextPage) break;
      cursor = page.cursor;
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    db.runSync(
      `UPDATE sync_state SET status = 'error', error_message = ? WHERE id = 1`,
      [message],
    );
    throw err;
  }

  return { synced, errors };
}

/**
 * Upserts a single native contact into the local database.
 * If the contact already exists (by native ID), its fields are updated.
 * Phone numbers and emails are replaced wholesale on update.
 */
function upsertNativeContact(
  contact: Contacts.Contact,
  syncTimestamp: string,
): void {
  if (!contact.id) return;

  const existing = getContactByNativeId(contact.id);

  if (existing) {
    // Update fields
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

    // Replace phones and emails
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
  }
}
