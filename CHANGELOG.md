# Changelog

All notable changes to this project will be documented in this file.

## [3.3.0] - 2026-05-26
### 🚀 Features
- **FTS5 Indexed Search**: Instantaneous search across 10k+ contacts using SQLite virtual tables (with seamless FTS4 fallback).
- **Bulk Actions**: Multi-select support for mass contact deletion and VCF exports directly from the main list.
- **Native OS Deep Links**: One-tap actions on contact profiles to instantly launch Phone, Email, SMS, or WhatsApp.
- **Merge Previews**: Granular field-by-field merge conflict resolution and safe "Ignore Duplicate" memory.

### 🛡️ Security & Integrity
- **Tombstone Soft-Deletes**: Deleting a contact now safely tombstones the record to ensure deletions reliably propagate across synced devices.
- **Idempotent Background Sync**: Repeated native contact syncing is now aggressively de-duplicated to guarantee zero duplicate creation.
- **Safe Merges**: Full pre-merge snapshots are captured to the centralized undo engine, allowing safe rollback of any merge.

### ⚡ Performance
- **Removed N+1 Queries**: Eliminated N+1 DB roundtrips in list rendering by safely flattening list lookups.
- **Virtualized List Fixes**: Removed hardcoded list constraints that caused UI artifacting on large datasets.
- **FTS Routing**: Bypassed expensive JS filtering by routing all search directly to the C-level SQLite engine.
