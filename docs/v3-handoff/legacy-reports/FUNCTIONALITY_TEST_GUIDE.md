# ✅ ContactForge — Functionality & Performance Test Guide

**Created by:** T.G.S Mishra  
**Date:** May 10, 2026  
**Purpose:** Verify app is functional and fast  

---

## 🚀 QUICK START VERIFICATION (5 minutes)

### 1. **App Startup**
```bash
# Clear cache and start fresh
npm start

# Expected:
# ✅ Splash screen shows (3 seconds)
# ✅ "⭐ T.G.S Mishra" clearly visible
# ✅ Dashboard loads smoothly
# ✅ No frozen UI
# ✅ Total startup time < 5 seconds
```

### 2. **Dashboard Navigation**
- [ ] App shows dashboard immediately after splash
- [ ] Dashboard displays: total contacts, pending duplicates, cleanup issues
- [ ] "Sync Contacts" button works instantly
- [ ] Quick action buttons respond in <300ms

### 3. **Contact List**
- [ ] Contacts tab opens in <300ms
- [ ] List scrolls smoothly (60 FPS, no jank)
- [ ] Pagination loads next 20 contacts when scrolled to bottom
- [ ] Search responds in <300ms
- [ ] Filter chips switch instantly

### 4. **Create Contact**
- [ ] Tap "+" FAB opens contact form
- [ ] Form fills instantly
- [ ] Save contact in <1 second
- [ ] New contact appears in list immediately

---

## 📋 FULL FUNCTIONALITY TEST

### **PHASE 1: Startup & Navigation (Expected: All <500ms)**

#### Test 1.1: Cold Start
```
⏱️ Measure: App launch → Dashboard visible
✅ Expected: <3 seconds (including splash)
✅ Splash shows T.G.S Mishra branding clearly
✅ No freeze or ANR dialog
```

#### Test 1.2: Screen Transitions
```
Dashboard → Contacts:  <300ms ✅
Contacts → Duplicates: <300ms ✅
Duplicates → Settings: <300ms ✅
Settings → Dashboard:  <300ms ✅
Back navigation:       <200ms ✅
```

#### Test 1.3: Tab Switching
```
⏱️ Measure: Tap tab → Screen appears
✅ Dashboard:   <300ms
✅ Contacts:    <300ms
✅ Duplicates:  <300ms
✅ Cleanup:     <300ms
✅ Settings:    <500ms
```

---

### **PHASE 2: Contact Operations (Expected: All <2s)**

#### Test 2.1: Create Contact
```
Action:                 Create new contact
⏱️ Measure:             Tap "+" → Save → List updates
✅ Expected:            <1 second
✅ Verify:              New contact appears in list
✅ Verify:              Contact has correct details
✅ Verify:              Can immediately view detail
```

#### Test 2.2: View Contact Detail
```
Action:                 Open contact detail
⏱️ Measure:             Tap contact → Detail loads
✅ Expected:            <500ms
✅ Verify:              All fields display correctly
✅ Verify:              Health score visible
✅ Verify:              Notes section visible
✅ Verify:              Relationships section visible
```

#### Test 2.3: Edit Contact
```
Action:                 Edit contact field
⏱️ Measure:             Tap field → Edit → Save
✅ Expected:            <1 second
✅ Verify:              Changes saved immediately
✅ Verify:              List updates instantly
✅ Verify:              No duplicate created
```

#### Test 2.4: Delete Contact
```
Action:                 Delete contact
⏱️ Measure:             Tap delete → Confirm → Remove
✅ Expected:            <1 second
✅ Verify:              Undo option available
✅ Verify:              Contact gone from list
✅ Verify:              Tap undo restores contact
```

#### Test 2.5: Bulk Actions
```
Action:                 Select multiple contacts
⏱️ Measure:             Select 10 contacts → Bulk action
✅ Expected:            <2 seconds
✅ Verify:              Checkboxes appear
✅ Verify:              Selection count shows
✅ Verify:              Bulk delete works
```

---

### **PHASE 3: Search & Filtering (Expected: <300ms)**

#### Test 3.1: Search by Name
```
Action:                 Type name in search
⏱️ Measure:             Character input → Results filter
✅ Expected:            <300ms
✅ Verify:              Results update in real-time
✅ Verify:              Partial matches work
✅ Verify:              Case-insensitive search
```

#### Test 3.2: Search by Phone
```
Action:                 Type phone number
⏱️ Measure:             Input → Filter results
✅ Expected:            <300ms
✅ Verify:              Normalized phone match
✅ Verify:              Partial number match
```

#### Test 3.3: Search by Email
```
Action:                 Type email
⏱️ Measure:             Input → Filter results
✅ Expected:            <300ms
✅ Verify:              Exact match
✅ Verify:              Domain filter works
```

#### Test 3.4: Filter Chips
```
Action:                 Tap "All" / "Temporary" / "Ghost"
⏱️ Measure:             Tap → Filter applies
✅ Expected:            <100ms
✅ Verify:              List updates immediately
✅ Verify:              Chip highlights correctly
```

---

