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
// Phase 8: Premium Feature Tables
// ---------------------------------------------------------------------------

export const CREATE_CONTACT_NOTES_TABLE = `
  CREATE TABLE IF NOT EXISTS contact_notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id  INTEGER NOT NULL,
    category    TEXT NOT NULL,  -- 'where_met', 'important_dates', 'family', 'work', 'custom'
    title       TEXT,
    content     TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_CONTACT_RELATIONSHIPS_TABLE = `
  CREATE TABLE IF NOT EXISTS contact_relationships (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id_from     INTEGER NOT NULL,
    contact_id_to       INTEGER NOT NULL,
    relationship_type   TEXT NOT NULL,  -- 'spouse', 'child', 'parent', 'sibling', 'colleague', 'manager', 'emergency_contact', 'referral', 'assistant', 'friend', 'custom'
    direction           TEXT NOT NULL,  -- 'bidirectional', 'one_way_from', 'one_way_to'
    notes               TEXT,
    created_at          TEXT NOT NULL,
    FOREIGN KEY (contact_id_from) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id_to) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_PROFILE_CARDS_TABLE = `
  CREATE TABLE IF NOT EXISTS profile_cards (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    first_name  TEXT,
    last_name   TEXT,
    job_title   TEXT,
    company     TEXT,
    phone       TEXT,
    email       TEXT,
    address     TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )
`;

// ---------------------------------------------------------------------------
// Phase 10: Relationship Intelligence
// ---------------------------------------------------------------------------

export const CREATE_CONTACT_CONTEXT_TABLE = `
  CREATE TABLE IF NOT EXISTS contact_context (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id            INTEGER NOT NULL UNIQUE,
    where_met             TEXT,              -- free-text: 'Conference 2024', 'Intro by Alex'
    relationship_strength TEXT NOT NULL DEFAULT 'neutral',  -- 'close' | 'active' | 'neutral' | 'dormant' | 'fading'
    warmth                INTEGER NOT NULL DEFAULT 50,       -- 0-100 subjective score
    last_interaction_at   TEXT,              -- ISO timestamp of last real interaction
    next_action           TEXT,              -- free-text: 'Send project update', 'Introduce to Sara'
    notes_plain           TEXT,              -- quick freeform context note
    created_at            TEXT NOT NULL,
    updated_at            TEXT NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_CONTACT_REMINDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS contact_reminders (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id        INTEGER NOT NULL,
    title             TEXT NOT NULL,         -- 'Follow up after meeting'
    due_at            TEXT NOT NULL,         -- ISO date string
    interval_days     INTEGER,               -- 30/60/90 for recurring; null = one-shot
    status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'done' | 'snoozed' | 'dismissed'
    notes             TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_NETWORK_SNAPSHOTS_TABLE = `
  CREATE TABLE IF NOT EXISTS network_snapshots (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    total_contacts        INTEGER NOT NULL,
    important_contacts    INTEGER NOT NULL,
    stale_contacts        INTEGER NOT NULL,
    overdue_follow_ups    INTEGER NOT NULL,
    active_relationships  INTEGER NOT NULL,
    warm_relationships    INTEGER NOT NULL,
    cold_relationships    INTEGER NOT NULL,
    created_at            TEXT NOT NULL UNIQUE
  )
`;

// ---------------------------------------------------------------------------
// Phase 9: Import Studio & Archive System Tables
// ---------------------------------------------------------------------------

export const CREATE_IMPORT_SESSIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS import_sessions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path         TEXT NOT NULL UNIQUE,
    file_type         TEXT NOT NULL,        -- 'csv' | 'vcf'
    status            TEXT NOT NULL DEFAULT 'planning',  -- 'planning' | 'mapping' | 'validating' | 'ready' | 'committed' | 'failed'
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL,
    summary_json      TEXT                  -- {total_rows, valid_rows, collisions, imported_count, error}
  )
`;

export const CREATE_IMPORT_ROWS_TABLE = `
  CREATE TABLE IF NOT EXISTS import_rows (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id            INTEGER NOT NULL,
    row_index             INTEGER NOT NULL,
    csv_row_json          TEXT NOT NULL,    -- Original CSV row as JSON
    validation_status     TEXT NOT NULL DEFAULT 'valid',  -- 'valid' | 'warning' | 'error'
    validation_errors     TEXT,              -- JSON array: ["missing_name", "invalid_phone"]
    mapped_contact_json   TEXT,              -- Mapped to contact schema
    collision_type        TEXT,              -- null | 'exact_match' | 'phone_overlap' | 'email_overlap' | 'name_overlap'
    collision_details     TEXT,              -- JSON: {contact_id: int, reason: string}
    is_imported           INTEGER DEFAULT 0, -- 1 if successfully imported
    FOREIGN KEY (session_id) REFERENCES import_sessions(id) ON DELETE CASCADE
  )
`;

