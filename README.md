# ContactForge

**Cinematic, privacy-first, offline-first contact manager.**

Created by **Shivansh Mishra**.

Current release: **v2.0.0**.

ContactForge mirrors device contacts into a local SQLite database and gives you a clean, safe workflow for review, cleanup, merge, and export. Everything stays on-device. The app remains fully usable without internet.

---

## Why ContactForge

Most contact apps treat your address book as a black box. ContactForge makes it explainable, safe, and fast:

- **Local intelligence** for duplicates and cleanup
- **Transparent scoring** (no black-box merges)
- **Safety-first workflows** with previews and confirmations
- **Offline-first by default**

---

## Key Features

- Local contact mirror with fast search and pagination
- Duplicate detection with confidence scores and reason lists
- Merge review with safe previews
- Cleanup center for formatting and data-quality fixes
- Temporary contact workflows with expiry
- Notes and relationship mapping
- Contact Health Score with explainable suggestions
- CSV + VCF export and local backup vault
- Offline QR business card

---

## Privacy Promise

- No backend
- No analytics or tracking
- No silent uploads
- No cloud sync

Your data never leaves the device unless you explicitly export and share it.

---

## Offline-First Guarantee

Every core feature works without internet. Any future online features will be **optional** and **opt-in**, and will never block offline workflows.

---

## Optional Online Features (Planned, Opt-In)

- Release notes and update check (read-only)
- Docs/help links and community resources
- Optional release feed for APK availability

---

## Architecture Overview

- Expo (managed), React Native, TypeScript (strict)
- Expo Router for navigation
- SQLite via expo-sqlite
- Zustand for app state
- React Native Paper (MD3) UI

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/ACTUAL_DATABASE_SCHEMA.md](docs/ACTUAL_DATABASE_SCHEMA.md).

---

## Screens

- Dashboard
- Contacts
- Duplicates
- Cleanup Center
- Contact Detail
- Merge Review
- Backup Vault
- Settings

---

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (via `npx`)
- Android Studio or Xcode if using simulators

### Install

```bash
npm install
```

### Run (Development)

```bash
npm start
npm run android
npm run ios
npm run web
```

---

## Quality Checks

```bash
npm run lint
npm run typecheck
npm test
```

---

## Android Builds (EAS)

Profiles are defined in [eas.json](eas.json).

- Development (dev client, APK)
  ```bash
  npx eas build --profile development -p android
  ```
- Preview (APK for testers)
  ```bash
  npx eas build --profile preview -p android
  ```
- Production (AAB for Play Store)
  ```bash
  npx eas build --profile production -p android
  ```

If this is your first EAS build:

```bash
npx eas build:configure
```

---

## APK Download

Direct APK link is https://expo.dev/accounts/shivansh_98/projects/contactforge/builds/07338ef6-0b23-41f7-8dcb-03ee90097c9a
---

## CI and Automation

- [CI workflow](.github/workflows/ci.yml): lint, typecheck, tests
- [EAS build workflow](.github/workflows/eas-build.yml): manual Android build

To enable GitHub Action builds, add the `EXPO_TOKEN` secret to your repository.

---

## Screenshots

| Dashboard | Duplicates | Cleanup | Contact Detail |
|---|---|---|---|
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

---

## Roadmap

- Import studio (CSV/VCF) with field mapping and collision review
- Contact archive and restore workflows
- Smart lists and advanced filters
- Review center enhancements and guided cleanup
- Optional update feed (opt-in)

---

## Known Platform Limitations

- Call log access is not supported in Expo managed workflow
- Real-time caller ID is not supported on iOS
- Background tasks are OS-governed and not guaranteed to run continuously

---

## FAQ

**Does ContactForge work without internet?**
Yes. All core features are fully offline.

**Does ContactForge upload contacts?**
No. Your data stays on-device unless you export it.

**How are duplicates detected?**
By local scoring logic based on phones, emails, and name similarity. Every score includes reasons.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Creator

**Shivansh Mishra**

---

## License

MIT (see LICENSE)
