<div align="center">

# ⭐ T.G.S Mishra Presents

# ContactForge

## *My First Mobile App*

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=24&pause=1000&color=8b7eff&center=true&vCenter=true&width=980&lines=ContactForge+%E2%80%94+Privacy-First+Offline+Contact+Manager;Clean+duplicates+%7C+Organize+contacts+%7C+Local+relationships;Built+with+Expo%2C+React+Native%2C+TypeScript+and+SQLite;Phase+8%3A+Premium+cinematic+upgrade;Created+by+T.G.S+Mishra+(Shivansh+Mishra)" alt="ContactForge typing banner" />

<br />

<img alt="Expo" src="https://img.shields.io/badge/Expo-Mobile_App-000020?style=for-the-badge&logo=expo&logoColor=white" />
<img alt="React Native" src="https://img.shields.io/badge/React_Native-Cross_Platform-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img alt="SQLite" src="https://img.shields.io/badge/SQLite-Local_Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
<img alt="Offline First" src="https://img.shields.io/badge/Offline-First-1B4332?style=for-the-badge" />
<img alt="Privacy First" src="https://img.shields.io/badge/Privacy-Local_Only-0F766E?style=for-the-badge" />
<img alt="Premium UI" src="https://img.shields.io/badge/UI-Premium_Cinematic-8b7eff?style=for-the-badge" />

<br />

### 🎯 Built by: **T.G.S Mishra** (Shivansh Mishra)

**First Mobile App • Phase 8: Premium Cinematic Upgrade**

---

> **T.G.S Mishra** — Software Engineer specializing in Machine Learning, Data Science & Mobile Architecture
>
> ContactForge is my first mobile app, representing a commitment to offline-first design, premium user experience, and production-grade software architecture. This project demonstrates full-stack mobile development capabilities, from SQLite schema design to React Native component architecture to TypeScript-safe state management.
>
> This is my portfolio piece for mobile development excellence. 🚀

