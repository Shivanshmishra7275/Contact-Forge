# Contact Forge Database Schema

> ⚠️ **Deprecated / out-of-date:** This file does **not** currently match the implemented SQLite schema.
>
> **Source of truth:** `src\\db\\schema\\index.ts`
>
> For an accurate overview, see: `docs\\ACTUAL_DATABASE_SCHEMA.md`


## 1. Overview

### Design Philosophy

Contact Forge uses an **offline-first, SQLite-based schema** designed to enable powerful contact management capabilities while supporting large contact libraries (1000s of records) with minimal performance degradation.

**Key Design Principles:**
- **Normalization**: Related data (phone numbers, emails) separated into dedicated tables to avoid redundancy and ensure data integrity
- **Performance**: Strategic indexes on high-cardinality fields (phone numbers, emails) and frequently-queried columns
- **Extensibility**: Flexible schema supporting premium features (notes, relationships, profile cards) and future phases (import studio, archive system)
- **Offline-First**: Complete data persistence in SQLite without server dependency
- **Data Integrity**: Foreign key constraints with cascading deletes to maintain referential integrity

### Schema Evolution

The schema has grown incrementally across development phases, with each phase adding capabilities while maintaining backward compatibility:
- **Phase 0**: Foundation (contacts, phone_numbers, emails)
- **Phase 3**: Duplicate detection system
- **Phase 4**: Temporary contacts for import staging
- **Phase 6**: Merge history and export tracking
- **Phase 8**: Notes, relationships, profile cards (My Card)
- **Phase 9** (Planned): Import studio, archive system, undo history

---

## 2. Core Tables

### 2.1 contacts

**Purpose**: Central table storing all contact records with metadata.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| display_name | TEXT | NOT NULL | Full contact name (e.g., "John Doe") |
| first_name | TEXT | | First name (indexed for search) |
| last_name | TEXT | | Last name (indexed for search) |
| company | TEXT | | Organization/company name |
| job_title | TEXT | | Professional title |
| photo_uri | TEXT | | Local file path or URI to contact photo |
| notes | TEXT | | Legacy notes field (deprecated in favor of contact_notes table) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |
| is_favorite | INTEGER | DEFAULT 0 | Boolean flag for starred/favorite contacts |
| contact_type | TEXT | DEFAULT 'personal' | Type: 'personal', 'business', 'family', 'friend' |
| birthday | DATE | | Contact's date of birth (for reminders) |
| custom_field_1 | TEXT | | Extensible custom field |
| custom_field_2 | TEXT | | Extensible custom field |
| health_score | INTEGER | DEFAULT 0 | Calculated completeness score (0-100) |

**Foreign Keys**: None (contacts table is root)

**Indexes**:
```sql
CREATE INDEX idx_contacts_display_name ON contacts(display_name);
CREATE INDEX idx_contacts_first_name ON contacts(first_name);
CREATE INDEX idx_contacts_last_name ON contacts(last_name);
CREATE INDEX idx_contacts_is_favorite ON contacts(is_favorite);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_company ON contacts(company);
```

**Constraints**:
- Foreign key cascades: Not applicable (root table)
- NOT NULL: display_name
- UNIQUE: id (primary key)

**Example Queries**:

```sql
-- Find contact by name
SELECT * FROM contacts WHERE display_name LIKE '%John%' LIMIT 10;

-- Get all favorite contacts sorted by creation date
SELECT * FROM contacts WHERE is_favorite = 1 ORDER BY created_at DESC;

-- Calculate average health score across all contacts
SELECT AVG(health_score) as avg_health FROM contacts;

-- Find contacts created in the last 30 days
SELECT * FROM contacts WHERE created_at >= datetime('now', '-30 days');

-- Search by company with pagination
SELECT * FROM contacts WHERE company = 'Acme Corp' ORDER BY display_name LIMIT 20 OFFSET 0;
```

---

### 2.2 phone_numbers

**Purpose**: Normalized storage of phone numbers with type classification. Enables efficient duplicate detection and multiple contacts per phone number.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| contact_id | TEXT | NOT NULL, FOREIGN KEY | Reference to contacts.id |
| number | TEXT | NOT NULL | Raw phone number (with formatting) |
| normalized_number | TEXT | NOT NULL, UNIQUE | Normalized: digits only, no spaces/dashes |
| phone_type | TEXT | DEFAULT 'mobile' | Type: 'mobile', 'home', 'work', 'other' |
| is_primary | INTEGER | DEFAULT 0 | Boolean: primary contact number |
| is_whatsapp | INTEGER | DEFAULT 0 | Boolean: enabled for WhatsApp |
| is_telegram | INTEGER | DEFAULT 0 | Boolean: enabled for Telegram |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

**Foreign Keys**:
```sql
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
```

**Indexes**:
```sql
CREATE INDEX idx_phone_contact_id ON phone_numbers(contact_id);
CREATE INDEX idx_phone_normalized_number ON phone_numbers(normalized_number);
CREATE UNIQUE INDEX idx_phone_normalized_unique ON phone_numbers(normalized_number);
CREATE INDEX idx_phone_primary ON phone_numbers(is_primary);
CREATE INDEX idx_phone_type ON phone_numbers(phone_type);
```

**Constraints**:
- NOT NULL: contact_id, number, normalized_number
- UNIQUE: normalized_number (ensures no duplicate normalized numbers globally)
- ON DELETE CASCADE: Deleting contact cascades to all phone_numbers

**Example Queries**:

