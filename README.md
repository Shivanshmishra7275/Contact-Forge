<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=240&color=0:111827,100:000000&text=ContactForge&fontSize=56&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=An%20offline-first,%20zero-cloud,%20privacy-first%20contact%20CRM.&descAlignY=60" width="100%" />

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

### 🛡️ An offline-first, zero-cloud, privacy-first contact CRM.

<p>
ContactForge is a premium utility designed for users who want complete ownership of their networks. Experience instantaneous performance and actionable insights without ever uploading a single byte to the cloud.
</p>

<br>

<a href="https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest">
  <img src="https://img.shields.io/badge/⬇_Download_Latest_APK-000000?style=for-the-badge&logo=android&logoColor=00FF00&labelColor=111111" height="54">
</a>

<br><br>

<i>100% Offline • Zero Telemetry • No Tracking • No Cloud</i>

</div>

---

# 📖 Why ContactForge?

ContactForge is engineered from the ground up to solve real-world networking problems at scale. We combine modern mobile infrastructure with ruthless data privacy:

### 1. ⚡ SQLite FTS5 for Instantaneous 10k+ Contact Search
Experience zero-latency search queries. ContactForge routes all search indexing directly to the C-level SQLite engine using Virtual Tables (FTS5). The result is microsecond filtering across tens of thousands of contacts.

### 2. 🛡️ Smart Delta Sync with Tombstone Conflict Resolution
Never fear data loss again. Our bespoke local sync engine uses Tombstone architecture (soft-deletes) to guarantee that deletions and merges propagate perfectly across devices. It provides strict idempotent background syncs and captures full pre-merge snapshots allowing single-tap rollbacks.

### 3. 🎯 Actionable CRM Interface
Stop scrolling and start acting. With one-tap deep links across the entire UI, you can instantly launch WhatsApp, compose an Email, or send an SMS directly from the contact profile. The cinematic Mission Control UI surfaces high-priority follow-ups immediately.

---

# 🎯 Built For

- **Privacy Advocates**: Users who explicitly reject cloud contact indexing and third-party data tracking.
- **Power Networkers**: People with massive contact lists who need scalable offline CRM features.
- **Offline Warriors**: Fast, zero-latency workflows regardless of connectivity.
- **Modern Developers**: Engineers eager to explore cutting-edge local-first architecture on React Native, Expo, and SQLite.

---

# ✨ Premium Features

### 🧹 Smart Merge & Cleanup Engine
Merge duplicates with surgical precision. Field-level conflict resolution, side-by-side visual diffs, and an "Ignore" memory ensure a clean CRM.

### 📥 100% Offline Import Studio
Import VCF and CSV files securely. Dynamic column mapping and robust truncation protection for large databases.

### ⏪ Global Undo Engine
Made a mistake? A resilient global safety system automatically captures pre-mutation snapshots for destructive actions (merges, bulk deletions), offering one-tap recovery.

### 📇 Offline QR Sharing & Backup Vault
Exchange vCards via local QR codes and export encrypted backups without ever touching a server.

---

# 🏛️ Architecture & Tech Stack

```txt
UI Layer (Stateless, React Native Paper, Reanimated) 
  ↓
State Management (Zustand)
  ↓
Service Layer (Deduplication, FTS Search, Backup)
  ↓
Repository Layer (SQLite Transactions, Tombstones)
  ↓
Database Layer (Expo SQLite / wa-sqlite)
```

### Technical Stack
* **Framework**: React Native with Expo (Managed Workflow)
* **Routing**: Expo Router (v3 Typed Routes)
* **Storage**: Expo SQLite with FTS5 
* **State**: Zustand
* **Platform Support**: Android, iOS, and Web (Metro Bundler)

---

# 💻 Developer Setup

### 1. Clone & Install
```bash
git clone https://github.com/Shivanshmishra7275/Contact-Forge.git
cd Contact-Forge
npm install
```

### 2. Start Development Server
```bash
npm start
npm run android   # Android emulator
npm run ios       # iOS simulator
```

### 3. Quality Assurance
```bash
npm run typecheck
npm run test
```

---

# 🚀 Version History

### 🏷️ V3.3: The Performance & Integrity Release
*Introduced FTS5 Indexed Search, Tombstone Sync hardening, bulk multi-select operations, and safe merge memory.*

### 🏷️ V3.2: Local Offline Group Management
*Introduced SQLite-backed tags and quick-filtering cohorts.*

### 🎨 V3.1: "Mission Control" UI Overhaul
*Cinematic Dark Mode, Reanimated physics, and 3D flashcard stacking.*

---

# 📄 License

<div align="center">

<a href="./LICENSE">
  <img src="https://img.shields.io/badge/License-MIT-111111?style=for-the-badge?logo=opensourceinitiative&logoColor=white" alt="MIT License">
</a>

<br><br>

## Architected by Shivansh Mishra
### B.Tech • Cloud Computing & Machine Learning

<i>Building privacy-first mobile systems with modern local-first architecture.</i>

</div>