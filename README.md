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
<img src="https://img.shields.io/badge/Release-v4.3.0-2563EB?style=flat-square" />

<br><br>

### 🛡️ An offline-first, zero-cloud, privacy-first contact CRM.

<p>
ContactForge is a premium utility designed for users who want complete ownership of their networks. Experience instantaneous performance, algorithmic deduplication, and actionable insights without ever uploading a single byte to the cloud.
</p>

<a href="https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest">
  <img src="https://img.shields.io/badge/⬇_Download_Latest_APK-000000?style=for-the-badge&logo=github&logoColor=ffffff&labelColor=111111" height="54" alt="Download latest APK from GitHub">
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

# ✨ What's New in v4.3.0 (The Premium Design Update)

- **2-Way Native OS Write-Back Sync:** Push perfectly cleaned, merged, and enhanced Contact-Forge libraries directly back to your iOS or Android native address book.
- **Full CRM Contact Editing:** Dynamically edit names, companies, job titles, notes, and tags directly inside the app.
- **Shake-to-Undo Global Gesture:** Accidentally merged the wrong contacts? Just physically shake your phone to trigger a premium global Undo action with haptic feedback.
- **Single Contact VCF Sharing:** Instantly generate a `.vcf` file and pop up the native iOS/Android share sheet.
- **Cinematic UI Overhaul:** Buttery-smooth 60fps scrolling using Shopify's `FlashList`, 3-layer aurora glass backgrounds, `react-native-reanimated` physics, and WCAG AA accessibility color tuning.

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
Infrastructure (Expo SQLite, Expo FileSystem, Expo Contacts)
```

---

**Architected with 🖤 by Shivansh Mishra**