```sql
-- Find contact by normalized phone number
SELECT c.* FROM contacts c
JOIN phone_numbers p ON c.id = p.contact_id
WHERE p.normalized_number = '9876543210';

-- Get all phone numbers for a contact
SELECT * FROM phone_numbers WHERE contact_id = 'abc-123' ORDER BY is_primary DESC;

-- Find duplicate phone numbers (same number, different contacts)
SELECT normalized_number, COUNT(DISTINCT contact_id) as contact_count
FROM phone_numbers
GROUP BY normalized_number
HAVING contact_count > 1
ORDER BY contact_count DESC;

-- Get all WhatsApp-enabled numbers
SELECT c.display_name, p.number FROM contacts c
JOIN phone_numbers p ON c.id = p.contact_id
WHERE p.is_whatsapp = 1;

-- Find primary phone for each contact
SELECT DISTINCT ON (contact_id) * FROM phone_numbers
WHERE is_primary = 1 ORDER BY contact_id;
```

---

### 2.3 emails

**Purpose**: Normalized storage of email addresses with type classification. Similar structure to phone_numbers for consistency.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| contact_id | TEXT | NOT NULL, FOREIGN KEY | Reference to contacts.id |
| email | TEXT | NOT NULL | Email address (case-insensitive matching) |
| normalized_email | TEXT | NOT NULL, UNIQUE | Lowercase, trimmed email |
| email_type | TEXT | DEFAULT 'personal' | Type: 'personal', 'work', 'other' |
| is_primary | INTEGER | DEFAULT 0 | Boolean: primary email |
| is_verified | INTEGER | DEFAULT 0 | Boolean: email verified (future) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

**Foreign Keys**:
```sql
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
```

**Indexes**:
```sql
CREATE INDEX idx_email_contact_id ON emails(contact_id);
CREATE INDEX idx_email_normalized ON emails(normalized_email);
CREATE UNIQUE INDEX idx_email_normalized_unique ON emails(normalized_email);
CREATE INDEX idx_email_primary ON emails(is_primary);
CREATE INDEX idx_email_type ON emails(email_type);
```

**Constraints**:
- NOT NULL: contact_id, email, normalized_email
- UNIQUE: normalized_email
- ON DELETE CASCADE: Deleting contact cascades to all emails

**Example Queries**:

```sql
-- Find contact by email
SELECT c.* FROM contacts c
JOIN emails e ON c.id = e.contact_id
WHERE e.normalized_email = 'john.doe@example.com';

-- Get all emails for a contact
SELECT * FROM emails WHERE contact_id = 'abc-123' ORDER BY is_primary DESC;

-- Find duplicate emails (spam detection)
SELECT normalized_email, COUNT(DISTINCT contact_id) as contact_count
FROM emails
GROUP BY normalized_email
HAVING contact_count > 1;

-- Get work email addresses
SELECT c.display_name, e.email FROM contacts c
JOIN emails e ON c.id = e.contact_id
WHERE e.email_type = 'work';

-- Count contacts with verified emails
SELECT COUNT(DISTINCT contact_id) as verified_count FROM emails WHERE is_verified = 1;
```

---

### 2.4 tags

