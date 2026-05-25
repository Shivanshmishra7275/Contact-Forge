<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=240&color=0:111827,100:000000&text=ContactForge&fontSize=56&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Privacy-First%20Local%20Relationship%20Intelligence&descAlignY=60" width="100%" />

<br>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1200&color=9CA3AF&center=true&vCenter=true&width=1000&lines=Offline-First+Architecture;Zero+Cloud+Processing;Advanced+Contact+Cleanup+Engine;Built+with+Expo+%2B+React+Native+%2B+SQLite;Crafted+by+Shivansh+Mishra)](https://github.com/DenverCoder1/readme-typing-svg)

<br><br>

<img src="https://img.shields.io/badge/Expo-Managed_Workflow-000020?style=for-the-badge&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/React_Native-Mobile_App-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/SQLite-Local_Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />

<br><br>

<img src="https://img.shields.io/github/stars/Shivanshmishra7275/Contact-Forge?style=flat-square" />
<img src="https://img.shields.io/github/forks/Shivanshmishra7275/Contact-Forge?style=flat-square" />
<img src="https://img.shields.io/github/issues/Shivanshmishra7275/Contact-Forge?style=flat-square" />
<img src="https://img.shields.io/github/license/Shivanshmishra7275/Contact-Forge?style=flat-square" />

<br><br>

<img src="https://img.shields.io/badge/Architecture-Offline_First-111827?style=flat-square" />
<img src="https://img.shields.io/badge/Privacy-Local_Only-065F46?style=flat-square" />
<img src="https://img.shields.io/badge/Open_Source-Community_Ready-6D28D9?style=flat-square" />
<img src="https://img.shields.io/badge/License-MIT-black?style=flat-square" />

<br><br>

### 🛡️ A privacy-first mobile app for cleaning contacts, tracking relationships, and safely managing real-world networks

<p>
ContactForge is designed for people who want complete ownership of their networks. It provides fast on-device processing, relationship context tracking, follow-up reminders, and transparent cleanup workflows with zero dependence on cloud services.
</p>

<br>

<a href="https://github.com/Shivanshmishra7275/Contact-Forge/releases">
  <img src="https://img.shields.io/badge/⬇_Download_Latest_APK-000000?style=for-the-badge&logo=android&logoColor=00FF00&labelColor=111111" height="54">
</a>

<br><br>

<i>100% Offline • Zero Telemetry • No Tracking • No Cloud</i>

<br><br>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-why-contactforge">Why ContactForge</a> •
  <a href="#-built-for">Built For</a> •
  <a href="#-current-features">Features</a> •
  <a href="#-privacy-promise">Privacy</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-developer-setup">Setup</a> •
  <a href="#-engineering-roadmap">Roadmap</a>
</p>

</div>

---

# 📖 Overview

> ContactForge mirrors device contacts into a local SQLite database for fast search, explainable cleanup, relationship context tracking, follow-ups, and safe merges — without sending personal data to any backend.

<div align="center">

| 🛡️ Privacy First | ⚡ Fast Local Database | 📴 Fully Offline |
|---|---|---|
| No analytics, no silent uploads, no cloud processing. | SQLite-backed mirror for fast search and local workflows. | Core features are designed to work without internet access. |

</div>

ContactForge is built as a serious local-first utility rather than a thin contact viewer or a generic bloated CRM. It focuses on real-world networking problems such as neglected relationships, forgotten context, duplicates, inconsistent formatting, and cleanup workflows that users can review before anything destructive happens.

---

# 🎯 Built For

- **Network Maintainers**: People with large, unstandardized contact lists who need to remember where they met someone and when to follow up.
- **Privacy Advocates**: Users who explicitly reject cloud contact indexing, silent CRM uploads, and third-party data tracking.
- **Offline Reliability**: Mobile users needing fast, zero-latency local workflows while traveling or completely offline.
- **Power Users**: Serious managers who demand full control, advanced deduplication reviews, and safety guardrails.
- **Modern Developers**: Engineers eager to explore cutting-edge local-first architecture built on React Native, Expo, and SQLite.

---

# ✨ Current Features

ContactForge already supports a collection of high-fidelity local features:

### 📥 1. Import Studio
Perform 100% offline bulk imports from VCF and CSV files. Features dynamic column mapping, inline validation, and robust truncation protection for larger contact databases.

### 👯 2. Smart Merge Conflict Resolution
Merge duplicates with extreme safety. Offers side-by-side visual diffs, fields-selection resolution, and granular field override configurations before commits.

### ⏪ 3. Undo Engine
A resilient global safety system. Automatically captures pre-mutation snapshots of contacts during merges or deletions and records them locally. Allows instant one-tap recovery through a global mounting `UndoSnackbar`.

### 🧹 4. Power Cleanup Command Center
A premium utility dashboard categorizing contact issues into **Duplicates, Formatting, Incomplete, and Temporary**. Supports horizontal metrics filters, interactive multi-select toolbars, and a custom dark-frosted Safe Preview Modal ensuring full transaction safety.

### ⏳ 5. Temporary Contact Queue
Isolate short-lived, event-based, or incomplete numbers (e.g. deliveries, temporary service contacts) with customizable expiration dates, keeping your core contact book clean.

### 📇 6. Offline QR Sharing
Exchange information using locally generated, encrypted QR code cards. Scans and decodes standard contact objects 100% offline.

### 📦 7. Backup & Export Vault
Export records into standardized VCF or CSV formats. Maintain automatic local snapshot rotations to prevent database regressions.

### 🧠 8. Relationship Intelligence
Capture "where you met", relationship strength, warmth scores, and next actions. Surface high-value neglected contacts and follow-ups due directly on your dashboard.

### 🗓️ 9. Follow-up Reminders
Lightweight local scheduling for pending interactions (one-shot or recurring like 30/60/90 days), tracking the pulse of your network without a server.

---

# 🛡️ Privacy Promise

<div align="center">

## Your data stays on your device unless you explicitly choose to export it.

</div>

| 🚫 No Backend | 🛑 No Analytics | ☁️ No Cloud Sync | 🔇 No Silent Uploads |
|---|---|---|---|
| No server dependency for core workflows | No telemetry or tracking layer | No automatic cloud contact sync | No hidden contact uploads |

---

# 🏛️ Architecture & Tech Stack

ContactForge is built on a modular, local-first service repository architecture.

```txt
UI Layer (Stateless, React Native Paper) 
  ↓
State Management (Zustand)
  ↓
Service Layer (Deduplication, Normalization, Export)
  ↓
Repository Layer (SQLite Transactions, Snapshots)
  ↓
Database Layer (Expo SQLite / wa-sqlite)
```

### Technical Stack
* **Framework**: React Native with Expo (Managed Workflow)
* **Routing**: Expo Router (v3 Typed Routes)
* **Storage**: Expo SQLite (Local SQL-based transactions)
* **State**: Zustand (Simple, reactive single-store)
* **Validation**: Zod Schemas
* **Platform Support**: Android, iOS, and Web (Metro Bundler with custom WebAssembly WASM & SharedArrayBuffer configurations)

---

# 💻 Developer Setup

## 🚀 Quick Start

### 1. Clone & Enter Project
```bash
git clone https://github.com/Shivanshmishra7275/Contact-Forge.git
cd Contact-Forge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
# To start standard Expo server:
npm start

# To run Expo mobile client:
npm run android   # Android emulator
npm run ios       # iOS simulator
```

### 4. Run Web Platform
ContactForge supports web platforms with robust SQLite WebAssembly capabilities.
```bash
# Start Web client with cleared caches
npm run web
```

### Web SQLite requirements
SQLite on web depends on cross-origin isolation. The main HTML document must send:

- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Embedder-Policy: require-corp

If those headers are missing, the app will show a "Web preview limited" fallback
instead of initializing the local database.

Verify in the browser console:

- window.crossOriginIsolated should be true
- typeof SharedArrayBuffer !== 'undefined' should be true

Verify headers for the main document:

- PowerShell: Invoke-WebRequest http://localhost:8081 -Method Head -UseBasicParsing

Note: some device-only features (like native contact change listeners) are disabled on web.
The UI still works, but contact changes from the OS will not auto-refresh.

### Dev-only COOP/COEP proxy (if headers are missing)
If the main HTML response still lacks COOP/COEP headers, use the dev proxy to
inject them for local web testing.

```bash
# Terminal A: start Expo web
npm run web

# Terminal B: start COOP/COEP proxy (serves http://localhost:8082)
npm run web:coop
```

Then open http://localhost:8082 and verify:

- window.crossOriginIsolated === true
- typeof SharedArrayBuffer !== 'undefined'



---

## 🧪 Quality & Testing

We enforce extreme type safety and coverage:

```bash
# Run strict TypeScript typecheck
npm run typecheck

# Run ESLint linter
npm run lint

# Run Jest unit test suite
npm test
```

---

# 🚀 Version History & Solved Problems

### 🎯 V3: The Relationship Intelligence Release
*The goal of V3 was to make ContactForge useful every day by surfacing context, follow-ups, and an easier deduplication experience.*

**What it solved:** 
- Deduplication was previously overwhelming. V3 introduces a focused **Flashcard Duplicate Review** flow (one at a time, merge/dismiss/later).
- Users had opaque duplicate suggestions. V3 introduces a **Deterministic Heuristics Engine** providing human-readable exact match rules.
- Contacts lacked context. V3 adds **Relationship Intelligence**, tracking "where you met", warmth, next actions, and follow-up reminders.
- Finding duplicates required manual action. V3 adds **Dashboard Surfacing** with intelligent CTA widgets.

### 🔄 V2: The Data & Sync Foundation
*The goal of V2 was to make the offline database portable, safe, and visually clean.*

**What it solved:**
- Cloud lock-in. V2 introduced **WebDAV Sync Transport** for manual, offline-first syncing to private NAS/servers.
- Data loss fears. V2 built **Encrypted Local Backup**, allowing AES-CBC encrypted exports.
- Import chaos. V2 created the **Import Studio** with visual CSV/VCF column mapping.
- Unsafe cleanup. V2 added the **Undo Engine**, an automated snapshotting tool enabling one-tap rollback for destructive merges.

### 📱 V1: The Local Mirror
*The initial release focused entirely on establishing the core architecture.*

**What it solved:**
- Reliance on Google/Apple. V1 introduced the **Local SQLite Mirror Engine** that tracked native contacts with zero cloud dependency.
- Finding bad data. V1 shipped the initial **Cleanup Command Center** for sorting contacts missing names, emails, or valid phones.

---

# 🛣️ Future Roadmap

What remains planned for ContactForge:
- [ ] **Cross-Platform Release**: Native iOS distribution (currently optimized for Android APK).
- [ ] **Group Management**: Local offline tags and groups.
- [ ] **Automated Sync**: Background scheduled WebDAV sync (currently manual only).
- [ ] **Desktop Companion App**: Shared database management via web/desktop.

# 🤝 Contributing

Contributions are welcome! Please ensure:
- Logic remains 100% modular.
- Features remain offline-first.
- Code maintains type safety and is covered by unit tests.
- Privacy principles are strictly respected.

---

# 📄 License

<div align="center">

<a href="./LICENSE">
  <img src="https://img.shields.io/badge/License-MIT-111111?style=for-the-badge?logo=opensourceinitiative&logoColor=white" alt="MIT License">
</a>

<br><br>

## 🌟 Support the Project

If you love ContactForge, support the creator:

⭐ Starring the repository  
🍴 Forking the project  
📢 Sharing feedback or ideas  

<br>
<hr>
<br>

## Architected with 🖤 by <a href="https://github.com/Shivanshmishra7275">Shivansh Mishra</a>

### B.Tech • Cloud Computing & Machine Learning

<i>Building privacy-first mobile systems with modern local-first architecture.</i>

</div>