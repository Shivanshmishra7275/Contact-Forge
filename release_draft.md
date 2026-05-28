# 🚀 ContactForge v4.0.1 — Hotfix + Premium Design Overhaul

This release contains **critical stability fixes** from the v4.0.0 launch and a sweeping **UI/UX design overhaul**.

## 🔥 Critical Fixes (v4.0.1)

### 🪲 Fixed: App crash on upgrade (schema migration race condition)
Users upgrading from v3.3 to v4.0.0 encountered a fatal crash loop. The root cause was a SQLite schema migration executing `CREATE INDEX ON contacts(name_key)` **before** the migration that added the `name_key` column. This caused a `no such column` fatal error that cascaded into:
- Every sync crashing with "no such column: name_key"  
- Terms & Conditions screen showing on every launch (settings couldn't load)
- Magic Merge All button crashing

**Fix:** Reordered schema bootstrap so `COLUMN_MIGRATIONS` always run before `CREATE_INDEXES`.

### 🪲 Fixed: Library Health always showing 0%
Health was calculated by running 5 DB queries per contact × 1800 contacts = **9,000+ DB round trips** — which silently timed out. Replaced with a single SQL `AVG()` aggregation query.

### 🪲 Fixed: Splash screen text truncation
The typewriter loading text was being clipped mid-word on some Android screen densities. Fixed with proper layout constraints.

---

## ✨ New: Premium Design System v4.0.1

A complete visual overhaul based on WCAG AA accessibility standards and 2025 mobile design trends:

### 🎨 Color System & UI
- **Richer background**: Deep navy eliminates harsh halation
- **WCAG AA compliant text**: All text colors verified to 4.5:1+ contrast ratio
- **3-Layer Aurora Background**: Three breathing radial gradients (violet, teal, indigo) that slowly drift.
- **Glass Cards 2.0**: Cards now have proper box shadow depth and subtle border edges.
- **Tab Bar Overhaul**: Solid opaque background, proper elevation shadow, active tint.
- **Automatic First Sync**: On first launch with contacts permission, the app automatically begins syncing.

---

## 📥 Getting Started
Download the APK below, or clone the repository to run locally on Expo Go. 

### 📦 Asset Details
- **File:** `ContactForge-v4.0.1.apk`
- **Size:** 92 MB
- **SHA-256:** `ACEE059F4EBF2D055BADB3B6D3C76B944E7FD123B2BD81F6C61A4C2A093FBB8B`

---
**Architected with 🖤 by Shivansh Mishra**  
*Building privacy-first mobile systems with modern local-first architecture.*