**Purpose**: Flexible tagging system for organizing and categorizing contacts (many-to-many relationship).

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| contact_id | TEXT | NOT NULL, FOREIGN KEY | Reference to contacts.id |
| tag_name | TEXT | NOT NULL | Tag label (e.g., "important", "vip", "project-x") |
| tag_color | TEXT | | Hex color for UI display (#FF5733) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Foreign Keys**:
```sql
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
```

**Indexes**:
```sql
CREATE INDEX idx_tags_contact_id ON tags(contact_id);
CREATE INDEX idx_tags_tag_name ON tags(tag_name);
CREATE UNIQUE INDEX idx_tags_unique ON tags(contact_id, tag_name);
```

**Constraints**:
- NOT NULL: contact_id, tag_name
- UNIQUE: (contact_id, tag_name) - prevents duplicate tags on same contact
- ON DELETE CASCADE: Deleting contact cascades to all tags

**Example Queries**:

```sql
-- Find all contacts with a specific tag
SELECT DISTINCT c.* FROM contacts c
JOIN tags t ON c.id = t.contact_id
WHERE t.tag_name = 'vip';

-- Get all tags for a contact
SELECT tag_name, tag_color FROM tags WHERE contact_id = 'abc-123';

-- Find most common tags
SELECT tag_name, COUNT(*) as count FROM tags
GROUP BY tag_name ORDER BY count DESC LIMIT 10;

-- Find contacts with multiple tags (intersection)
SELECT c.* FROM contacts c
WHERE c.id IN (
  SELECT contact_id FROM tags WHERE tag_name = 'important'
)
AND c.id IN (
  SELECT contact_id FROM tags WHERE tag_name = 'vip'
);

-- Remove a tag from all contacts
DELETE FROM tags WHERE tag_name = 'deprecated';
```

---

## 3. Duplicate Detection System

### 3.1 duplicate_candidates

**Purpose**: Stores potential duplicate pairs identified by the duplicate detection algorithm. Acts as a staging area before merging.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| contact_id_1 | TEXT | NOT NULL, FOREIGN KEY | Reference to first contact (contacts.id) |
| contact_id_2 | TEXT | NOT NULL, FOREIGN KEY | Reference to second contact (contacts.id) |
| similarity_score | REAL | NOT NULL | Score 0.0-1.0 indicating likelihood of duplicate |
| match_reason | TEXT | | Reason for match: 'phone', 'email', 'name_similar', 'combined' |
| is_reviewed | INTEGER | DEFAULT 0 | Boolean: user has manually reviewed |
| is_dismissed | INTEGER | DEFAULT 0 | Boolean: user rejected as duplicate |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Discovery timestamp |
| reviewed_at | DATETIME | | Review/action timestamp |

**Foreign Keys**:
```sql
FOREIGN KEY (contact_id_1) REFERENCES contacts(id) ON DELETE CASCADE
FOREIGN KEY (contact_id_2) REFERENCES contacts(id) ON DELETE CASCADE
```

**Indexes**:
```sql
CREATE INDEX idx_dup_contact_1 ON duplicate_candidates(contact_id_1);
CREATE INDEX idx_dup_contact_2 ON duplicate_candidates(contact_id_2);
CREATE INDEX idx_dup_similarity ON duplicate_candidates(similarity_score DESC);
CREATE INDEX idx_dup_reviewed ON duplicate_candidates(is_reviewed, is_dismissed);
```

**Constraints**:
- NOT NULL: contact_id_1, contact_id_2, similarity_score
- CHECK: similarity_score BETWEEN 0 AND 1
- CHECK: contact_id_1 != contact_id_2
- ON DELETE CASCADE: Deleting contact removes associated candidates

**Example Queries**:

```sql
-- Get pending duplicate candidates (unreviewed, not dismissed)
SELECT * FROM duplicate_candidates
WHERE is_reviewed = 0 AND is_dismissed = 0
ORDER BY similarity_score DESC;

-- Get high-confidence duplicates
SELECT * FROM duplicate_candidates
WHERE similarity_score >= 0.8 AND is_reviewed = 0
ORDER BY similarity_score DESC;

-- Find all duplicates for a specific contact
SELECT * FROM duplicate_candidates
WHERE contact_id_1 = 'abc-123' OR contact_id_2 = 'abc-123'
ORDER BY similarity_score DESC;

-- Count duplicates by match reason
SELECT match_reason, COUNT(*) as count FROM duplicate_candidates
WHERE is_reviewed = 0 AND is_dismissed = 0
GROUP BY match_reason;
```

---

### 3.2 duplicate_groups

**Purpose**: Tracks groups of contacts identified as duplicates, even before explicit merging.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| group_name | TEXT | | Optional user label for the duplicate group |
| contact_count | INTEGER | NOT NULL | Number of contacts in group |
| is_merged | INTEGER | DEFAULT 0 | Boolean: group has been merged into one |
| merge_winner_id | TEXT | FOREIGN KEY | ID of surviving contact after merge (contacts.id) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Group creation timestamp |
| merged_at | DATETIME | | Merge completion timestamp |

**Foreign Keys**:
```sql
FOREIGN KEY (merge_winner_id) REFERENCES contacts(id) ON SET NULL
```

**Indexes**:
```sql
CREATE INDEX idx_dup_group_merged ON duplicate_groups(is_merged);
CREATE INDEX idx_dup_group_winner ON duplicate_groups(merge_winner_id);
```

**Constraints**:
- NOT NULL: contact_count
- ON SET NULL: Deleting winning contact sets merge_winner_id to NULL

**Example Queries**:

```sql
-- Get all unmerged duplicate groups
SELECT * FROM duplicate_groups WHERE is_merged = 0;

-- Find groups with most contacts
SELECT * FROM duplicate_groups ORDER BY contact_count DESC LIMIT 10;

-- Get merge history for a contact
SELECT * FROM duplicate_groups
WHERE merge_winner_id = 'abc-123' AND is_merged = 1;
```

---

### 3.3 merge_history

**Purpose**: Audit trail of contact merges. Records which contacts were merged and preserves original data.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| source_contact_id | TEXT | NOT NULL | ID of contact that was merged (now deleted) |
| target_contact_id | TEXT | NOT NULL, FOREIGN KEY | ID of surviving contact (contacts.id) |
| source_data | TEXT | NOT NULL | JSON blob of source contact data (backup) |
| merge_method | TEXT | | Method: 'manual', 'auto', 'import_dedup' |
| merged_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Merge timestamp |
| merged_by | TEXT | | User ID or system identifier |
| is_reversible | INTEGER | DEFAULT 1 | Boolean: can this merge be undone? |

**Foreign Keys**:
```sql
FOREIGN KEY (target_contact_id) REFERENCES contacts(id) ON SET NULL
```

**Indexes**:
```sql
CREATE INDEX idx_merge_source ON merge_history(source_contact_id);
CREATE INDEX idx_merge_target ON merge_history(target_contact_id);
CREATE INDEX idx_merge_date ON merge_history(merged_at DESC);
```

**Constraints**:
- NOT NULL: source_contact_id, target_contact_id, source_data, merged_at
- ON SET NULL: Deleting target contact sets target_contact_id to NULL

**Example Queries**:

```sql
-- Get merge history for a contact
SELECT * FROM merge_history WHERE target_contact_id = 'abc-123'
ORDER BY merged_at DESC;

-- Find all contacts merged into a winner
SELECT source_contact_id, source_data FROM merge_history
WHERE target_contact_id = 'abc-123';

-- Audit trail: find what was merged and when
SELECT source_contact_id, target_contact_id, merged_at, merge_method
FROM merge_history ORDER BY merged_at DESC LIMIT 50;

-- Undo capability: find reversible merges
SELECT * FROM merge_history
WHERE is_reversible = 1 ORDER BY merged_at DESC LIMIT 10;
```

---

## 4. Temporary & Utility Tables

### 4.1 temporary_contacts

**Purpose**: Staging area for contacts during import/creation workflows. Allows users to preview before committing to main contacts table.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| display_name | TEXT | NOT NULL | Full contact name |
| first_name | TEXT | | First name |
| last_name | TEXT | | Last name |
| company | TEXT | | Company/organization |
| phone_numbers | TEXT | | JSON array of phone objects [{number, type}, ...] |
| emails | TEXT | | JSON array of email objects [{email, type}, ...] |
| tags | TEXT | | JSON array of tag names ["tag1", "tag2"] |
| notes | TEXT | | Notes/description |
| duplicate_group_id | TEXT | FOREIGN KEY | Link to duplicate_groups for conflict resolution |
| is_committed | INTEGER | DEFAULT 0 | Boolean: moved to main contacts table |
| session_id | TEXT | | Import session identifier (FK to import_sessions in Phase 9) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| committed_at | DATETIME | | Commitment timestamp (when moved to contacts) |

**Foreign Keys**:
```sql
FOREIGN KEY (duplicate_group_id) REFERENCES duplicate_groups(id) ON SET NULL
```

**Indexes**:
```sql
CREATE INDEX idx_temp_is_committed ON temporary_contacts(is_committed);
CREATE INDEX idx_temp_session_id ON temporary_contacts(session_id);
CREATE INDEX idx_temp_duplicate_group ON temporary_contacts(duplicate_group_id);
```

**Constraints**:
- NOT NULL: display_name
- ON SET NULL: Deleting duplicate_group cascades to NULL

**Example Queries**:

```sql
-- Get all pending temporary contacts (not yet committed)
SELECT * FROM temporary_contacts WHERE is_committed = 0;

-- Find temporary contacts in a specific import session
SELECT * FROM temporary_contacts WHERE session_id = 'import-123' AND is_committed = 0;

-- Get temporary contacts awaiting duplicate resolution
SELECT * FROM temporary_contacts
WHERE duplicate_group_id IS NOT NULL AND is_committed = 0;

-- Clean up old temporary contacts (older than 7 days)
DELETE FROM temporary_contacts
WHERE is_committed = 0 AND created_at < datetime('now', '-7 days');
```

---

### 4.2 sync_state

**Purpose**: Tracks synchronization state with cloud/backup services (future). Currently used for internal state management.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Service identifier (e.g., 'google_contacts', 'cloud_backup') |
| last_sync_at | DATETIME | | Last successful sync timestamp |
| sync_token | TEXT | | Token for incremental sync (service-specific) |
| is_syncing | INTEGER | DEFAULT 0 | Boolean: sync currently in progress |
| last_error | TEXT | | Error message from last failed sync |
| total_synced | INTEGER | DEFAULT 0 | Total contacts synced to date |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | State update timestamp |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_sync_id ON sync_state(id);
```

**Example Queries**:

```sql
-- Get sync status for a service
SELECT * FROM sync_state WHERE id = 'google_contacts';

-- Find services that need syncing (last sync > 1 hour ago)
SELECT * FROM sync_state
WHERE last_sync_at < datetime('now', '-1 hour')
AND is_syncing = 0;

-- Reset sync token (force full sync)
UPDATE sync_state SET sync_token = NULL WHERE id = 'cloud_backup';
```

---

### 4.3 settings

**Purpose**: Key-value store for application settings, preferences, and configuration.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| key | TEXT | PRIMARY KEY | Setting identifier (e.g., 'app_theme', 'auto_backup_enabled') |
| value | TEXT | NOT NULL | Setting value (stored as string, parsed by app) |
| data_type | TEXT | | Type hint: 'string', 'integer', 'boolean', 'json' |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_settings_key ON settings(key);
```

**Example Queries**:

```sql
-- Get a specific setting
SELECT value FROM settings WHERE key = 'app_theme';

-- Get all user preferences
SELECT * FROM settings WHERE key LIKE 'pref_%';

-- Update a setting
INSERT OR REPLACE INTO settings (key, value, data_type) 
VALUES ('auto_backup_enabled', 'true', 'boolean');
```

---

### 4.4 audit_logs

**Purpose**: Comprehensive audit trail of all significant operations (deletes, merges, exports) for compliance and recovery.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| action_type | TEXT | NOT NULL | Operation type: 'create', 'update', 'delete', 'merge', 'export', 'import' |
| entity_type | TEXT | NOT NULL | Affected entity: 'contact', 'phone', 'email', 'tag', 'note' |
| entity_id | TEXT | | ID of affected entity |
| old_value | TEXT | | Previous value (for updates) |
| new_value | TEXT | | New value (for updates) |
| user_id | TEXT | | User ID (for future multi-user support) |
| timestamp | DATETIME | DEFAULT CURRENT_TIMESTAMP | Action timestamp |
| ip_address | TEXT | | IP address (if applicable) |
| metadata | TEXT | | Additional JSON data |

**Indexes**:
```sql
CREATE INDEX idx_audit_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
```

**Example Queries**:

```sql
-- Get all delete operations
SELECT * FROM audit_logs WHERE action_type = 'delete' ORDER BY timestamp DESC;

-- Audit trail for a specific contact
SELECT * FROM audit_logs WHERE entity_id = 'abc-123' AND entity_type = 'contact'
ORDER BY timestamp DESC;

-- Find all contacts deleted in the last 30 days
SELECT DISTINCT entity_id FROM audit_logs
WHERE action_type = 'delete' AND entity_type = 'contact'
AND timestamp >= datetime('now', '-30 days');

-- Count operations by type
SELECT action_type, COUNT(*) as count FROM audit_logs
GROUP BY action_type ORDER BY count DESC;
```

---

## 5. Phase 8: Premium Features

### 5.1 contact_notes

**Purpose**: Structured, categorized notes for contacts with rich metadata. Replaces legacy notes field in contacts table.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| contact_id | TEXT | NOT NULL, FOREIGN KEY | Reference to contacts.id |
| note_text | TEXT | NOT NULL | Note content (supports markdown) |
| note_category | TEXT | DEFAULT 'general' | Category: 'general', 'meeting', 'reminder', 'follow_up', 'deal', 'custom' |
| note_priority | INTEGER | DEFAULT 0 | Priority level: 0=normal, 1=important, 2=urgent |
| is_pinned | INTEGER | DEFAULT 0 | Boolean: pin to top of notes list |
| related_contact_ids | TEXT | | JSON array of related contact IDs for cross-linking |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |
| created_by | TEXT | | User ID for multi-user scenarios |

**Foreign Keys**:
```sql
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
```

**Indexes**:
```sql
CREATE INDEX idx_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX idx_notes_category ON contact_notes(note_category);
CREATE INDEX idx_notes_priority ON contact_notes(note_priority DESC);
CREATE INDEX idx_notes_pinned ON contact_notes(is_pinned DESC);
CREATE INDEX idx_notes_created_at ON contact_notes(created_at DESC);
```

**Constraints**:
- NOT NULL: contact_id, note_text
- ON DELETE CASCADE: Deleting contact cascades to all notes

**Example Queries**:

```sql
-- Get all notes for a contact, pinned first
SELECT * FROM contact_notes WHERE contact_id = 'abc-123'
ORDER BY is_pinned DESC, created_at DESC;

-- Get important follow-up notes
SELECT * FROM contact_notes
WHERE note_category = 'follow_up' AND note_priority >= 1
ORDER BY created_at ASC;

-- Find notes mentioning specific contact (cross-linked)
SELECT * FROM contact_notes
WHERE related_contact_ids LIKE '%xyz-789%';

-- Recent notes across all contacts
SELECT c.display_name, n.* FROM contact_notes n
JOIN contacts c ON n.contact_id = c.id
ORDER BY n.created_at DESC LIMIT 20;
```

---

### 5.2 contact_relationships

**Purpose**: Directional linking between contacts (e.g., "knows", "reports to", "spouse of").

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| source_contact_id | TEXT | NOT NULL, FOREIGN KEY | Starting contact (contacts.id) |
| target_contact_id | TEXT | NOT NULL, FOREIGN KEY | Related contact (contacts.id) |
| relationship_type | TEXT | NOT NULL | Type: 'spouse', 'colleague', 'manager', 'reports_to', 'friend', 'family', 'custom' |
| relationship_label | TEXT | | Custom label (e.g., "project_partner") |
| is_bidirectional | INTEGER | DEFAULT 0 | Boolean: relationship goes both ways |
| description | TEXT | | Optional description of relationship |
| metadata | TEXT | | JSON metadata (strength, duration, context) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Foreign Keys**:
```sql
FOREIGN KEY (source_contact_id) REFERENCES contacts(id) ON DELETE CASCADE
FOREIGN KEY (target_contact_id) REFERENCES contacts(id) ON DELETE CASCADE
```

**Indexes**:
```sql
CREATE INDEX idx_rel_source ON contact_relationships(source_contact_id);
CREATE INDEX idx_rel_target ON contact_relationships(target_contact_id);
CREATE INDEX idx_rel_type ON contact_relationships(relationship_type);
CREATE UNIQUE INDEX idx_rel_unique ON contact_relationships(source_contact_id, target_contact_id, relationship_type);
```

**Constraints**:
- NOT NULL: source_contact_id, target_contact_id, relationship_type
- UNIQUE: (source_contact_id, target_contact_id, relationship_type)
- CHECK: source_contact_id != target_contact_id
- ON DELETE CASCADE: Deleting contact removes all relationships

**Example Queries**:

```sql
-- Get all people a contact knows
SELECT c.display_name, r.relationship_type
FROM contact_relationships r
JOIN contacts c ON r.target_contact_id = c.id
WHERE r.source_contact_id = 'abc-123'
ORDER BY r.relationship_type;

-- Get all people who know this contact (reverse lookup)
SELECT c.display_name, r.relationship_type
FROM contact_relationships r
JOIN contacts c ON r.source_contact_id = c.id
WHERE r.target_contact_id = 'abc-123';

-- Find all manager relationships
SELECT c1.display_name as employee, c2.display_name as manager
FROM contact_relationships r
JOIN contacts c1 ON r.source_contact_id = c1.id
JOIN contacts c2 ON r.target_contact_id = c2.id
WHERE r.relationship_type = 'reports_to';

-- Get network depth (contacts 2 degrees away)
SELECT DISTINCT c.display_name
FROM contacts c
WHERE c.id IN (
  SELECT target_contact_id FROM contact_relationships WHERE source_contact_id IN (
    SELECT target_contact_id FROM contact_relationships WHERE source_contact_id = 'abc-123'
  )
);
```

---

### 5.3 profile_cards

**Purpose**: "My Card" - personal profile card for QR code generation, sharing, and contact exchange.

**Column Definitions**:

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (UUID v4) |
| contact_id | TEXT | NOT NULL, UNIQUE, FOREIGN KEY | Reference to contacts.id (one card per contact) |
| card_title | TEXT | | Display title for the card |
| card_description | TEXT | | Tagline or professional summary |
| phone_numbers | TEXT | | JSON array of phone numbers to include |
| emails | TEXT | | JSON array of emails to include |
| social_links | TEXT | | JSON: {linkedin, twitter, website, etc.} |
| qr_code_data | TEXT | | QR code payload (vCard format) |
| theme_color | TEXT | | Hex color for card display (#FF5733) |
| is_public | INTEGER | DEFAULT 0 | Boolean: shareable via link |
| public_url_slug | TEXT | UNIQUE | URL slug for public sharing (e.g., "john-doe-123") |
| share_count | INTEGER | DEFAULT 0 | Number of times shared/downloaded |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

**Foreign Keys**:
```sql
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
```

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_card_contact ON profile_cards(contact_id);
CREATE INDEX idx_card_public ON profile_cards(is_public);
CREATE UNIQUE INDEX idx_card_slug ON profile_cards(public_url_slug);
```

**Constraints**:
- NOT NULL: contact_id
- UNIQUE: contact_id, public_url_slug (if public)
- ON DELETE CASCADE: Deleting contact deletes card

**Example Queries**:

```sql
-- Get profile card for a contact
SELECT * FROM profile_cards WHERE contact_id = 'abc-123';

-- Get all public cards
SELECT * FROM profile_cards WHERE is_public = 1 ORDER BY share_count DESC;

-- Find most-shared profile cards
SELECT c.display_name, pc.share_count FROM profile_cards pc
JOIN contacts c ON pc.contact_id = c.id
WHERE is_public = 1 ORDER BY share_count DESC LIMIT 10;

-- Get card by public URL
SELECT * FROM profile_cards WHERE public_url_slug = 'john-doe-123';
```

---

## 6. Phase 9 Preview (Not Yet Implemented)

The following tables are planned for Phase 9 and are documented for future reference:

### 6.1 import_sessions
- Tracks import operations and sessions
- Columns: id, name, import_source, total_rows, imported_count, status, created_at, completed_at
- Purpose: Organize and track batch import operations

### 6.2 import_rows
- Individual import row records
- Columns: id, session_id, raw_data, parsed_data, status, error_message, matched_contact_id
- Purpose: Track each row imported with parsing/matching details

### 6.3 import_mappings
- User-defined field mappings for imports
- Columns: id, import_source, field_mappings (JSON), created_at
- Purpose: Store reusable import configurations

### 6.4 contact_archive
- Archive table for inactive/deleted contacts
- Columns: id, contact_id, original_data, archived_at, reason
- Purpose: Preserve deleted contact data with full history

### 6.5 contact_protection
- Protection flags for sensitive contacts
- Columns: id, contact_id, protection_level, password_hash, protected_at
- Purpose: Prevent accidental modification of sensitive contacts

### 6.6 undo_history
- Comprehensive undo/redo stack
- Columns: id, action_type, affected_entities, action_data, timestamp, is_undone
- Purpose: Enable full undo/redo workflow for user operations

---

## 7. Index Strategy & Performance

### High-Cardinality Indexes (Many Distinct Values)

These fields have high selectivity and deserve indexing:

| Field | Table | Reason | Impact |
|-------|-------|--------|--------|
| normalized_number | phone_numbers | Phone lookups very common | Essential for duplicate detection |
| normalized_email | emails | Email lookups common | Essential for duplicate detection |
| display_name | contacts | Wildcard search frequent | Improves search response times |
| contact_id | * (all child tables) | Foreign key joins | Enables efficient JOINs |

### Low-Cardinality Indexes (Few Distinct Values)

Use sparingly; benefit limited:

| Field | Table | Reason | Trade-off |
|-------|-------|--------|-----------|
| is_favorite | contacts | Only 0 or 1 | Inclusion in composite index better |
| is_primary | phone_numbers, emails | Only 0 or 1 | Useful with contact_id composite |
| phone_type | phone_numbers | ~5 values | Good for filtering within contact |

### Composite Indexes

Optimize multi-column queries:

```sql
-- Example: Find primary phone for contact (optimizes common query)
CREATE INDEX idx_phone_contact_primary ON phone_numbers(contact_id, is_primary);

-- Example: Find recent notes for contact
CREATE INDEX idx_notes_contact_recent ON contact_notes(contact_id, created_at DESC);

-- Example: Find duplicate candidates by score
CREATE INDEX idx_dup_score_reviewed ON duplicate_candidates(similarity_score DESC, is_reviewed);
```

### Performance Considerations

1. **Write Overhead**: Each index adds ~10-15% write cost. Only index frequently-queried fields.
2. **Size Impact**: Full indexes can be 20-30% of table size. Monitor database file size.
3. **Maintenance**: Indexes degrade over time; periodic VACUUM and REINDEX improve performance.
4. **Query Planning**: Use EXPLAIN QUERY PLAN to verify index usage.

---

## 8. Common Query Patterns

### Pattern 1: Full Contact Search

```sql
-- Search across name, company, phone, email
SELECT DISTINCT c.* FROM contacts c
LEFT JOIN phone_numbers p ON c.id = p.contact_id
LEFT JOIN emails e ON c.id = e.contact_id
WHERE c.display_name LIKE '%John%'
   OR c.company LIKE '%Acme%'
   OR p.normalized_number LIKE '%555%'
   OR e.normalized_email LIKE '%example%'
ORDER BY c.display_name
LIMIT 50;
```

### Pattern 2: Find Contact by Normalized Phone

```sql
-- Normalize input (remove non-digits) and find contact
SELECT c.* FROM contacts c
JOIN phone_numbers p ON c.id = p.contact_id
WHERE p.normalized_number = '9876543210'
LIMIT 1;
```

### Pattern 3: Get Complete Contact Profile

```sql
-- All data for single contact
SELECT 
  c.*,
  json_group_array(json_object('id', p.id, 'number', p.number, 'type', p.phone_type)) as phones,
  json_group_array(json_object('id', e.id, 'email', e.email, 'type', e.email_type)) as emails,
  json_group_array(t.tag_name) as tags
FROM contacts c
LEFT JOIN phone_numbers p ON c.id = p.contact_id
LEFT JOIN emails e ON c.id = e.contact_id
LEFT JOIN tags t ON c.id = t.contact_id
WHERE c.id = 'abc-123'
GROUP BY c.id;
```

### Pattern 4: Find Pending Duplicates

```sql
-- Get unreviewed duplicate candidates with contact info
SELECT 
  dc.id, dc.similarity_score, dc.match_reason,
  c1.display_name as name_1, c1.company as company_1,
  c2.display_name as name_2, c2.company as company_2,
  GROUP_CONCAT(p1.number, ', ') as phones_1,
  GROUP_CONCAT(p2.number, ', ') as phones_2
FROM duplicate_candidates dc
JOIN contacts c1 ON dc.contact_id_1 = c1.id
JOIN contacts c2 ON dc.contact_id_2 = c2.id
LEFT JOIN phone_numbers p1 ON c1.id = p1.contact_id
LEFT JOIN phone_numbers p2 ON c2.id = p2.contact_id
WHERE dc.is_reviewed = 0 AND dc.is_dismissed = 0
GROUP BY dc.id
ORDER BY dc.similarity_score DESC;
```

### Pattern 5: Calculate Contact Health Score

```sql
-- Health score: completeness percentage
SELECT 
  c.id,
  c.display_name,
  ROUND(
    (
      (CASE WHEN c.first_name IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN c.last_name IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN c.company IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN c.photo_uri IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN (SELECT COUNT(*) FROM phone_numbers WHERE contact_id = c.id) > 0 THEN 30 ELSE 0 END) +
      (CASE WHEN (SELECT COUNT(*) FROM emails WHERE contact_id = c.id) > 0 THEN 20 ELSE 0 END)
    ) / 100.0 * 100
  ) as health_score
FROM contacts c;
```

### Pattern 6: Get Related Contacts via Relationships

```sql
-- Get all contacts someone is connected to (including managers, colleagues, etc.)
WITH RECURSIVE contact_network AS (
  SELECT 
    target_contact_id as related_id,
    relationship_type,
    1 as depth
  FROM contact_relationships
  WHERE source_contact_id = 'abc-123'
  
  UNION ALL
  
  SELECT 
    cr.target_contact_id,
    cr.relationship_type,
    cn.depth + 1
  FROM contact_relationships cr
  JOIN contact_network cn ON cr.source_contact_id = cn.related_id
  WHERE cn.depth < 3
)
SELECT DISTINCT c.* FROM contacts c
JOIN contact_network cn ON c.id = cn.related_id
ORDER BY cn.depth;
```

### Pattern 7: Merge Contacts (Complete Operation)

```sql
-- Transaction: Merge contact_2 into contact_1
BEGIN TRANSACTION;

-- 1. Record merge history
INSERT INTO merge_history (id, source_contact_id, target_contact_id, source_data, merge_method, merged_at)
VALUES (
  'merge-uuid',
  'contact-2-id',
  'contact-1-id',
  json_object(
    'display_name', 'Old Name',
    'company', 'Old Company'
  ),
  'manual',
  CURRENT_TIMESTAMP
);

-- 2. Merge phone numbers (keeping contact_1's, discarding duplicates)
INSERT OR IGNORE INTO phone_numbers (id, contact_id, number, normalized_number, phone_type)
SELECT uuid(), 'contact-1-id', number, normalized_number, phone_type
FROM phone_numbers WHERE contact_id = 'contact-2-id';

-- 3. Merge emails
INSERT OR IGNORE INTO emails (id, contact_id, email, normalized_email, email_type)
SELECT uuid(), 'contact-1-id', email, normalized_email, email_type
FROM emails WHERE contact_id = 'contact-2-id';

-- 4. Merge tags
INSERT OR IGNORE INTO tags (id, contact_id, tag_name, tag_color)
SELECT uuid(), 'contact-1-id', tag_name, tag_color
FROM tags WHERE contact_id = 'contact-2-id';

-- 5. Merge notes
INSERT INTO contact_notes (id, contact_id, note_text, note_category, created_at)
SELECT uuid(), 'contact-1-id', note_text, note_category, created_at
FROM contact_notes WHERE contact_id = 'contact-2-id';

-- 6. Update relationships
UPDATE contact_relationships SET source_contact_id = 'contact-1-id'
WHERE source_contact_id = 'contact-2-id';

UPDATE contact_relationships SET target_contact_id = 'contact-1-id'
WHERE target_contact_id = 'contact-2-id';

-- 7. Delete old contact (cascades cleanup)
DELETE FROM contacts WHERE id = 'contact-2-id';

COMMIT;
```

### Pattern 8: Generate vCard for Export

```sql
-- Build vCard string for a contact
SELECT 
  'BEGIN:VCARD' || char(10) ||
  'VERSION:3.0' || char(10) ||
  'FN:' || c.display_name || char(10) ||
  CASE WHEN c.first_name IS NOT NULL THEN 'N:' || c.last_name || ';' || c.first_name || char(10) ELSE '' END ||
  CASE WHEN c.company IS NOT NULL THEN 'ORG:' || c.company || char(10) ELSE '' END ||
  CASE WHEN c.photo_uri IS NOT NULL THEN 'PHOTO;VALUE=URI:' || c.photo_uri || char(10) ELSE '' END ||
  GROUP_CONCAT(
    CASE 
      WHEN p.phone_type = 'mobile' THEN 'TEL;TYPE=CELL:' || p.number
      WHEN p.phone_type = 'work' THEN 'TEL;TYPE=WORK:' || p.number
      WHEN p.phone_type = 'home' THEN 'TEL;TYPE=HOME:' || p.number
      ELSE 'TEL:' || p.number
    END,
    char(10)
  ) || char(10) ||
  GROUP_CONCAT(
    'EMAIL;TYPE=' || UPPER(e.email_type) || ':' || e.email,
    char(10)
  ) || char(10) ||
  'END:VCARD' as vcard
FROM contacts c
LEFT JOIN phone_numbers p ON c.id = p.contact_id
LEFT JOIN emails e ON c.id = e.contact_id
WHERE c.id = 'abc-123'
GROUP BY c.id;
```

---

## 9. Schema Constraints & Relationships

### Foreign Key Constraints

All child tables implement ON DELETE CASCADE to maintain referential integrity:

```sql
-- Example: Deleting a contact cascades to:
-- - All phone_numbers
-- - All emails
-- - All tags
-- - All contact_notes
-- - All contact_relationships (both source and target)
-- - All profile_cards
DELETE FROM contacts WHERE id = 'abc-123';
```

### UNIQUE Constraints

Prevent duplicate data at database level:

```sql
-- Normalized phone numbers globally unique (no duplicate numbers)
UNIQUE(normalized_number) on phone_numbers

-- Normalized emails globally unique
UNIQUE(normalized_email) on emails

-- Tags per contact must be unique (no duplicate tag on one contact)
UNIQUE(contact_id, tag_name) on tags

-- Only one profile card per contact
UNIQUE(contact_id) on profile_cards

-- Only one relationship type between two contacts
UNIQUE(source_contact_id, target_contact_id, relationship_type) on contact_relationships
```

### NOT NULL Requirements

**Mandatory fields**:
- contacts.display_name (required for any contact)
- phone_numbers.contact_id, number, normalized_number
- emails.contact_id, email, normalized_email
- tags.contact_id, tag_name
- duplicate_candidates.contact_id_1, contact_id_2, similarity_score
- contact_notes.contact_id, note_text
- contact_relationships.source_contact_id, target_contact_id, relationship_type

### CHECK Constraints

```sql
-- Similarity score must be between 0 and 1
CHECK(similarity_score BETWEEN 0 AND 1) on duplicate_candidates

-- Contact cannot relate to itself
CHECK(source_contact_id != target_contact_id) on contact_relationships
```

### Default Values

Auto-populated fields simplify inserts:

```sql
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
is_favorite INTEGER DEFAULT 0
is_primary INTEGER DEFAULT 0
health_score INTEGER DEFAULT 0
```

---

## 10. Migration Path & Version History

### Phase 0: Initial Schema (v0.1)
**Commit**: Foundation release
**Tables**: contacts, phone_numbers, emails
**Key Features**: Basic contact storage, phone/email normalization

```sql
-- Initial schema
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 3: Duplicate Detection (v0.3)
**Commit**: Duplicate detection engine
**New Tables**: duplicate_candidates, duplicate_groups, merge_history
**Migration**: Added similarity scoring and merge tracking

```sql
-- Migration: Add duplicate detection
CREATE TABLE duplicate_candidates (...);
CREATE TABLE duplicate_groups (...);
CREATE TABLE merge_history (...);
```

### Phase 4: Import Staging (v0.4)
**Commit**: Import workflow
**New Tables**: temporary_contacts, tags
**Migration**: Added flexible tagging and import staging

```sql
-- Migration: Add import staging and tags
CREATE TABLE temporary_contacts (...);
CREATE TABLE tags (...);
```

### Phase 6: Export & Audit (v0.6)
**Commit**: Export and audit trail
**New Tables**: sync_state, settings, audit_logs
**Migration**: Enhanced tracking and configuration

```sql
-- Migration: Add audit and sync tracking
CREATE TABLE sync_state (...);
CREATE TABLE settings (...);
CREATE TABLE audit_logs (...);
```

### Phase 8: Premium Features (v0.8)
**Commit**: Rich contact features
**New Tables**: contact_notes, contact_relationships, profile_cards
**Migration**: Structured notes, relationship linking, profile cards

```sql
-- Migration: Add premium features
CREATE TABLE contact_notes (...);
CREATE TABLE contact_relationships (...);
CREATE TABLE profile_cards (...);
```

### Phase 9: Advanced Import & Archive (v0.9) - Planned
**New Tables**: import_sessions, import_rows, import_mappings, contact_archive, contact_protection, undo_history
**Features**: Batch import tracking, contact archival, full undo/redo
**Status**: In design phase

---

## 11. Backup & Recovery

### Database Maintenance

**Periodic Tasks**:
- **VACUUM**: Defragment database (monthly)
- **ANALYZE**: Update table statistics for query planner (monthly)
- **REINDEX**: Rebuild indexes (quarterly)

```sql
-- Maintenance operations
VACUUM;
ANALYZE;
REINDEX;
```

### Backup Strategy

1. **Full Backup**: Complete .db file copy
2. **Incremental**: Export changes since last sync
3. **vCard Export**: Industry-standard contact export (with Pattern 8 query)

### Recovery

Use merge_history and audit_logs for point-in-time recovery:

```sql
-- Recover deleted contact from merge_history
SELECT * FROM merge_history WHERE source_contact_id = 'deleted-id' LIMIT 1;

-- Restore archived contact data
-- (Will be available in Phase 9)
```

---

## 12. Future Considerations

### Scalability
- **Current**: Optimized for ~10,000 contacts on mobile/local device
- **Future**: Cloud sync will introduce remote replication challenges
- **Index Strategy**: May need to add partial indexes for archived contacts

### Security
- **Encryption at Rest**: Consider encrypting sensitive fields (Phase 9)
- **Audit Compliance**: audit_logs supports future GDPR/CCPA requirements
- **Protection**: contact_protection table (Phase 9) for sensitive contacts

### Performance Tuning
- Monitor query times with EXPLAIN QUERY PLAN
- Consider Full-Text Search (FTS) indexes for name searching (Phase 10)
- Add statistical indexes for common filters

### Data Quality
- Implement contact_health_score calculation (Pattern 5)
- Periodic cleanup of temporary_contacts
- Validation of phone/email normalization

---

## Appendix: Quick Reference

### Table Count
- **Core**: 4 tables (contacts, phone_numbers, emails, tags)
- **Duplicate Detection**: 3 tables
- **Utilities**: 4 tables
- **Premium**: 3 tables
- **Total Current**: 14 tables
- **Planned (Phase 9)**: +6 tables

### Index Count
- **Primary/Unique**: 14+
- **Foreign Key**: 10+
- **Search/Filter**: 20+
- **Total**: ~45 indexes

### Estimated Size (10,000 contacts)
- **Database File**: 5-15 MB (depends on note volume)
- **Indexes**: 1-3 MB
- **Typical Queries**: <100ms

### Key Performance Tips
1. Always use normalized_number for phone lookups
2. Use composite indexes for contact_id + other filter
3. Limit wildcard searches with LIKE at end, not start
4. Use LIMIT for UI pagination (avoid huge result sets)
5. Run ANALYZE monthly for query optimization
