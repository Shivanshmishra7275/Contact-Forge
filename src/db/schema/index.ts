/**
 * ContactForge — SQLite Database Schema
 *
 * All CREATE TABLE statements with indexes.
 * Tables are created in order to satisfy foreign key dependencies.
 * Every field and index is documented inline.
 */

export const CREATE_CONTACTS_TABLE = `
  CREATE TABLE IF NOT EXISTS contacts (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    native_id         TEXT,              -- native device contact ID (may be null for app-created)
    first_name        TEXT,
    last_name         TEXT,
    display_name      TEXT NOT NULL DEFAULT '',
    normalized_name   TEXT NOT NULL DEFAULT '',  -- lowercase, stripped for search/dedup
    company           TEXT,
    job_title         TEXT,
    notes             TEXT,
    birthday          TEXT,              -- ISO date string
    image_uri         TEXT,
    has_thumbnail     INTEGER NOT NULL DEFAULT 0,
    is_temporary      INTEGER NOT NULL DEFAULT 0,
    is_ghost          INTEGER NOT NULL DEFAULT 0, -- no phone/email/name
    tags              TEXT NOT NULL DEFAULT '[]', -- JSON array of tag strings
    synced_at         TEXT,              -- ISO timestamp of last native sync
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  )
`;

export const CREATE_PHONE_NUMBERS_TABLE = `
  CREATE TABLE IF NOT EXISTS phone_numbers (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id        INTEGER NOT NULL,
    label             TEXT,
    number            TEXT NOT NULL,
    normalized_number TEXT NOT NULL,     -- digits only, includes country code when possible
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_EMAILS_TABLE = `
  CREATE TABLE IF NOT EXISTS emails (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id        INTEGER NOT NULL,
    label             TEXT,
    email             TEXT NOT NULL,
    normalized_email  TEXT NOT NULL,     -- lowercased, trimmed
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_DUPLICATE_CANDIDATES_TABLE = `
  CREATE TABLE IF NOT EXISTS duplicate_candidates (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id_a      INTEGER NOT NULL,
    contact_id_b      INTEGER NOT NULL,
    confidence        TEXT NOT NULL,     -- 'very_high' | 'high' | 'medium' | 'low'
    score             INTEGER NOT NULL DEFAULT 0,
    reasons           TEXT NOT NULL DEFAULT '[]', -- JSON array of reason strings
    status            TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'merged' | 'ignored' | 'safe'
    detected_at       TEXT NOT NULL,
    resolved_at       TEXT,
    FOREIGN KEY (contact_id_a) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id_b) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_DUPLICATE_GROUPS_TABLE = `
  CREATE TABLE IF NOT EXISTS duplicate_groups (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    representative_contact_id INTEGER NOT NULL,
    contact_ids               TEXT NOT NULL,  -- JSON array of contact IDs in the group
    status                    TEXT NOT NULL DEFAULT 'pending',
    created_at                TEXT NOT NULL,
    FOREIGN KEY (representative_contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_MERGE_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS merge_history (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    survivor_contact_id  INTEGER NOT NULL,
    merged_contact_ids   TEXT NOT NULL, -- JSON array
    snapshot_json        TEXT NOT NULL, -- full pre-merge state snapshot for rollback
    merged_at            TEXT NOT NULL
  )
`;

export const CREATE_TEMPORARY_CONTACTS_TABLE = `
  CREATE TABLE IF NOT EXISTS temporary_contacts (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id        INTEGER NOT NULL UNIQUE,
    expires_at        TEXT,   -- ISO timestamp; null = never expires
    notes             TEXT,
    created_at        TEXT NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_SYNC_STATE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_state (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    last_sync_at          TEXT,
    total_native_contacts INTEGER NOT NULL DEFAULT 0,
    total_local_contacts  INTEGER NOT NULL DEFAULT 0,
    status                TEXT NOT NULL DEFAULT 'idle',
    error_message         TEXT
  )
`;

export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`;

export const CREATE_AUDIT_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    action     TEXT NOT NULL,
    target_id  INTEGER,
    details    TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  )
`;

// ---------------------------------------------------------------------------
// Indexes — critical for performance with large contact libraries
// ---------------------------------------------------------------------------

export const CREATE_INDEXES = [
  // contacts
  `CREATE INDEX IF NOT EXISTS idx_contacts_native_id
     ON contacts(native_id)`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_normalized_name
     ON contacts(normalized_name)`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_is_temporary
     ON contacts(is_temporary)`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_updated_at
     ON contacts(updated_at)`,

  // phone_numbers
  `CREATE INDEX IF NOT EXISTS idx_phones_contact_id
     ON phone_numbers(contact_id)`,
  `CREATE INDEX IF NOT EXISTS idx_phones_normalized
     ON phone_numbers(normalized_number)`,

  // emails
  `CREATE INDEX IF NOT EXISTS idx_emails_contact_id
     ON emails(contact_id)`,
  `CREATE INDEX IF NOT EXISTS idx_emails_normalized
     ON emails(normalized_email)`,

  // duplicates
  `CREATE INDEX IF NOT EXISTS idx_dupes_contact_a
     ON duplicate_candidates(contact_id_a)`,
  `CREATE INDEX IF NOT EXISTS idx_dupes_contact_b
     ON duplicate_candidates(contact_id_b)`,
  `CREATE INDEX IF NOT EXISTS idx_dupes_status
     ON duplicate_candidates(status)`,
  `CREATE INDEX IF NOT EXISTS idx_dupes_score
     ON duplicate_candidates(score)`,

  // audit_logs
  `CREATE INDEX IF NOT EXISTS idx_audit_created_at
     ON audit_logs(created_at)`,
];

export const ALL_CREATE_STATEMENTS = [
  CREATE_CONTACTS_TABLE,
  CREATE_PHONE_NUMBERS_TABLE,
  CREATE_EMAILS_TABLE,
  CREATE_DUPLICATE_CANDIDATES_TABLE,
  CREATE_DUPLICATE_GROUPS_TABLE,
  CREATE_MERGE_HISTORY_TABLE,
  CREATE_TEMPORARY_CONTACTS_TABLE,
  CREATE_SYNC_STATE_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_AUDIT_LOGS_TABLE,
  ...CREATE_INDEXES,
];
