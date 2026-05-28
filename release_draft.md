# 🚀 ContactForge v4.0.0: The Complete CRM & Write-Back Sync Release

We are thrilled to announce **ContactForge v4.0.0** — our biggest and most feature-rich update yet!

This release bridges the gap between ContactForge and your native phone OS, introduces full CRUD CRM editing capabilities, and adds a suite of premium UI/UX enhancements.

## 🔥 What's New in v4.0.0?

### 🔄 2-Way Native OS Write-Back Sync
ContactForge is no longer an isolated island. With the new **Write Back to Phone** feature in the Mission Control Dashboard, you can push your perfectly cleaned, merged, and enhanced Contact-Forge library directly back to your iOS or Android native address book. Clean up duplicates here, and let the changes reflect everywhere!

### 📝 Full CRM Contact Editing
You no longer need to jump to your phone's native address book to fix typos. We've added a dedicated **Edit Contact** screen. Tap the Pencil Icon in the top right of any Contact's Detail page to dynamically edit their name, company, job title, notes, and tags.

### 🫨 Shake-to-Undo Global Gesture
Accidentally merged the wrong contacts? Accidentally deleted someone? Just **physically shake your phone**! We've integrated hardware accelerometer sensors to trigger a premium global Undo action, complete with haptic feedback.

### 📤 Single Contact VCF Sharing
While bulk export is great for backups, sometimes you just need to share a single person's info. We've added a **Share Contact Card** button in the Contact Details screen. Tap it to instantly generate a `.vcf` file and pop up the native iOS/Android share sheet.

### 🎬 Cinematic UI & FlashList Virtualization
We've completely overhauled the list rendering engines using Shopify's `FlashList`, guaranteeing buttery-smooth 60fps scrolling even with 2,000+ contacts. Plus, we've injected `react-native-reanimated` physics, giving lists a beautiful cascading fade-in effect. Dark mode colors have also been tweaked for optimal WCAG accessibility and premium aesthetics.

---

## 🛠️ Previous Highlights (v3.3)
- **SQLite FTS5 Indexed Search**: Microsecond filtering across tens of thousands of contacts.
- **Zero-Loss Tombstone Sync Architecture**: Safe deletions and flawless sync propagation.
- **Bulk Action Multi-Select**: Mass delete and mass export capabilities.
- **Safe Merge Memory**: Persistent 'Ignore Duplicate' functionality.

## 📥 Getting Started
Download the latest signed APK from the assets below, or clone the repository to run it locally on Expo. No servers. No cloud. Just your data, perfectly synced.

---
**Architected with 🖤 by Shivansh Mishra**
*Building privacy-first mobile systems with modern local-first architecture.*
