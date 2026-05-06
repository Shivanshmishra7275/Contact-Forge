/**
 * ContactForge — Contact Repository
 *
 * All database operations for the contacts table.
 * Never call SQLite directly from screens or services — always go through here.
 */

import { getDatabase } from '..';
import {
  normalizeName,
  buildDisplayName,
  normalizePhone,
  normalizeEmail,
  now,
} from '../../utils/normalization';
import type { LocalContact, ContactWithDetails, PhoneNumber, EmailAddress } from '../../types';
import { PAGE_SIZE } from '../../constants';

// ---------------------------------------------------------------------------
// Row mapper helpers
// ---------------------------------------------------------------------------

function rowToContact(row: Record<string, unknown>): LocalContact {
  return {
    id: row.id as number,
    nativeId: (row.native_id as string) ?? null,
    firstName: (row.first_name as string) ?? null,
    lastName: (row.last_name as string) ?? null,
    displayName: (row.display_name as string) ?? '',
    normalizedName: (row.normalized_name as string) ?? '',
    company: (row.company as string) ?? null,
    jobTitle: (row.job_title as string) ?? null,
    notes: (row.notes as string) ?? null,
    birthday: (row.birthday as string) ?? null,
    imageUri: (row.image_uri as string) ?? null,
    hasThumbnail: Boolean(row.has_thumbnail),
    isTemporary: Boolean(row.is_temporary),
    isGhost: Boolean(row.is_ghost),
    tags: (row.tags as string) ?? '[]',
    syncedAt: (row.synced_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPhone(row: Record<string, unknown>): PhoneNumber {
  return {
    id: row.id as number,
    contactId: row.contact_id as number,
    label: (row.label as string) ?? null,
    number: row.number as string,
    normalizedNumber: row.normalized_number as string,
  };
}

function rowToEmail(row: Record<string, unknown>): EmailAddress {
  return {
    id: row.id as number,
    contactId: row.contact_id as number,
    label: (row.label as string) ?? null,
    email: row.email as string,
    normalizedEmail: row.normalized_email as string,
  };
}

// ---------------------------------------------------------------------------
// Contact CRUD
// ---------------------------------------------------------------------------

export function insertContact(params: {
  nativeId?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  birthday?: string;
  imageUri?: string;
  hasThumbnail?: boolean;
  isTemporary?: boolean;
  tags?: string[];
  syncedAt?: string;
}): number {
  const db = getDatabase();
  const ts = now();
  const displayName = buildDisplayName(
    params.firstName ?? null,
    params.lastName ?? null,
    params.company ?? null,
    null,
  );
  const normalizedName = normalizeName(displayName);

  const result = db.runSync(
    `INSERT INTO contacts
       (native_id, first_name, last_name, display_name, normalized_name,
        company, job_title, notes, birthday, image_uri, has_thumbnail,
        is_temporary, tags, synced_at, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      params.nativeId ?? null,
      params.firstName ?? null,
      params.lastName ?? null,
      displayName,
      normalizedName,
      params.company ?? null,
      params.jobTitle ?? null,
      params.notes ?? null,
      params.birthday ?? null,
      params.imageUri ?? null,
      params.hasThumbnail ? 1 : 0,
      params.isTemporary ? 1 : 0,
      JSON.stringify(params.tags ?? []),
      params.syncedAt ?? null,
      ts,
      ts,
    ],
  );

  return result.lastInsertRowId;
}

export function updateContact(
  id: number,
  params: Partial<{
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    jobTitle: string | null;
    notes: string | null;
    birthday: string | null;
    imageUri: string | null;
    hasThumbnail: boolean;
    isTemporary: boolean;
    isGhost: boolean;
    tags: string[];
    syncedAt: string;
  }>,
): void {
  const db = getDatabase();
  const ts = now();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if ('firstName' in params) { fields.push('first_name = ?'); values.push(params.firstName ?? null); }
  if ('lastName' in params) { fields.push('last_name = ?'); values.push(params.lastName ?? null); }
  if ('company' in params) { fields.push('company = ?'); values.push(params.company ?? null); }
  if ('jobTitle' in params) { fields.push('job_title = ?'); values.push(params.jobTitle ?? null); }
  if ('notes' in params) { fields.push('notes = ?'); values.push(params.notes ?? null); }
  if ('birthday' in params) { fields.push('birthday = ?'); values.push(params.birthday ?? null); }
  if ('imageUri' in params) { fields.push('image_uri = ?'); values.push(params.imageUri ?? null); }
  if ('hasThumbnail' in params) { fields.push('has_thumbnail = ?'); values.push(params.hasThumbnail ? 1 : 0); }
  if ('isTemporary' in params) { fields.push('is_temporary = ?'); values.push(params.isTemporary ? 1 : 0); }
  if ('isGhost' in params) { fields.push('is_ghost = ?'); values.push(params.isGhost ? 1 : 0); }
  if ('tags' in params) { fields.push('tags = ?'); values.push(JSON.stringify(params.tags ?? [])); }
  if ('syncedAt' in params) { fields.push('synced_at = ?'); values.push(params.syncedAt ?? null); }

  if (fields.length === 0) return;

  // Recalculate display / normalized names if name fields changed
  if ('firstName' in params || 'lastName' in params || 'company' in params) {
    const current = getContactById(id);
    if (current) {
      const newDisplay = buildDisplayName(
        'firstName' in params ? params.firstName ?? null : current.firstName,
        'lastName' in params ? params.lastName ?? null : current.lastName,
        'company' in params ? params.company ?? null : current.company,
        null,
      );
      fields.push('display_name = ?', 'normalized_name = ?');
      values.push(newDisplay, normalizeName(newDisplay));
    }
  }

  fields.push('updated_at = ?');
  values.push(ts);
  values.push(id);

  db.runSync(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteContact(id: number): void {
  getDatabase().runSync('DELETE FROM contacts WHERE id = ?', [id]);
}

export function getContactById(id: number): LocalContact | null {
  const row = getDatabase().getFirstSync<Record<string, unknown>>(
    'SELECT * FROM contacts WHERE id = ?',
    [id],
  );
  return row ? rowToContact(row) : null;
}

export function getContactByNativeId(nativeId: string): LocalContact | null {
  const row = getDatabase().getFirstSync<Record<string, unknown>>(
    'SELECT * FROM contacts WHERE native_id = ?',
    [nativeId],
  );
  return row ? rowToContact(row) : null;
}

// ---------------------------------------------------------------------------
// Phone / Email CRUD
// ---------------------------------------------------------------------------

export function insertPhoneNumber(params: {
  contactId: number;
  label?: string;
  number: string;
}): void {
  getDatabase().runSync(
    `INSERT INTO phone_numbers (contact_id, label, number, normalized_number)
     VALUES (?,?,?,?)`,
    [params.contactId, params.label ?? null, params.number, normalizePhone(params.number)],
  );
}

export function insertEmail(params: {
  contactId: number;
  label?: string;
  email: string;
}): void {
  getDatabase().runSync(
    `INSERT INTO emails (contact_id, label, email, normalized_email)
     VALUES (?,?,?,?)`,
    [params.contactId, params.label ?? null, params.email, normalizeEmail(params.email)],
  );
}

export function deletePhonesByContactId(contactId: number): void {
  getDatabase().runSync('DELETE FROM phone_numbers WHERE contact_id = ?', [contactId]);
}

export function deleteEmailsByContactId(contactId: number): void {
  getDatabase().runSync('DELETE FROM emails WHERE contact_id = ?', [contactId]);
}

export function getPhonesByContactId(contactId: number): PhoneNumber[] {
  return getDatabase()
    .getAllSync<Record<string, unknown>>('SELECT * FROM phone_numbers WHERE contact_id = ?', [contactId])
    .map(rowToPhone);
}

export function getEmailsByContactId(contactId: number): EmailAddress[] {
  return getDatabase()
    .getAllSync<Record<string, unknown>>('SELECT * FROM emails WHERE contact_id = ?', [contactId])
    .map(rowToEmail);
}

// ---------------------------------------------------------------------------
// Contact with details (phones + emails)
// ---------------------------------------------------------------------------

export function getContactWithDetails(id: number): ContactWithDetails | null {
  const contact = getContactById(id);
  if (!contact) return null;
  return {
    ...contact,
    phoneNumbers: getPhonesByContactId(id),
    emails: getEmailsByContactId(id),
  };
}

// ---------------------------------------------------------------------------
// Paginated query
// ---------------------------------------------------------------------------

export interface ContactListParams {
  search?: string;
  isTemporary?: boolean;
  isGhost?: boolean;
  tag?: string;
  page?: number;
  pageSize?: number;
}

export function listContacts(params: ContactListParams = {}): LocalContact[] {
  const { search, isTemporary, isGhost, tag, page = 0, pageSize = PAGE_SIZE } = params;

  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (search) {
    const pattern = `%${normalizeName(search)}%`;
    conditions.push('(normalized_name LIKE ? OR EXISTS (SELECT 1 FROM phone_numbers WHERE contact_id = contacts.id AND normalized_number LIKE ?) OR EXISTS (SELECT 1 FROM emails WHERE contact_id = contacts.id AND normalized_email LIKE ?))');
    args.push(pattern, `%${search.replace(/\D/g, '')}%`, `%${search.toLowerCase()}%`);
  }
  if (typeof isTemporary === 'boolean') {
    conditions.push('is_temporary = ?');
    args.push(isTemporary ? 1 : 0);
  }
  if (typeof isGhost === 'boolean') {
    conditions.push('is_ghost = ?');
    args.push(isGhost ? 1 : 0);
  }
  if (tag) {
    conditions.push("tags LIKE ?");
    args.push(`%${tag}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = page * pageSize;

  return getDatabase()
    .getAllSync<Record<string, unknown>>(
      `SELECT * FROM contacts ${where} ORDER BY normalized_name ASC LIMIT ? OFFSET ?`,
      [...args, pageSize, offset],
    )
    .map(rowToContact);
}

export function countContacts(params: Omit<ContactListParams, 'page' | 'pageSize'> = {}): number {
  const { search, isTemporary, isGhost, tag } = params;
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (search) {
    const pattern = `%${normalizeName(search)}%`;
    conditions.push('(normalized_name LIKE ? OR EXISTS (SELECT 1 FROM phone_numbers WHERE contact_id = contacts.id AND normalized_number LIKE ?) OR EXISTS (SELECT 1 FROM emails WHERE contact_id = contacts.id AND normalized_email LIKE ?))');
    args.push(pattern, `%${search.replace(/\D/g, '')}%`, `%${search.toLowerCase()}%`);
  }
  if (typeof isTemporary === 'boolean') {
    conditions.push('is_temporary = ?');
    args.push(isTemporary ? 1 : 0);
  }
  if (typeof isGhost === 'boolean') {
    conditions.push('is_ghost = ?');
    args.push(isGhost ? 1 : 0);
  }
  if (tag) {
    conditions.push('tags LIKE ?');
    args.push(`%${tag}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const row = getDatabase().getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM contacts ${where}`,
    args,
  );
  return row?.count ?? 0;
}

export function getAllContactIds(): number[] {
  return getDatabase()
    .getAllSync<{ id: number }>('SELECT id FROM contacts ORDER BY id', [])
    .map((r) => r.id);
}

// ---------------------------------------------------------------------------
// Temporary contacts helpers
// ---------------------------------------------------------------------------

/**
 * Inserts a row in temporary_contacts to track expiry metadata for a
 * contact that was created with isTemporary = true.
 */
export function insertTemporaryContactMeta(params: {
  contactId: number;
  expiresAt?: string | null;
  notes?: string | null;
}): void {
  getDatabase().runSync(
    `INSERT OR IGNORE INTO temporary_contacts (contact_id, expires_at, notes, created_at)
     VALUES (?,?,?,?)`,
    [params.contactId, params.expiresAt ?? null, params.notes ?? null, now()],
  );
}

/**
 * Returns IDs of temporary contacts whose expiry date has passed.
 */
export function getExpiredTemporaryContactIds(): number[] {
  const currentIso = now();
  return getDatabase()
    .getAllSync<{ contact_id: number }>(
      `SELECT tc.contact_id
         FROM temporary_contacts tc
         JOIN contacts c ON c.id = tc.contact_id
        WHERE c.is_temporary = 1
          AND tc.expires_at IS NOT NULL
          AND tc.expires_at < ?`,
      [currentIso],
    )
    .map((r) => r.contact_id);
}

/**
 * Deletes all contacts whose temporary expiry has passed.
 * Returns the number of contacts removed.
 */
export function purgeExpiredTemporaryContacts(): number {
  const ids = getExpiredTemporaryContactIds();
  if (ids.length === 0) return 0;

  const db = getDatabase();
  db.withTransactionSync(() => {
    for (const id of ids) {
      db.runSync('DELETE FROM contacts WHERE id = ?', [id]);
    }
  });

  return ids.length;
}
