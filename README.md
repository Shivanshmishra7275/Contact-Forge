# 🛡️ ContactForge

**Privacy-first, fully offline contact management for iOS and Android.**

ContactForge helps you organize, clean, and manage your contacts entirely on-device. No backend. No analytics. No cloud sync. Ever. 

![Project Status](https://img.shields.io/badge/Status-In_Development-blue.svg)
![Offline First](https://img.shields.io/badge/Offline-100%25-success.svg)

---

## 🚀 Current Build Status & Real-Time Progress

We are actively developing ContactForge in phases to ensure rock-solid privacy and performance. Here is our current development status:

### ✅ What's Done
- **Phase 0 & 1:** Foundation, App Shell, SQLite setup, and Navigation are fully implemented.
- **Phase 2:** Contact sync mechanism (mirroring native contacts to local db) is active.
- **Phase 3:** Duplicate Detection Engine and Safe Merge flows are working.
- **Phase 4:** Temporary Contacts with expiry dates and custom purge mechanisms are fully integrated.
- **Phase 5:** Cleanup Center now handles name cleanup, phone standardization, duplicate-number cleanup, ghost deletion, and bulk review actions.

### 🧪 Verified Build Health
- **TypeScript:** `npx tsc --noEmit` passes.
- **Unit tests:** `npx jest --watchAll=false` passes.
- **Offline-only behavior:** No backend, telemetry, or network dependency has been introduced.

### 🚧 Current Gaps & What's Next
- **Phase 6 (Export/Backup):** We need to finalize the user interface for exporting contacts (CSV/VCF formats) from `exportService.ts`.
- **Add new contact:** The `app/contact/new.tsx` UI exists but lacks database saving logic.
- **Testing:** Integration tests and CI pipeline are pending setup.
- **No Background Sync:** Sync currently requires the app to be in the foreground.

### 🐛 Known Errors & Quirks
- **No current blocking TypeScript errors.** The repo is currently type-clean.

---

## 🌟 Features

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

## 🗺️ Roadmap & Phases

- [x] **Phase 0** — Project setup, structure, dependencies
- [x] **Phase 1** — App shell, navigation, theming, SQLite bootstrap
- [x] **Phase 2** — Contact sync, local mirror, contact list with search
- [x] **Phase 3** — Duplicate detection engine, merge review
- [x] **Phase 4** — Temporary contacts, unknown workflows
- [x] **Phase 5** — Cleanup center, standardization actions, ghost cleanup, bulk review
- [ ] **Phase 6** — CSV/VCF export, local safety backups UI
- [ ] **Phase 7** — Polish, optimizations, complete test coverage, open-source readiness

---

## 🚫 Known Platform Limitations

- **No call log scanning** — Not available in Expo managed workflow for privacy reasons.
- **No real-time caller ID** — Not supported on iOS for third-party apps dynamically.
- **No write-back to native contacts** — Currently manages local-only copies. Write-back support is out of MVP scope to prevent accidental native deletions.

---

## 🤝 Contributing

This is an open-source project. Contributions welcome — please read the architecture docs before submitting a PR.

---

## License

MIT