<div align="center">

# ContactForge

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1200&color=4B5563&center=true&vCenter=true&width=1000&lines=ContactForge+-+Privacy-First+Offline+Contact+Management;Clean+duplicates.+Organize+messy+contacts.+Export+safely.;Built+with+Expo%2C+React+Native%2C+TypeScript+and+SQLite;Crafted+by+Shivansh+Mishra)](https://github.com/DenverCoder1/readme-typing-svg)

![Expo](https://img.shields.io/badge/Expo-Managed%20Workflow-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-Mobile%20App-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local%20Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Offline First](https://img.shields.io/badge/Architecture-Offline%20First-111827?style=for-the-badge)
![Privacy First](https://img.shields.io/badge/Privacy-Local%20Only-065F46?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open%20Source-Community%20Ready-6D28D9?style=for-the-badge)

**A privacy-first, offline mobile app for cleaning, organizing, deduplicating, and safely managing real-world contact libraries.**

Crafted by **Shivansh Mishra**

</div>

---

## Overview

ContactForge mirrors device contacts into a local SQLite database for fast search and explainable cleanup workflows. Local-only edits do not write back to the device contact book. Everything stays on-device and works without internet.

ContactForge is a privacy-first contact management app built for people who want full control over their address book without relying on cloud services, analytics, or hidden remote processing.

---

## Why ContactForge

Real-world contact lists become messy over time: duplicates appear after imports, names get inconsistent, and temporary contacts pile up. ContactForge solves that with a local-first workflow that is safe, explainable, and review-driven.

---

## Key Features

- Local contact mirror with fast search and pagination
- Duplicate detection with confidence scores and reason lists
- Merge review with safe previews
- Cleanup center for formatting and data-quality fixes
- Temporary contact workflows with expiry
- Notes and relationship mapping
- Contact Health Score with explainable suggestions
- CSV and VCF export plus local backup vault
- Offline QR business card
- Best-effort background maintenance (opt-in)
- Optional update checks (opt-in)

---

## Local-First Privacy Promise

- No backend
- No analytics or tracking
- No cloud sync
- No silent uploads

Your data never leaves the device unless you explicitly export and share it. Any online feature is optional and opt-in.

---

## Tech Stack

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- Expo Contacts
- Expo SQLite
- React Native Paper
- Zod
- React Hook Form
- Expo FileSystem

---

## Architecture Highlights

ContactForge follows a modular layout focused on long-term maintainability.

```bash
app/
  (tabs)/
  contact/
  merge/
src/
  constants/
  db/
    repositories/
    schema/
  services/
  store/
  tests/
  types/
  utils/
docs/
```

Core principles:
- Business logic stays outside UI components
- Persistence is separated through repositories
- Contact data is normalized before analysis
- Risky actions require previews and confirmation
- Local-only processing is non-negotiable

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/ACTUAL_DATABASE_SCHEMA.md](docs/ACTUAL_DATABASE_SCHEMA.md).

---

## Screenshots

Add your best app screenshots here for maximum GitHub and LinkedIn impact.

```md
## Screenshots

<p align="center">
  <img src="./assets/dashboard.png" alt="ContactForge dashboard" width="280" />
  <img src="./assets/duplicates.png" alt="Duplicate detection queue" width="280" />
</p>
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (via `npx`)

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

## Android APK Build (EAS)

```bash
npx expo-doctor
npx eas build --profile preview -p android
```

Production AAB (Play Store):

```bash
npx eas build --profile production -p android
```

---

## APK Download

Direct APK links are only published when a GitHub Release includes them.

- Releases: https://github.com/Shivanshmishra7275/Contact-Forge/releases
- If no APK is listed, use the preview build command above.

---

## Known Platform Limitations

- Call log access is not supported in Expo managed workflow
- Real-time caller ID is not supported on iOS
- Background tasks are OS-governed and not guaranteed to run continuously

---

## Roadmap

- Import studio (CSV and VCF) with field mapping and collision review
- Contact archive and restore workflows
- Smart lists and advanced filters
- Review center enhancements and guided cleanup
- Optional update feed (opt-in)

---

## Contributing

Contributions are welcome. Please keep logic modular, testable, and offline-first.

---

## License

MIT (see LICENSE)

---

Crafted by **Shivansh Mishra**
