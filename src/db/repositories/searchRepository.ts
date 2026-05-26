/**
 * ContactForge — FTS Search Repository
 *
 * Manages the contacts_fts virtual table. All callers go through this
 * module; no screen or service touches FTS SQL directly.
 *
 * Table schema (created dynamically based on probe result):
 *
 *   FTS5:  CREATE VIRTUAL TABLE contacts_fts USING fts5(
 *            display_name, company, phones, emails, tags, notes,
 *            tokenize='ascii'
 *          )
 *   FTS4:  CREATE VIRTUAL TABLE contacts_fts USING fts4(
 *            display_name, company, phones, emails, tags, notes
 *          )
 *
 * The rowid of each FTS row == the contacts.id it represents.
 * All columns are stored as lowercase space-separated tokens.
 *
 * Index maintenance: callers (contactRepository) call upsertContactFts()
 * after any write and removeContactFts() before any delete. This is
 * intentionally explicit so callers control the transaction boundary.
 */

import type * as SQLiteTypes from 'expo-sqlite';
import { getCachedFtsMode, type FtsMode } from '../ftsProbe';

// ---------------------------------------------------------------------------
// Internal: db accessor (lazy, safe after init)
// ---------------------------------------------------------------------------
// We import getDatabase lazily in functions that are called POST-init only.
// createFtsTable and populateFtsFromExisting accept the db instance directly
// to avoid the circular dependency that would arise from importing getDatabase
// at module level while db/index.ts is still constructing.
function getDb(): SQLiteTypes.SQLiteDatabase {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('..').getDatabase() as SQLiteTypes.SQLiteDatabase;
}

// ---------------------------------------------------------------------------
// FTS table lifecycle
// ---------------------------------------------------------------------------

/**
 * Creates the contacts_fts virtual table for the given mode.
 * Accepts db directly to avoid circular import at init time.
 * Idempotent — uses IF NOT EXISTS.
 */
export function createFtsTable(db: SQLiteTypes.SQLiteDatabase, mode: FtsMode): void {
  if (mode === 'none') return;
  try {
    if (mode === 'fts5') {
      db.execSync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS contacts_fts USING fts5(" +
        "display_name, company, phones, emails, tags, notes, tokenize='ascii')"
      );
    } else {
      db.execSync(
        'CREATE VIRTUAL TABLE IF NOT EXISTS contacts_fts USING fts4(' +
        'display_name, company, phones, emails, tags, notes)'
      );
    }
  } catch (e) {
    console.warn('[FTS] Failed to create contacts_fts table:', e);
  }
}

/**
 * Populates FTS index from all existing contacts.
 * Accepts db directly to avoid circular import at init time.
 * Safe to call multiple times — checks if already populated first.
 */
