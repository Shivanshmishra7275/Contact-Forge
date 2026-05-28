# ðŸš€ ContactForge v4.3.0 â€” Hotfix + Premium Design Overhaul

This release contains **critical stability fixes** from the v4.0.0 launch, a sweeping **UI/UX design overhaul**, and major bugfixes to the Power Cleanup UI.

## ðŸ”¥ Critical Fixes (v4.3.0)

### ðŸª² Fixed: Android Aurora SVG Crash
Android's SVG rendering engine silently failed when animating `AnimatedRadialGradient` via `useAnimatedProps`, resulting in a completely black screen instead of the Premium Design Aurora background. Completely rewrote the animation engine to use native static SVGs wrapped in `Animated.View` transforming matrices. The background now breathes at a buttery 60 FPS on Android.

### ðŸª² Fixed: "Missing critical contact field" UI Bug in Power Cleanup
The Power Cleanup UI mistakenly grouped ANY contact missing an email address into the "Incomplete" tab. This completely hid their fixable formatting errors (like Duplicate Numbers and Missing Country Codes), and disabled the "Fix Formatting" bulk action. Refactored the internal mapping logic to strictly separate formatting and incomplete issues, enabling bulk-formatting automation for all 1600+ contacts.

### ðŸª² Fixed: App crash on upgrade (schema migration race condition)
Users upgrading from v3.3 to v4.0.0 encountered a fatal crash loop. The root cause was a SQLite schema migration executing `CREATE INDEX ON contacts(name_key)` **before** the migration that added the `name_key` column. This caused a `no such column` fatal error that cascaded into:
- Every sync crashing with "no such column: name_key"  
- Terms & Conditions screen showing on every launch (settings couldn't load)
- Magic Merge All button crashing

**Fix:** Reordered schema bootstrap so `COLUMN_MIGRATIONS` always run before `CREATE_INDEXES`.

### ðŸª² Fixed: Library Health always showing 0%
Health was calculated by running 5 DB queries per contact Ã— 1800 contacts = **9,000+ DB round trips** â€” which silently timed out. Replaced with a single SQL `AVG()` aggregation query.

### ðŸª² Fixed: Splash screen text truncation
The typewriter loading text was being clipped mid-word on some Android screen densities. Fixed with proper layout constraints.

### ðŸª² Fixed: Magic Merge All nested transaction crash
A massive regression where clicking "Magic Merge All" caused an immediate crash with `cannot rollback - no transaction is active`. This was due to an `expo-sqlite` limitation where a nested transaction inside `reassignRelationships` conflicted with the parent bulk merge transaction. Stripped out the nested wrapper so the merge executes smoothly within a single atomic commit.

### ðŸª² Fixed: Website APK Download Timeout (504 Gateway Error)
Users downloading the 92MB APK from the website frequently experienced a failed download. Vercel serverless functions have a 10s execution limit, causing the stream to forcibly timeout. Refactored the `/api/download` route to track analytics via Redis and immediately HTTP 302 redirect directly to the GitHub CDN, allowing full high-speed downloads directly from S3.

---

## âœ¨ New: Premium Design System v4.3.0

A complete visual overhaul based on WCAG AA accessibility standards and 2025 mobile design trends:

### ðŸŽ¨ Color System & UI
- **Richer background**: Deep navy eliminates harsh halation
- **WCAG AA compliant text**: All text colors verified to 4.5:1+ contrast ratio
- **3-Layer Aurora Background**: Three breathing radial gradients (violet, teal, indigo) that slowly drift.
- **Glass Cards 2.0**: Cards now have proper box shadow depth and subtle border edges.
- **Tab Bar Overhaul**: Solid opaque background, proper elevation shadow, active tint.
- **Automatic First Sync**: On first launch with contacts permission, the app automatically begins syncing.

---

## ðŸ“¥ Getting Started
Download the APK below, or clone the repository to run locally on Expo Go. 

### ðŸ“¦ Asset Details
- **File:** `ContactForge-v4.3.0.apk`
- **Size:** ~92 MB
- **SHA-256:** `6CEC19FAF9CFB6352DC8424994352E5F762B391EE972C18A2AB492449E506FF0`

---
**Architected with ðŸ–¤ by Shivansh Mishra**  
*Building privacy-first mobile systems with modern local-first architecture.*

