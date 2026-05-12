# ContactForge — Implemented SQLite Schema (Source-of-Truth Overview)

This document describes the **schema that is currently implemented in code**.

**Source of truth:** `src\\db\\schema\\index.ts`

> ContactForge is **offline-first** and **local-only**. No network dependencies are required for persistence.

## Notes

- IDs are **INTEGER PRIMARY KEY AUTOINCREMENT** (SQLite rowid-style).
- Foreign keys are used where relevant.
- Performance-sensitive columns are indexed (names/normalized fields, timestamps, queue fields).

## Core tables (high level)

### contacts
Local mirror of device contacts + ContactForge metadata.

Key columns (see source file for full list):
- `id` (INTEGER PK)
- `native_id` (TEXT, unique-ish mapping to expo-contacts)
- `display_name`, `normalized_name`
- `company`, `job_title`
- `notes` (TEXT)
- `tags` (TEXT JSON)
- `is_favorite` (INTEGER)
- `is_temporary`, `is_ghost` (INTEGER)
- `created_at`, `updated_at`

Indexes (examples):
- `contacts(native_id)`
- `contacts(normalized_name)`
- `contacts(updated_at)`

### phone_numbers
Normalized phone storage for fast search + duplicate detection.

Key columns:
- `id` (INTEGER PK)
- `contact_id` (INTEGER FK → contacts.id)
- `number`, `normalized_number`
- `type`, `is_primary`

Indexes:
- `phone_numbers(contact_id)`
- `phone_numbers(normalized_number)`

### emails
Normalized email storage.

Key columns:
- `id` (INTEGER PK)
- `contact_id` (INTEGER FK → contacts.id)
- `email`, `normalized_email`
- `type`, `is_primary`

Indexes:
- `emails(contact_id)`
- `emails(normalized_email)`

### duplicate_candidates
Explainable duplicate queue.

Key columns:
- `id` (INTEGER PK)
- `contact_id_a`, `contact_id_b` (INTEGER)
- `confidence` (INTEGER)
- `reasons` (TEXT JSON)
- `status` (TEXT)
- `created_at`

Indexes:
- `duplicate_candidates(status)`
- `duplicate_candidates(confidence)`

### audit_logs
Append-only local audit trail for trust/safety.

Key columns:
- `id` (INTEGER PK)
- `action` (TEXT)
- `target_id` (INTEGER, nullable)
- `details` (TEXT JSON)
- `created_at`

### temporary_contacts
Temporary/unknown workflow support.

Key columns:
- `id` (INTEGER PK)
- `contact_id` (INTEGER FK)
- `expires_at` (TEXT ISO, nullable)
- `created_at`

Indexes:
- `temporary_contacts(contact_id)`
- `temporary_contacts(expires_at)`

## Phase 8 tables (implemented)

### contact_notes
Structured per-contact memory notes.

Key columns:
- `id` (INTEGER PK)
- `contact_id` (INTEGER FK)
- `category` (TEXT)
- `title` (TEXT, nullable)
- `content` (TEXT)
- `created_at`, `updated_at`

Indexes:
- `contact_notes(contact_id)`
- `contact_notes(updated_at)`

### contact_relationships
Directional/bidirectional links between local contacts.

Key columns:
- `id` (INTEGER PK)
- `contact_id_from` (INTEGER)
- `contact_id_to` (INTEGER)
- `relationship_type` (TEXT)
- `direction` (TEXT)
- `notes` (TEXT, nullable)
- `created_at`

Indexes:
- `contact_relationships(contact_id_from)`
- `contact_relationships(contact_id_to)`

### profile_cards
Local “My Card” profile used for VCF + QR generation.

Key columns:
- `id` (INTEGER PK)
- `user_id` (INTEGER, nullable)
- `first_name`, `last_name`
- `job_title`, `company`
- `phone`, `email`, `address`
- `created_at`, `updated_at`

## If you’re making schema changes

- Update `src\\db\\schema\\index.ts` (and migrations if present).
- Keep operations **non-destructive by default**.
- Add/adjust indexes for any new query paths.