### **PHASE 4: Duplicates (Expected: <5s)**

#### Test 4.1: Duplicate Scan
```
Action:                 Scan for duplicates
⏱️ Measure:             Tap "Scan Duplicates" → Results
✅ Expected:            <2 seconds (100 contacts)
✅ Expected:            <5 seconds (1000 contacts)
✅ Verify:              Results appear in queue
✅ Verify:              Confidence scores visible
✅ Verify:              Reason given for each match
```

#### Test 4.2: View Duplicate Detail
```
Action:                 Tap duplicate pair
⏱️ Measure:             Tap → Merge preview loads
✅ Expected:            <500ms
✅ Verify:              Both contacts shown side-by-side
✅ Verify:              Conflicting fields highlighted
✅ Verify:              "Keep" buttons for each field
```

#### Test 4.3: Merge Contacts
```
Action:                 Select fields → Merge
⏱️ Measure:             Select → Tap merge → Complete
✅ Expected:            <2 seconds
✅ Verify:              Backup snapshot created
✅ Verify:              Contacts merged in database
✅ Verify:              List updated (1 contact removed)
✅ Verify:              Merge history recorded
```

#### Test 4.4: Merge Undo
```
Action:                 Tap "Undo Merge"
⏱️ Measure:             Tap undo → Contacts restored
✅ Expected:            <1 second
✅ Verify:              Both contacts re-appear
✅ Verify:              Original data intact
```

---

### **PHASE 5: Cleanup Center (Expected: <3s)**

#### Test 5.1: Scan for Cleanup Issues
```
Action:                 Open Cleanup tab → Scan
⏱️ Measure:             Tap "Scan Issues" → Results
✅ Expected:            <1 second
✅ Verify:              Issues categorized:
                        - Whitespace issues
                        - Casing problems
                        - Formatting issues
                        - Missing fields
                        - Ghost contacts
```

#### Test 5.2: Preview Cleanup
```
Action:                 View cleanup preview
⏱️ Measure:             Tap issue → Preview loads
✅ Expected:            <500ms
✅ Verify:              "Before" and "After" shown
✅ Verify:              User can select which to fix
```

#### Test 5.3: Apply Cleanup
```
Action:                 Apply selected cleanups
⏱️ Measure:             Tap "Apply Cleanup" → Complete
✅ Expected:            <1 second (50 items)
✅ Verify:              Issues fixed immediately
✅ Verify:              List refreshes
✅ Verify:              Undo available
```

---

### **PHASE 6: Notes & Relationships (Expected: <1s)**

#### Test 6.1: Create Contact Note
```
Action:                 Open contact → Add note
⏱️ Measure:             Tap "Add Note" → Create → Save
✅ Expected:            <1 second
✅ Verify:              Note categories appear
✅ Verify:              Modal opens smoothly
✅ Verify:              Note saved immediately
```

#### Test 6.2: Edit Memory Note
```
Action:                 Edit existing note
⏱️ Measure:             Tap note → Edit → Save
✅ Expected:            <500ms
✅ Verify:              Changes appear immediately
✅ Verify:              Category updated
```

#### Test 6.3: Create Relationship
```
Action:                 Link two contacts
⏱️ Measure:             Select contact → Select relation → Save
✅ Expected:            <1 second
✅ Verify:              Relationship types available (10+)
✅ Verify:              Bidirectional option works
✅ Verify:              Relationship appears in both contacts
```

#### Test 6.4: View Relationship Network
```
Action:                 View all relationships
⏱️ Measure:             Open relationships tab → Load
✅ Expected:            <1 second
✅ Verify:              Network displays clearly
✅ Verify:              All relationship types shown
```

---

### **PHASE 7: QR & Health Score (Expected: <500ms)**

#### Test 7.1: Generate QR Code
```
Action:                 Open Settings → Generate QR
⏱️ Measure:             Tap QR button → Code appears
✅ Expected:            <500ms
✅ Verify:              QR code displays
✅ Verify:              VCF data correct
✅ Verify:              No network call made
```

#### Test 7.2: Share QR via Native
```
Action:                 Tap "Share" on QR
⏱️ Measure:             Tap share → Native sheet
✅ Expected:            <1 second
✅ Verify:              Share dialog appears
✅ Verify:              Can share via SMS, Email, etc.
```

#### Test 7.3: View Health Score
```
Action:                 Open contact → View health
⏱️ Measure:             Load → Score displays
✅ Expected:            <200ms
✅ Verify:              Score is 0-100%
✅ Verify:              Letter grade shown (A-F)
✅ Verify:              Breakdown visible
```

#### Test 7.4: Health Score Explanation
```
Action:                 Tap health breakdown
⏱️ Measure:             Tap → Details show
✅ Expected:            <200ms
✅ Verify:              Component scores listed
✅ Verify:              Recommendations shown
```

---

### **PHASE 8: Export & Backup (Expected: <3s)**

#### Test 8.1: Export to CSV
```
Action:                 Settings → Export → CSV
⏱️ Measure:             Tap export → File ready
✅ Expected:            <3 seconds (1000 contacts)
✅ Verify:              File created
✅ Verify:              Can share file
✅ Verify:              CSV format correct
```

