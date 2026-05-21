/**
 * ContactForge — Backup Service
 *
 * Provides deterministic, offline-first encrypted export/restore logic.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../db';
import { encryptPayload, decryptPayload } from './encryptionService';
import type { ContactForgeBackup } from '../types';

export async function generateBackupBundle(): Promise<ContactForgeBackup> {
  const db = getDatabase();
  
  const contacts = db.getAllSync('SELECT * FROM contacts');
  const notes = db.getAllSync('SELECT * FROM contact_notes');
  const relationships = db.getAllSync('SELECT * FROM contact_relationships');
  const emails = db.getAllSync('SELECT * FROM emails');
  const phoneNumbers = db.getAllSync('SELECT * FROM phone_numbers');
  const contexts = db.getAllSync('SELECT * FROM contact_context');
  const reminders = db.getAllSync('SELECT * FROM contact_reminders');
  const snapshots = db.getAllSync('SELECT * FROM network_snapshots');

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    contacts,
    notes,
    relationships,
    emails,
    phoneNumbers,
    contexts,
    reminders,
    snapshots
  };
}

export async function exportEncryptedBackup(passphrase: string): Promise<boolean> {
  try {
    const bundle = await generateBackupBundle();
    const jsonStr = JSON.stringify(bundle);
    const encrypted = encryptPayload(jsonStr, passphrase);
    
    const uri = FileSystem.documentDirectory + 'contactforge-backup.cfbak';
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(encrypted, null, 2));
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { 
        mimeType: 'application/json', 
        dialogTitle: 'Save Encrypted Backup' 
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Export failed:', err);
    return false;
  }
}

export async function restoreEncryptedBackup(passphrase: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await DocumentPicker.getDocumentAsync({ 
      type: '*/*', 
      copyToCacheDirectory: true 
    });
    
    if (res.canceled || !res.assets || res.assets.length === 0) {
      return { success: false, message: 'Restore cancelled.' };
    }
    
    const fileUri = res.assets[0].uri;
    const contents = await FileSystem.readAsStringAsync(fileUri);
    
    let encrypted;
    try {
      encrypted = JSON.parse(contents);
    } catch {
      return { success: false, message: 'Invalid file format.' };
    }
    
    const decryptedStr = decryptPayload(encrypted, passphrase);
    if (!decryptedStr) {
      return { success: false, message: 'Invalid passphrase or corrupted backup file.' };
    }
    
    const bundle: ContactForgeBackup = JSON.parse(decryptedStr);
    if (bundle.version !== 1) {
      return { success: false, message: 'Unsupported backup version.' };
    }
    
    importBackupBundle(bundle);
    
    return { success: true, message: 'Database restored successfully.' };
  } catch (err) {
    console.error('Restore failed:', err);
    return { success: false, message: 'An error occurred during restore.' };
  }
}

export function importBackupBundle(bundle: ContactForgeBackup): void {
  const db = getDatabase();
  
  // Safely insert data using INSERT OR IGNORE
  db.withTransactionSync(() => {
    for (const c of bundle.contacts) {
      db.runSync(`INSERT OR IGNORE INTO contacts (id, native_id, first_name, last_name, display_name, normalized_name, company, job_title, notes, birthday, image_uri, has_thumbnail, is_temporary, is_ghost, tags, synced_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
        [c.id, c.native_id, c.first_name, c.last_name, c.display_name, c.normalized_name, c.company, c.job_title, c.notes, c.birthday, c.image_uri, c.has_thumbnail, c.is_temporary, c.is_ghost, c.tags, c.synced_at, c.created_at, c.updated_at]);
    }
    for (const e of bundle.emails) {
      db.runSync(`INSERT OR IGNORE INTO emails (id, contact_id, label, email, normalized_email) VALUES (?,?,?,?,?)`, [e.id, e.contact_id, e.label, e.email, e.normalized_email]);
    }
    for (const p of bundle.phoneNumbers) {
      db.runSync(`INSERT OR IGNORE INTO phone_numbers (id, contact_id, label, number, normalized_number) VALUES (?,?,?,?,?)`, [p.id, p.contact_id, p.label, p.number, p.normalized_number]);
    }
    for (const n of bundle.notes) {
      db.runSync(`INSERT OR IGNORE INTO contact_notes (id, contact_id, content, category, created_at, updated_at) VALUES (?,?,?,?,?,?)`, [n.id, n.contact_id, n.content, n.category, n.created_at, n.updated_at]);
    }
    for (const r of bundle.relationships) {
      db.runSync(`INSERT OR IGNORE INTO contact_relationships (id, contact_id_from, contact_id_to, relationship_type, direction, created_at) VALUES (?,?,?,?,?,?)`, [r.id, r.contact_id_from, r.contact_id_to, r.relationship_type, r.direction, r.created_at]);
    }
    for (const c of bundle.contexts) {
      db.runSync(`INSERT OR IGNORE INTO contact_context (id, contact_id, where_met, relationship_strength, warmth, last_interaction_at, next_action, notes_plain, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, [c.id, c.contact_id, c.where_met, c.relationship_strength, c.warmth, c.last_interaction_at, c.next_action, c.notes_plain, c.created_at, c.updated_at]);
    }
    for (const r of bundle.reminders) {
      db.runSync(`INSERT OR IGNORE INTO contact_reminders (id, contact_id, title, due_at, interval_days, status, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, [r.id, r.contact_id, r.title, r.due_at, r.interval_days, r.status, r.notes, r.created_at, r.updated_at]);
    }
    for (const s of bundle.snapshots) {
      db.runSync(`INSERT OR IGNORE INTO network_snapshots (id, total_contacts, important_contacts, stale_contacts, overdue_follow_ups, active_relationships, warm_relationships, cold_relationships, created_at) VALUES (?,?,?,?,?,?,?,?,?)`, [s.id, s.total_contacts, s.important_contacts, s.stale_contacts, s.overdue_follow_ups, s.active_relationships, s.warm_relationships, s.cold_relationships, s.created_at]);
    }
  });
}
