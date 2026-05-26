# 🚀 ContactForge v3.3.0: The Performance & Integrity Update

We are thrilled to announce **ContactForge v3.3.0** — a massive architectural leap forward for our offline-first, zero-cloud contact CRM. 

This release focuses entirely on scaling the application for power-networkers and fortifying the data integrity of the local engine. We've ripped out the bottlenecks, upgraded the search engine, and made synchronization virtually bulletproof.

## 🔥 What's New?

### ⚡ SQLite FTS5 Indexed Search
Say goodbye to UI stutter on large contact lists. We've replaced the old JS-filtered search with a **C-level SQLite Virtual Table (FTS5)** implementation. Searches across 10,000+ contacts are now instantaneously resolved at the database layer.

### 🛡️ Zero-Loss Tombstone Sync Architecture
Data synchronization just got a major integrity upgrade. Deleting a contact now safely **tombstones** the record (`is_deleted=1`). This guarantees that deletions and merges propagate perfectly across your synced devices without resurrecting old data. Repeated syncs are now strictly idempotent—zero duplicate bleeding.

### 🧹 Bulk Action Multi-Select
You asked, we delivered. Long-press on the Dashboard to activate the new **Multi-Select Mode**. You can now mass-delete or export dozens of contacts to a VCF payload with a single tap.

### 🤝 Safe Merge Memory
Resolving duplicates is now permanent. The new **Ignore Duplicate** button in the Merge Preview UI saves your decision to the database, ensuring that dismissed pairs never clutter your command center again. Oh, and every merge still captures a pre-mutation snapshot to our global Undo Engine.

### 📱 One-Tap CRM Actions
The Contact Detail screen is no longer just a viewer—it's a launchpad. We've wired up native OS deep-links so you can instantly launch a WhatsApp thread, dial a number, or compose an email directly from the contact profile.

## 🛠️ Under the Hood (Performance Wins)
- **Eliminated N+1 Queries**: Re-engineered the list rendering pathways to fetch relationship and tag data cleanly without cascading DB roundtrips.
- **Virtualized List Optimization**: Stripped out hardcoded constraints and improved batch rendering, ensuring buttery-smooth scrolling on huge datasets.

## 📥 Getting Started
Download the latest signed APK from the assets below, or clone the repository to run it locally on Expo. No servers. No cloud. Just your data, moving at lightspeed.

---
**Architected with 🖤 by Shivansh Mishra**
*Building privacy-first mobile systems with modern local-first architecture.*
