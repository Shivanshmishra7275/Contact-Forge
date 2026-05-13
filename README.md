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

## 📖 Overview

> **ContactForge is a privacy-first contact management app built for people who want full control over their address book.**

ContactForge mirrors device contacts into a local SQLite database for fast search and explainable cleanup workflows. Local-only edits do not write back to the device contact book. Everything stays on-device and works without internet.

<br>

<table align="center">
  <tr>
    <td align="center" width="33%">
      <h2>🛡️</h2>
      <b>Privacy First</b>
      <br><br>
      Built for absolute control. Zero reliance on cloud services, analytics, or hidden remote processing.
    </td>
    <td align="center" width="33%">
      <h2>⚡</h2>
      <b>SQLite Powered</b>
      <br><br>
      Mirrors device contacts into a local, highly-optimized database for lightning-fast search and cleanup.
    </td>
    <td align="center" width="33%">
      <h2>📴</h2>
      <b>100% Offline</b>
      <br><br>
      No backend. No syncing. Everything stays on your device and works flawlessly without an internet connection.
    </td>
  </tr>
</table>


---

<div align="center">
  <h3>🚀 Ready to experience privacy-first management?</h3>
  <br>
  <a href="https://expo.dev/accounts/shivansh_98/projects/contactforge/builds/07338ef6-0b23-41f7-8dcb-03ee90097c9a">
    <img src="https://img.shields.io/badge/Download_ContactForge_V2.0-000000?style=for-the-badge&logo=android&logoColor=00FF00&labelColor=111111" alt="Download APK" height="50">
  </a>
  <br>
  <p><i>100% Offline. Zero Data Harvesting.</i></p>
</div>

---

## 💡 Why ContactForge?

<div align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <h3>🌪️ The Problem</h3>
        <p>Real-world contact lists become messy over time. Duplicates appear after imports, names get inconsistent, and temporary contacts pile up.</p>
      </td>
      <td align="center" width="50%">
        <h3>🛡️ The Solution</h3>
        <p><b>ContactForge</b> solves the chaos with a local-first workflow that is completely <i>safe, explainable, and review-driven.</i></p>
      </td>
    </tr>
  </table>
</div>

---

## ✨ Key Features

<table>
  <tr>
    <td width="50%">
      <h3>🪞 Local Contact Mirror</h3>
      <p>Lightning-fast search and smooth pagination, processed entirely on-device.</p>
    </td>
    <td width="50%">
      <h3>👯‍♀️ Smart Deduplication</h3>
      <p>Advanced duplicate detection with clear confidence scores and reason lists.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🛡️ Safe Merge Reviews</h3>
      <p>Preview changes safely before executing merges to prevent data loss.</p>
    </td>
    <td>
      <h3>🧹 The Cleanup Center</h3>
      <p>One-tap formatting fixes and automated data-quality standardization.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>❤️ Contact Health Score</h3>
      <p>Explainable metrics and smart suggestions to keep your address book pristine.</p>
    </td>
    <td>
      <h3>⏳ Temporary Workflows</h3>
      <p>Create auto-expiring temporary contacts so your list doesn't get cluttered over time.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>📇 Offline QR Card</h3>
      <p>Instantly share your personal business card without needing an internet connection.</p>
    </td>
    <td>
      <h3>📦 Export & Backup Vault</h3>
      <p>Securely export to CSV/VCF and manage versions in a dedicated local backup vault.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🧠 Deep Context Mapping</h3>
      <p>Add rich local notes and build visual relationship maps between contacts.</p>
    </td>
    <td>
      <h3>⚙️ Automated Maintenance</h3>
      <p>Opt-in best-effort background cleanup and discrete, optional update checks.</p>
    </td>
  </tr>
</table>


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