### 🔗 Connect with me:
- **GitHub:** [github.com/Shivanshmishra7275](https://github.com/Shivanshmishra7275)
- **Project:** [github.com/Shivanshmishra7275/Contact-Forge](https://github.com/Shivanshmishra7275/Contact-Forge)

</div>

---

## Cinematic Snapshot

> A calm, offline-first contact studio for real-world contact chaos.
>
> ContactForge turns duplicate cleanup, merge safety, temporary contact review, and local backup/export into a single trusted workflow that never leaves the device.

## 📥 Download App

**Latest Build:** ContactForge Phase 8 (Premium Cinematic Upgrade)

[📱 Download Android APK from EAS Build](https://example.com/contactforge-latest-android.apk)

> ⚠️ **Before Publishing:** Replace placeholder URL with your latest EAS Android APK build link
> - Go to EAS Dashboard: https://expo.dev/
> - Copy your production Android APK link
> - Update this README with the real link

## Table of Contents

- [Overview](#overview)
- [Project Idea](#project-idea)
- [Why ContactForge](#why-contactforge)
- [Core Principles](#core-principles)
- [Key Features](#key-features)
- [What Makes This Project Different](#what-makes-this-project-different)
- [Current Build Status](#current-build-status)
- [Verified Build Health](#verified-build-health)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Platform Boundaries](#platform-boundaries)
- [Open-Source Goals](#open-source-goals)
- [Feature Comparison](#feature-comparison)
- [Who This Project Is For](#who-this-project-is-for)
- [Why This Is a Strong Project](#why-this-is-a-strong-project)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author Highlight](#author-highlight)
- [README Notes](#readme-notes)

## Overview

ContactForge is a privacy-first, offline contact management app for people who want more control over messy address books without sending data to a backend, analytics service, or cloud sync layer.

It is designed for real-world contact maintenance: duplicate cleanup, safe merges, temporary contacts, local review queues, and timestamped exports. The app uses Expo Contacts for device access and Expo SQLite for local persistence, so the core workflows stay on-device and auditable.

## Project Idea

The idea behind ContactForge is simple: most contact apps are built for lookup, not maintenance. After years of phone migrations, SIM imports, partial saves, and manual edits, contact lists become hard to trust. Duplicates appear, names become inconsistent, phone numbers lose formatting, temporary entries linger, and search results become noisy.

ContactForge solves that problem with a local-only workflow that helps users clean, review, organize, and back up their contacts without giving up privacy. Instead of acting like a caller-ID network or CRM, it focuses on the practical work of keeping a personal address book healthy over time.

<details>
<summary><strong>Project vision</strong></summary>

ContactForge is intended to feel like a control room for your address book: not a social layer, not a cloud product, and not a gimmick. It is a practical mobile utility for the hard, boring, valuable work of contact hygiene.

</details>

## Why ContactForge

- Contact clutter grows slowly and becomes painful later.
- Duplicate resolution is safer when it is explainable and preview-first.
- Cleanup should be reversible, not destructive by default.
- Temporary and unknown contacts need a local review path.
- Exports and safety snapshots should stay on the device.

## Core Principles

- **Privacy-first** — contact data stays on the device.
- **Offline-first** — core workflows continue without a network connection.
- **Safety-first** — destructive actions require confirmation and preview.
- **Explainable automation** — duplicate and cleanup suggestions always show reasons.
- **Honest platform scope** — unsupported Expo capabilities are not faked.

## Key Features

### 1. Contact permissions and access
- Requests contact access through Expo Contacts.
- Handles denied states with a dedicated fallback screen.
- Explains why access is needed in plain language.
- Supports the app-only privacy model without hidden network behavior.

### 2. Local contact mirror
- Reads device contacts in chunks.
- Mirrors relevant fields into normalized SQLite tables.
- Tracks sync state locally.
- Keeps the native contact ID linked to the local record.
- Uses repository-based persistence so domain logic stays out of UI code.
- Refreshes the contact list when the app returns to the foreground or native contacts change.

### 3. Duplicate resolution
- Detects exact phone and email matches.
- Compares normalized names.
- Uses local fuzzy matching for near-duplicates.
- Shows reason metadata for every candidate.
- Supports safe merge previews and merge history snapshots.

### 4. Safe merge workflow
- Provides field-level merge previews.
- Lets users choose which values to keep.
- Saves merge snapshots before destructive actions.
- Records merge history for transparency.
- Avoids silent or black-box data loss.

### 5. Temporary and unknown workflows
- Creates temporary contacts with optional expiry.
- Supports heuristic tags such as Temporary, Needs Naming, Review Later, and Possibly Promotional.
- Keeps unknown-number workflows local and manual.
- Avoids any reliance on call-log mining or caller-ID systems.

### 6. Cleanup and standardization
- Cleans casing and whitespace.
- Flags malformed or duplicate phone numbers.
- Adds safe country codes when appropriate.
- Detects ghost contacts.
- Supports bulk cleanup review and bulk fixes.

### 7. Search and organization
- Search by name, normalized phone, and email.
- Filter by duplicate state, cleanup status, temporary state, and tags.
- Keep the heavy lifting in SQLite indexes rather than render-time list transforms.

### 8. Backup and export
- Exports to CSV and VCF locally.
- Creates timestamped backup files.
- Provides a local Backup Vault for listing, sharing, and deleting backups.
- Captures safety snapshots before risky operations.

### 9. Premium offline features (Phase 8)
- **Contact Memory Notes** — Structured contextual notes per contact (where met, important dates, family context, work notes).
- **Relationship Mapping** — Link contacts as family, colleagues, managers, etc. with directional support.
- **QR Business Card** — Generate local QR codes from user's contact card (offline, no internet required).
- **Contact Health Score** — Explainable quality score based on field completeness, notes, relationships, recency.
- **Cinematic UI** — Premium dark mode, smooth Reanimated animations, tactile haptic feedback, elevated card design.
- **Developer Branding** — Architect's portfolio card with premium styling and hidden developer menu.

## What Makes This Project Different

ContactForge is not trying to be a social product, caller-ID network, or cloud CRM. Its strength is focus: it solves the real maintenance problems of a personal contact library while respecting the boundaries of privacy, device permissions, and platform limitations.

That also makes it a strong open-source project. It combines contact permissions, local data modeling, offline-first application design, safe mutation workflows, and large-list performance concerns in a single real-world repository.

<details>
<summary><strong>Design intent</strong></summary>

The app is intentionally utility-first. Every major flow is designed to be previewable, explainable, and local. The goal is trust, not novelty.

</details>

## Current Build Status

### Completed phases
- **Phase 0** — Project setup, folder structure, dependency list, architecture docs.
- **Phase 1** — App shell, navigation, theming, permission fallback, SQLite bootstrap, store bootstrap.
- **Phase 2** — Contact permissions flow, contact ingestion, local mirror storage, list/search foundation.
- **Phase 3** — Duplicate detection engine, duplicate queue, merge preview, safe merge flow.
- **Phase 4** — Temporary contacts, unknown workflows, local heuristic tagging, grouping logic.
- **Phase 5** — Cleanup center, standardization actions, ghost cleanup, bulk review.
- **Phase 6** — CSV / VCF export, local backup vault, safety snapshots.
- **Phase 7** — Performance optimization, Tab navigation fixes, bulk selection workflows, README polish.

### Current phase
- **Phase 8** — Premium cinematic UI upgrade, advanced offline features, developer branding, contact notes, relationship mapping, QR business cards, contact health scores.

## Verified Build Health

- **TypeScript** passes with `npx tsc --noEmit`.
- **Unit tests** pass with `npx jest --watchAll=false`.
- **Offline-only behavior** is preserved.

<details>
<summary><strong>Current quality signal</strong></summary>

The repository is currently type-clean and the unit suite passes. The main remaining work is polish, wider test coverage, and contribution readiness rather than foundational correctness.

</details>

## Key Screens

- Dashboard
- Contact list
- Contact detail
- Duplicates queue
- Merge review
- Cleanup center
- Temporary contacts workflow
- Backup vault
- Settings
- Permission denied fallback
## Tech Stack

- **Expo / React Native** for cross-platform mobile development.
- **TypeScript** for strict application logic.
- **Expo Router** for file-based navigation.
- **Expo Contacts** for native contact access.
- **Expo SQLite** for normalized local persistence.
- **Zustand** for lightweight app state.
- **React Native Paper** for the UI layer.
- **Expo FileSystem** and **Expo Sharing** for local export and sharing.
- **React Hook Form** and **Zod** are available for future form-heavy flows.

## Architecture

The repository is structured to keep UI, domain logic, persistence, and utilities separate.

```text
app/
src/
  constants/
  db/
    schema/
    repositories/
  services/
  store/
  tests/
  types/
  utils/
docs/
```

This makes it easier to test core logic outside the UI and to keep contact handling safe, local, and maintainable.

<details>
<summary><strong>Architecture goal</strong></summary>

Business logic stays in services, persistence stays in repositories, and screens remain thin. That structure is what keeps the project scalable as Phase 7 adds polish and broader test coverage.

</details>

## Data Model

The local schema centers on normalized contact management:

- `contacts` — local contact mirror
- `phone_numbers` — normalized phone numbers
- `emails` — normalized emails
- `duplicate_candidates` — duplicate pair detection
- `duplicate_groups` — grouped duplicates
- `merge_history` — merge operation audit trail
- `temporary_contacts` — expirable contacts
- `settings` — app preferences
- `sync_state` — sync status tracking
- `audit_logs` — action audit trail
- `contact_notes` — **Phase 8** contextual notes (where met, important dates, family context, work)
- `contact_relationships` — **Phase 8** relationship linking (family, colleague, manager, etc.)
- `profile_cards` — **Phase 8** user's own contact card (for QR generation)

Important indexes are defined for:

- `native_contact_id`
- `normalized_phone`
- `normalized_email`
- `normalized_name`
- `updated_at`
- `duplicate_confidence`
- `temporary_expiry_at`

## Platform Boundaries

ContactForge avoids pretending unsupported native capabilities exist. It does not depend on call-log mining, caller-ID lookups, or hidden background services in the Expo managed workflow.

Unknown-number workflows stay local and manual. That keeps the product honest and avoids platform behavior that Expo cannot reliably guarantee.

<details>
<summary><strong>Explicit MVP exclusions</strong></summary>

- No call-log scanning.
- No automatic caller-ID system.
- No hidden background sync.
- No remote enrichment service.
- No cloud storage dependency.

</details>

## Open-Source Goals

- Maintainable folder structure.
- Small, focused files.
- Testable core logic.
- Clear issue boundaries.
- Documented architecture.
- Practical UX decisions.
- Safe handling of destructive operations.
- Contributor-friendly module ownership.

## Feature Comparison

| Area | ContactForge approach | Why it matters |
|---|---|---|
| Privacy | Local-only processing | Keeps contact data on-device |
| Storage | SQLite on device | Works offline and remains searchable |
| Duplicate review | Explainable queue with reasons | Safer than silent auto-merge |
| Cleanup | Preview-first transformations | Avoids destructive surprises |
| Unknown numbers | Manual/local workflows | Stays within platform reality |
| Backup | Local exports and vault | Creates trust before risky actions |

## Who This Project Is For

ContactForge is useful for:

- privacy-conscious users,
- people with years of contact clutter,
- users migrating across many devices,
- developers interested in offline-first architecture,
- contributors who like practical mobile tooling,
- maintainers who want a real utility, not a demo.

## Why This Is a Strong Project

ContactForge demonstrates contact permissions, local persistence, schema design, duplicate detection, cleanup workflows, backup generation, and safe mutation patterns in one coherent mobile product.

That makes it valuable both as a real utility and as an open-source engineering portfolio project.

<details>
<summary><strong>Portfolio value</strong></summary>

This project shows product thinking, data modeling, safety-minded mutation design, and the ability to work within real platform constraints. It is useful as a mobile app and as a public example of production-minded engineering.

</details>

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI / Expo tooling
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
npm start
npm run android
npm run ios
```

### Run on an Android phone

1. Install the Expo Go app from the Play Store, or use a dev build if you already have one.
2. Start the project with `npm start`.
3. Scan the QR code from the Expo terminal using Expo Go, or open the app through your Android emulator/device connection.
4. Make sure the phone and the development machine are on the same network, or use a tunnel if your network blocks local discovery.

### Share a downloadable Android build

If you want someone to install the app directly, build an internal Android APK and share the generated download link.

```bash
npx eas build --profile preview -p android
```

If this is the first EAS build for your account, run `npx eas build:configure` once first.

Use the build output link to share the app. For Play Store distribution, use the `production` profile, which generates an `aab`.

### Deep verification

- `npm test`
- `npx tsc --noEmit`
- `npx expo-doctor`

## Testing

```bash
npm test
npx tsc --noEmit
```

## Roadmap

### Phase 7
- Performance optimization
- Expanded tests
- Documentation polish
- Open-source readiness

## Contributing

Contributions are welcome. Good areas for improvement include duplicate heuristics, cleanup transforms, export formatting, accessibility, list performance, tests, and docs.

Recommended contribution areas:

- database repositories,
- duplicate heuristics,
- cleanup transforms,
- export generation,
- UI accessibility,
- state management,
- testing infrastructure,
- docs and onboarding.

## Author Highlight

### **T.G.S Mishra** (Shivansh Mishra)

Building ContactForge as a privacy-focused open-source utility centered on trust, local ownership, and long-term maintainability. This is my first mobile app and represents a serious commitment to:

✨ **Offline-first mobile engineering** — Understanding distributed systems and constraints  
✨ **Clean data workflows** — Designing schemas and managing complex state  
✨ **User-respecting software** — Privacy-by-default and transparency in mutations  
✨ **Production-grade quality** — TypeScript strict mode, comprehensive testing, professional UX  
✨ **Portfolio excellence** — Demonstrating full-stack capabilities for recruiters and collaborators  

### Why This Project Matters

This is not a toy app. ContactForge combines:

- **Contact permissions handling** (platform-specific quirks)
- **SQLite schema design** (normalized data modeling)
- **Duplicate detection** (fuzzy matching and confidence scoring)
- **Safe mutation workflows** (preview-first, confirmation-gated operations)
- **Large-list performance** (windowing, memoization, optimized queries)
- **Offline operation** (100% local, zero backend)
- **Premium UI/UX** (React Native Paper, Reanimated, haptic feedback)
- **Production-ready code** (TypeScript strict, JSDoc comments, error handling)

### Connect

- **GitHub Profile:** [github.com/Shivanshmishra7275](https://github.com/Shivanshmishra7275)
- **This Repository:** [Contact-Forge](https://github.com/Shivanshmishra7275/Contact-Forge)
- **Specializations:** Machine Learning, Data Science, Mobile Architecture

## README Notes

- No backend.
- No analytics.
- No cloud sync.
- No hidden network dependency.
- No call-log mining.
- All destructive actions should remain preview-first and confirmation-gated.
- Backup files are local and timestamped.
- Current verified state: phases 0 through 6 are complete.
