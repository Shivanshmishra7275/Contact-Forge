# ContactForge — Architecture Overview

## Core Principles

ContactForge is a **100% offline-first, privacy-centric** mobile app for advanced contact management.

### Non-Negotiables
- **No backend** — zero server communication
- **No analytics** — zero telemetry or tracking
- **No cloud sync** — all data stays on-device
- **No hallucinated APIs** — only real, supported Expo APIs
- **No destructive actions without confirmation** — all deletes/merges require explicit user approval

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React Native with Expo (managed workflow) |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based routing) |
| State | Zustand |
| Database | expo-sqlite (SQLite, WAL mode) |
| Contacts | expo-contacts |
| UI | React Native Paper (MD3 dark theme) |
| File I/O | expo-file-system |
| Sharing | expo-sharing |

---

## Folder Structure

```
Contact-Forge/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Bottom tab screens
│   │   ├── index.tsx       # Dashboard
│   │   ├── contacts.tsx    # Contact list
│   │   ├── duplicates.tsx  # Duplicate queue
│   │   ├── cleanup.tsx     # Cleanup center
│   │   └── settings.tsx    # Settings
│   ├── contact/
│   │   ├── [id].tsx        # Contact detail
│   │   └── new.tsx         # New contact form
│   ├── merge/
│   │   └── [id].tsx        # Merge review
│   └── permission-denied.tsx
├── src/
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # App-wide constants, colours, sizes
│   ├── db/                 # Database layer
│   │   ├── schema/         # CREATE TABLE + INDEX statements
│   │   ├── repositories/   # One file per table
│   │   └── index.ts        # DB bootstrap (openDatabaseSync)
│   ├── services/           # Business logic (no UI imports)
│   │   ├── contactSyncService.ts
│   │   ├── duplicateService.ts
│   │   └── exportService.ts
│   ├── store/              # Zustand stores
│   ├── utils/              # Pure utility functions
│   │   ├── normalization.ts  (testable pure functions)
│   │   └── duplicateScoring.ts (testable pure functions)
│   ├── tests/              # Jest unit tests
│   └── __mocks__/          # Mocks for expo modules in tests
└── docs/
    └── ARCHITECTURE.md
```

---

## Data Model

### contacts
The local mirror of native device contacts.

| Field | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment local ID |
| native_id | TEXT | Device contact ID (may be null) |
| display_name | TEXT | Pre-computed display name |
| normalized_name | TEXT | Lowercase for search |
| first_name, last_name | TEXT | Raw name parts |
| company, job_title | TEXT | Work info |
| is_temporary | INTEGER | 0/1 boolean |
| is_ghost | INTEGER | No name/phone/email |
| tags | TEXT | JSON array of tag strings |
| synced_at | TEXT | ISO timestamp of last sync |

### phone_numbers / emails
Normalized 1:N child tables with indexed normalized fields.

### duplicate_candidates
Pairs of contacts with a confidence score and explainable reasons list.
Status: `pending → merged | ignored | safe`

### merge_history
Pre-merge snapshots for rollback/audit purposes.

### audit_logs
Every destructive action is recorded here.

---

## Sync Strategy

1. Request permission via `expo-contacts`
2. Fetch contacts in chunks of 50 (`SYNC_CHUNK_SIZE`)
3. For each contact: upsert by `native_id`
4. Replace phones/emails wholesale on update
5. Update `sync_state` table on completion

---

## Duplicate Detection

Scoring is **additive and capped at 100**, with an explainable reasons list:

| Signal | Points |
|---|---|
| Exact normalized phone match | +80 |
| Exact normalized email match | +70 |
| Exact normalized name match | +50 |
| Overlapping phone (country code diff) | +60 |
| Fuzzy name match (≥0.75 similarity) | +0–30 |
| Name+Phone combination bonus | +10 |
| Name+Email combination bonus | +10 |

**Confidence thresholds:**
- `very_high`: score ≥ 85
- `high`: score ≥ 65
- `medium`: score ≥ 40
- `low`: score ≥ 20

Every match carries a `reasons[]` array — no black-box decisions.

## Cleanup Workflow

The cleanup center performs local-only standardization and review actions:

- Title-casing and whitespace collapse for display names
- Ghost contact detection and bulk deletion after confirmation
- Phone standardization for malformed local numbers
- Safe country-code appending for 10-digit numbers
- Duplicate phone cleanup inside a contact
- Bulk review and bulk fix actions with confirmation

---

## Platform Limitations

These features are **explicitly out of scope for MVP** due to platform restrictions:

- **Call log scanning** — Android requires `READ_CALL_LOG` permission (not available in Expo managed workflow)
- **Real-time caller ID** — Apple blocks third-party caller identification
- **Automatic call-log mining** — Not supported in Expo managed workflow
- **Background sync** — Not implemented in MVP; foreground-only sync

---

## Security Notes

- SQLite WAL mode enabled for safe concurrent reads
- Foreign key constraints enforced
- No user data is serialized to external storage except explicit user-initiated exports
- Export files are written to `documentDirectory` and require explicit share action
- No network permissions required or declared