#### Test 8.2: Export to VCF
```
Action:                 Settings → Export → VCF
⏱️ Measure:             Tap export → File ready
✅ Expected:            <3 seconds (1000 contacts)
✅ Verify:              File created
✅ Verify:              VCF format valid
✅ Verify:              Can be imported elsewhere
```

#### Test 8.3: Backup Vault
```
Action:                 View Backup Vault
⏱️ Measure:             Open vault → List loads
✅ Expected:            <500ms
✅ Verify:              All backups listed
✅ Verify:              Timestamps correct
✅ Verify:              File sizes shown
```

#### Test 8.4: Restore from Backup
```
Action:                 Select backup → Restore
⏱️ Measure:             Tap restore → Complete
✅ Expected:            <2 seconds
✅ Verify:              Data restored
✅ Verify:              List refreshes
✅ Verify:              No data loss
```

---

### **PHASE 9: Settings & Configuration (Expected: <500ms)**

#### Test 9.1: Access Settings
```
Action:                 Tap Settings tab
⏱️ Measure:             Tab → Screen loads
✅ Expected:            <300ms
✅ Verify:              All settings visible
✅ Verify:              No lag or freeze
```

#### Test 9.2: Change Country Code
```
Action:                 Change default country code
⏱️ Measure:             Select new code → Save
✅ Expected:            <500ms
✅ Verify:              Setting saved
✅ Verify:              Takes effect immediately
```

#### Test 9.3: View Developer Portfolio
```
Action:                 Scroll to developer card
⏱️ Measure:             Load → Card appears
✅ Expected:            <200ms
✅ Verify:              T.G.S Mishra name visible
✅ Verify:              GitHub link active
✅ Verify:              Professional styling
```

#### Test 9.4: Open Developer Menu
```
Action:                 Tap version 5 times
⏱️ Measure:             Tap → Menu appears
✅ Expected:            <500ms
✅ Verify:              Menu shows options
✅ Verify:              Database stats visible
```

---

### **PHASE 10: Edge Cases & Performance (Expected: All passing)**

#### Test 10.1: Large Contact Library (5000+)
```
Action:                 List with 5000 contacts
⏱️ Measure:             Scroll → Performance
✅ Expected:            Smooth 60 FPS, no jank
✅ Verify:              Search still <300ms
✅ Verify:              Pagination works
```

#### Test 10.2: Complex Duplicate Detection
```
Action:                 Scan 5000 contacts for duplicates
⏱️ Measure:             Scan → Results
✅ Expected:            <10 seconds
✅ Verify:              Accurate results
✅ Verify:              UI not blocked
```

#### Test 10.3: Memory Stability
```
Action:                 Navigate around app for 5 minutes
⏱️ Measure:             Memory usage over time
✅ Expected:            No memory leaks
✅ Verify:              Memory stable
✅ Verify:              No crashes
```

#### Test 10.4: Network Offline
```
Action:                 Disable network → Use app
⏱️ Measure:             All operations work
✅ Expected:            100% functional offline
✅ Verify:              No errors
✅ Verify:              No network calls
```

---

## 📊 PERFORMANCE METRICS TO TRACK

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| App Startup | <3s | ___ | ⬜ |
| Screen Transition | <300ms | ___ | ⬜ |
| List Scroll (60 FPS) | 60 FPS | ___ | ⬜ |
| Search Response | <300ms | ___ | ⬜ |
| Duplicate Scan (100) | <2s | ___ | ⬜ |
| Contact Create | <1s | ___ | ⬜ |
| Contact Delete | <1s | ___ | ⬜ |
| Merge Operation | <2s | ___ | ⬜ |
| Cleanup Apply (50) | <1s | ___ | ⬜ |
| QR Generation | <500ms | ___ | ⬜ |
| Export (1000) | <3s | ___ | ⬜ |

---

## ✅ FINAL CHECKLIST

- [ ] App starts in <3 seconds
- [ ] All screen transitions <300ms
- [ ] List scrolls smoothly (60 FPS)
- [ ] Search responds instantly (<300ms)
- [ ] Create/Edit/Delete operations fast (<2s)
- [ ] Duplicate detection accurate
- [ ] Merge operations safe (snapshots work)
- [ ] Cleanup center functional
- [ ] Notes save properly
- [ ] Relationships link correctly
- [ ] QR generates offline
- [ ] Export works (CSV/VCF)
- [ ] Health scores calculate
- [ ] Settings apply immediately
- [ ] No memory leaks (5 min test)
- [ ] 100% offline operation
- [ ] No network calls detected
- [ ] T.G.S Mishra branding visible
- [ ] All permissions work
- [ ] Undo operations functional

---

## 🚀 DEPLOYMENT READINESS

If ALL tests pass ✅:
```
✅ App is PRODUCTION READY
✅ Ready for GitHub push
✅ Ready for APK build
✅ Ready for Play Store
```

---

**Created by:** T.G.S Mishra  
**Project:** ContactForge — My First Mobile App  
**Status:** Ready for Deployment
