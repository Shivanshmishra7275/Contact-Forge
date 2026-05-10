/**
 * ContactForge — Temporary Contact Service
 *
 * Business logic bridging the UI and the temporary contacts repository.
 */

import { logAction } from '../db/repositories/auditRepository';
import {
  upsertTemporaryContact,
  removeTemporaryContactEntry,
  purgeExpiredTemporaryContacts,
  countExpiredTemporaryContacts,
  getExpiredTemporaryContacts,
  getTemporaryContactEntry,
} from '../db/repositories/temporaryContactRepository';
import { getContactById } from '../db/repositories/contactRepository';

export function markContactAsTemporary(
  contactId: number,
  expiresAt: string | null,
  notes: string | null
): void {
  upsertTemporaryContact({ contactId, expiresAt, notes });
  logAction('contact_updated', contactId, {
    action: 'marked_temporary',
    expiresAt,
  });
}

export function unmarkContactAsTemporary(contactId: number): void {
  removeTemporaryContactEntry(contactId);
  logAction('contact_updated', contactId, {
    action: 'unmarked_temporary',
  });
}

export function reviewAndPurgeExpired(): number {
  const count = purgeExpiredTemporaryContacts();
  if (count > 0) {
    logAction('cleanup_applied', null, {
      action: 'purged_temporary_contacts',
      count,
    });
  }
  return count;
}

export {
  countExpiredTemporaryContacts,
  getExpiredTemporaryContacts,
  getTemporaryContactEntry,
};