export function populateFtsFromExisting(db: SQLiteTypes.SQLiteDatabase): void {
  const mode = getCachedFtsMode();
  if (!mode || mode === 'none') return;

  try {
    const existing = db.getFirstSync<{ c: number }>(
      'SELECT COUNT(*) as c FROM contacts_fts'
    );
    const ftsCount = existing?.c ?? 0;
    const contactCount = db.getFirstSync<{ c: number }>(
      'SELECT COUNT(*) as c FROM contacts'
    )?.c ?? 0;

    // Re-populate if the FTS table is empty but contacts exist
    if (ftsCount === 0 && contactCount > 0) {
      const contacts = db.getAllSync<{
        id: number;
        display_name: string;
        company: string | null;
        tags: string;
        notes: string | null;
      }>(
        'SELECT id, display_name, company, tags, notes FROM contacts',
        []
      );

      db.withTransactionSync(() => {
        for (const c of contacts) {
          const phones = db.getAllSync<{ normalized_number: string }>(
            'SELECT normalized_number FROM phone_numbers WHERE contact_id = ?',
            [c.id]
          ).map(r => r.normalized_number).join(' ');

          const emails = db.getAllSync<{ normalized_email: string }>(
            'SELECT normalized_email FROM emails WHERE contact_id = ?',
            [c.id]
          ).map(r => r.normalized_email).join(' ');

          const tagsText = buildTagText(c.tags);

          db.runSync(
            `INSERT INTO contacts_fts(rowid, display_name, company, phones, emails, tags, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.display_name.toLowerCase(), c.company?.toLowerCase() ?? '',
             phones, emails, tagsText, c.notes?.toLowerCase() ?? '']
          );
        }
      });

      console.log(`[FTS] Populated ${contacts.length} contacts into index.`);
    }
  } catch (e) {
    console.warn('[FTS] populateFtsFromExisting failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Index maintenance
// ---------------------------------------------------------------------------

/**
 * Upserts the FTS index entry for a single contact.
 * Call this after any INSERT or UPDATE on contacts, phone_numbers, or emails.
 */
export function upsertContactFts(contactId: number): void {
  const mode = getCachedFtsMode();
  if (!mode || mode === 'none') return;
  const db = getDb();

  try {
    const contact = db.getFirstSync<{
      display_name: string;
      company: string | null;
      tags: string;
      notes: string | null;
    }>(
      'SELECT display_name, company, tags, notes FROM contacts WHERE id = ?',
      [contactId]
    );
    if (!contact) return;

    const phones = db.getAllSync<{ normalized_number: string }>(
      'SELECT normalized_number FROM phone_numbers WHERE contact_id = ?',
      [contactId]
    ).map(r => r.normalized_number).join(' ');

    const emails = db.getAllSync<{ normalized_email: string }>(
      'SELECT normalized_email FROM emails WHERE contact_id = ?',
      [contactId]
    ).map(r => r.normalized_email).join(' ');

    const tagsText = buildTagText(contact.tags);

    // FTS has no UPDATE: delete then reinsert
    db.runSync('DELETE FROM contacts_fts WHERE rowid = ?', [contactId]);
    db.runSync(
      `INSERT INTO contacts_fts(rowid, display_name, company, phones, emails, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        contactId,
        contact.display_name.toLowerCase(),
        contact.company?.toLowerCase() ?? '',
        phones,
        emails,
        tagsText,
        contact.notes?.toLowerCase() ?? '',
      ]
    );
  } catch (e) {
    console.warn('[FTS] upsertContactFts failed for id', contactId, ':', e);
  }
}

/**
 * Removes the FTS index entry for a contact.
 * Call this BEFORE deleting the contact row so data is still readable.
 */
export function removeContactFts(contactId: number): void {
  const mode = getCachedFtsMode();
  if (!mode || mode === 'none') return;
  try {
    getDb().runSync('DELETE FROM contacts_fts WHERE rowid = ?', [contactId]);
  } catch (e) {
    console.warn('[FTS] removeContactFts failed for id', contactId, ':', e);
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Returns a ranked list of contact IDs matching the query.
 * FTS5: uses BM25 rank (ORDER BY rank).
 * FTS4: uses match score (unordered by relevance, sorted by rowid).
 * Falls back to empty array if FTS is unavailable (caller uses LIKE).
 *
 * @param query  Raw user input string
 * @param limit  Maximum IDs to return (default 300)
 */
export function searchContactIdsFts(query: string, limit = 300): number[] {
  const mode = getCachedFtsMode();
  if (!mode || mode === 'none') return [];

  const matchTerm = buildMatchTerm(query);
  if (!matchTerm) return [];

  const db = getDb();
  try {
    let sql: string;
    if (mode === 'fts5') {
      sql = `SELECT rowid FROM contacts_fts WHERE contacts_fts MATCH ? ORDER BY rank LIMIT ?`;
    } else {
      sql = `SELECT rowid FROM contacts_fts WHERE contacts_fts MATCH ? LIMIT ?`;
    }
    const rows = db.getAllSync<{ rowid: number }>(sql, [matchTerm, limit]);
    return rows.map(r => r.rowid);
  } catch (e) {
    console.warn('[FTS] searchContactIdsFts failed, falling back to LIKE:', e);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a JSON tag array string into space-separated lowercase tokens.
 * ["Client","VIP"] → "client vip"
 */
function buildTagText(tagsJson: string): string {
  try {
    const arr = JSON.parse(tagsJson) as string[];
    return arr.map(t => t.toLowerCase()).join(' ');
  } catch {
    return '';
  }
}

/**
 * Builds an FTS MATCH expression from raw user input.
 *
 * Strategy:
 *  - Split on whitespace
 *  - Each token becomes a quoted prefix term: "token"*
 *  - Tokens are ANDed → all terms must appear somewhere in the row
 *  - Special case: if input is all digits (≥ 4), search phones column
 *    specifically for better phone number matching
 *
 * Examples:
 *   "john"        → "john"*
 *   "john doe"    → "john"* "doe"*
 *   "5551234"     → phones:"5551234"*
 */
export function buildMatchTerm(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Pure digit input → search phones column specifically
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 4 && digits === trimmed.replace(/[\s\-().+]/g, '')) {
    return `phones:"${digits}"*`;
  }

  // General text → prefix match on each word, AND semantics
  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens
    .map(t => `"${t.replace(/"/g, '')}"*`)
    .join(' ');
}
