# ContactForge

**Privacy-first, fully offline contact management for iOS and Android.**

ContactForge helps you organize, clean, and manage your contacts entirely on-device. No backend. No analytics. No cloud sync. Ever.

---

## Features

- **Contact Sync** — Mirror your native contacts to a local SQLite database
- **Duplicate Detection** — Intelligent, explainable duplicate scoring using normalized matching and fuzzy name comparison
- **Merge Review** — Field-level merge preview with pre-merge safety snapshots
- **Cleanup Center** — Detect name casing issues, whitespace problems, missing data, and ghost contacts
- **Temporary Contacts** — Create short-lived contacts with expiry
- **CSV & VCF Export** — Full local backup with timestamp naming
- **Search & Filter** — Fast local search by name, phone, or email; filter by tag, state, or cleanup status
- **Privacy Dashboard** — Plain-language explanation of how data is stored

---

## Tech Stack

- **React Native** + **Expo** (managed workflow)
- **TypeScript** (strict)
- **Expo Router** (file-based navigation)
- **expo-sqlite** (local database)
- **expo-contacts** (native contact access)
- **Zustand** (state management)
- **React Native Paper** (UI components, MD3 dark theme)

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode or Expo Go
- Android: Android Studio or Expo Go

### Install

```bash
git clone https://github.com/Shivanshmishra7275/Contact-Forge.git
cd Contact-Forge
npm install
```

### Run

```bash
# Start dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Test

```bash
npm test
```

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architecture documentation.

---

## Privacy

ContactForge is designed from the ground up for privacy:

- **Zero network access** — the app never opens a network connection
- **Zero telemetry** — no crash reporters, analytics SDKs, or tracking
- **Local-only storage** — all contact data stays in the on-device SQLite database
- **Explicit exports** — data only leaves the device when you explicitly initiate a share

---

## Roadmap

- [x] Phase 0 — Project setup, structure, dependencies
- [x] Phase 1 — App shell, navigation, theming, SQLite bootstrap
- [x] Phase 2 — Contact sync, local mirror, contact list with search
- [x] Phase 3 — Duplicate detection engine, merge review
- [x] Phase 4 — Temporary contacts, tag system
- [x] Phase 5 — Cleanup center, name standardization
- [x] Phase 6 — CSV/VCF export, backup
- [x] Phase 7 — Advanced unknown workflows, bulk actions, write-back to device

---

## Known Limitations

- **No call log scanning** — Not available in Expo managed workflow
- **No real-time caller ID** — Not supported on iOS for third-party apps
- **No write-back to native contacts** — ~~Phase 7 feature~~ Now available: use the "Push to Device Contacts" button in contact detail or edit screens
- **Background sync** — Not implemented; sync is foreground-only

---

## Contributing

This is an open-source project. Contributions welcome — please read the architecture docs before submitting a PR.

---

## License

MIT