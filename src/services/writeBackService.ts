/**
 * ContactForge — Write-back Service
 *
 * Pushes local contact data back to the native device contacts book
 * using expo-contacts. All operations require contacts permission.
 *
 * Two scenarios:
 *  - Contact was originally synced from native book (has native_id):
 *      → updateContactAsync to overwrite in place
 *  - Contact was created in-app only (no native_id):
 *      → addContactAsync to create in native book, then save the new native_id
 *
 * Platform note: expo-contacts write-back is available on both iOS and Android
 * in Expo managed workflow. No additional permissions beyond READ_CONTACTS are
 * needed on Android; iOS prompts at runtime.
 */

import * as Contacts from 'expo-contacts';
import {
  getContactWithDetails,
} from '../db/repositories/contactRepository';
import { getDatabase } from '../db';
import { logAction } from '../db/repositories/auditRepository';
import { now } from '../utils/normalization';

export type WriteBackResult =
  | { success: true; nativeId: string; created: boolean }
  | { success: false; error: string };

/**
 * Writes a single local contact back to the device's native contacts book.
 * On success the contact's native_id is updated (if newly created).
 */
export async function writeContactToNative(
  contactId: number,
): Promise<WriteBackResult> {
  // Verify permission
  const { status } = await Contacts.getPermissionsAsync();
  if (status !== 'granted') {
    return { success: false, error: 'Contacts permission is not granted.' };
  }

  const contact = getContactWithDetails(contactId);
  if (!contact) {
    return { success: false, error: 'Contact not found in local database.' };
  }

  try {
    if (contact.nativeId) {
      // Update existing native contact — updateContactAsync takes { id } & Partial<ExistingContact>
      const updatePayload: { id: string } & Partial<Contacts.ExistingContact> = {
        id: contact.nativeId,
        contactType: Contacts.ContactTypes.Person,
        name: contact.displayName,
        firstName: contact.firstName ?? undefined,
        lastName: contact.lastName ?? undefined,
        company: contact.company ?? undefined,
        jobTitle: contact.jobTitle ?? undefined,
        note: contact.notes ?? undefined,
        phoneNumbers: contact.phoneNumbers.map((p) => ({
          label: p.label ?? 'mobile',
          number: p.number,
        })),
        emails: contact.emails.map((e) => ({
          label: e.label ?? 'home',
          email: e.email,
        })),
      };

      await Contacts.updateContactAsync(updatePayload);
      logAction('contact_updated', contactId, { writeBack: true, nativeId: contact.nativeId });

      return { success: true, nativeId: contact.nativeId, created: false };
    } else {
      // Create new native contact — addContactAsync takes Contact (contactType required)
      const newContact: Contacts.Contact = {
        contactType: Contacts.ContactTypes.Person,
        name: contact.displayName,
        firstName: contact.firstName ?? undefined,
        lastName: contact.lastName ?? undefined,
        company: contact.company ?? undefined,
        jobTitle: contact.jobTitle ?? undefined,
        note: contact.notes ?? undefined,
        phoneNumbers: contact.phoneNumbers.map((p) => ({
          label: p.label ?? 'mobile',
          number: p.number,
        })),
        emails: contact.emails.map((e) => ({
          label: e.label ?? 'home',
          email: e.email,
        })),
      };

      const newNativeId = await Contacts.addContactAsync(newContact);

      // Link the local contact to its new native ID and update syncedAt
      getDatabase().runSync(
        'UPDATE contacts SET native_id = ?, synced_at = ?, updated_at = ? WHERE id = ?',
        [newNativeId, now(), now(), contactId],
      );

      logAction('contact_created', contactId, { writeBack: true, newNativeId });

      return { success: true, nativeId: newNativeId, created: true };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  }
}

/**
 * Writes multiple contacts to the native book.
 * Returns per-contact results.
 */
export async function writeContactsToNative(
  contactIds: number[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < contactIds.length; i++) {
    const result = await writeContactToNative(contactIds[i]);
    if (result.success) succeeded++;
    else failed++;
    onProgress?.(i + 1, contactIds.length);
  }

  return { succeeded, failed };
}