export const CREATE_IMPORT_MAPPINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS import_mappings (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id        INTEGER NOT NULL,
    csv_column        TEXT NOT NULL,
    contact_field     TEXT NOT NULL,  -- 'display_name', 'phone', 'email', 'company', 'job_title', etc.
    is_custom_field   INTEGER DEFAULT 0,
    field_index       INTEGER DEFAULT 0,  -- Position for multi-value fields
    FOREIGN KEY (session_id) REFERENCES import_sessions(id) ON DELETE CASCADE
  )
`;

export const CREATE_CONTACT_ARCHIVE_TABLE = `
  CREATE TABLE IF NOT EXISTS contact_archive (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id            INTEGER NOT NULL UNIQUE,
    deleted_at            TEXT NOT NULL,    -- ISO timestamp
    reason                TEXT,              -- 'manual' | 'cleanup' | 'merge' | 'import_collision'
    archived_reason_json  TEXT,              -- {reason_detail, user_action, triggered_by}
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_CONTACT_PROTECTION_TABLE = `
  CREATE TABLE IF NOT EXISTS contact_protection (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id          INTEGER NOT NULL UNIQUE,
    is_protected        INTEGER DEFAULT 0,      -- 1 = Cannot edit/merge
    is_emergency        INTEGER DEFAULT 0,      -- 1 = Show prominently
    never_merge         INTEGER DEFAULT 0,      -- 1 = Never suggest merge
    is_favorite         INTEGER DEFAULT 0,      -- 1 = Starred
    custom_label        TEXT,                   -- Optional custom label
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )
`;

export const CREATE_UNDO_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS undo_history (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type         TEXT NOT NULL,    -- 'archive' | 'merge' | 'delete' | 'import'
    action_data_json    TEXT NOT NULL,    -- Full state snapshot for undo
    contact_id          INTEGER,
    created_at          TEXT NOT NULL,
    expires_at          TEXT NOT NULL     -- ISO timestamp (30 days from creation)
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

  // temporary_contacts
  `CREATE INDEX IF NOT EXISTS idx_temp_contacts_expires_at
     ON temporary_contacts(expires_at)`,

  // audit_logs
  `CREATE INDEX IF NOT EXISTS idx_audit_created_at
     ON audit_logs(created_at)`,

  // Phase 8: Premium features
  `CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id
     ON contact_notes(contact_id)`,
  `CREATE INDEX IF NOT EXISTS idx_relationships_contact_from
     ON contact_relationships(contact_id_from)`,
  `CREATE INDEX IF NOT EXISTS idx_relationships_contact_to
     ON contact_relationships(contact_id_to)`,

  // Phase 10: Relationship Intelligence
  `CREATE INDEX IF NOT EXISTS idx_contact_context_contact_id
     ON contact_context(contact_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reminders_contact_id
     ON contact_reminders(contact_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reminders_due_at
     ON contact_reminders(due_at)`,
  `CREATE INDEX IF NOT EXISTS idx_reminders_status
     ON contact_reminders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_snapshots_created_at
     ON network_snapshots(created_at)`,
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
  CREATE_CONTACT_NOTES_TABLE,
  CREATE_CONTACT_RELATIONSHIPS_TABLE,
  CREATE_PROFILE_CARDS_TABLE,
  CREATE_CONTACT_CONTEXT_TABLE,
  CREATE_CONTACT_REMINDERS_TABLE,
  CREATE_NETWORK_SNAPSHOTS_TABLE,
  // Phase 9: Import & Archive
  CREATE_IMPORT_SESSIONS_TABLE,
  CREATE_IMPORT_ROWS_TABLE,
  CREATE_IMPORT_MAPPINGS_TABLE,
  CREATE_CONTACT_ARCHIVE_TABLE,
  CREATE_CONTACT_PROTECTION_TABLE,
  CREATE_UNDO_HISTORY_TABLE,
  ...CREATE_INDEXES,
];
