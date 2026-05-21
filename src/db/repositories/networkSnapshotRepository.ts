/**
 * ContactForge — Network Snapshot Repository
 *
 * Local-only storage for historical network health snapshots.
 * Snapshots are taken max once per day to track trends in relationship maintenance.
 */

import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type { NetworkSnapshot } from '../../types';
import { getIntelligenceSummary } from '../../services/relationshipIntelligenceService';
import { countContacts } from './contactRepository';

function rowToSnapshot(row: Record<string, unknown>): NetworkSnapshot {
  return {
    id: row.id as number,
    totalContacts: row.total_contacts as number,
    importantContacts: row.important_contacts as number,
    staleContacts: row.stale_contacts as number,
    overdueFollowUps: row.overdue_follow_ups as number,
    activeRelationships: row.active_relationships as number,
    warmRelationships: row.warm_relationships as number,
    coldRelationships: row.cold_relationships as number,
    createdAt: row.created_at as string,
  };
}

export function getLatestSnapshot(): NetworkSnapshot | null {
  const db = getDatabase();
  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM network_snapshots ORDER BY created_at DESC LIMIT 1`,
    []
  );
  return row ? rowToSnapshot(row) : null;
}

export function getSnapshotFromDaysAgo(days: number): NetworkSnapshot | null {
  const db = getDatabase();
  const targetDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM network_snapshots 
     WHERE date(created_at) <= date(?)
     ORDER BY created_at DESC LIMIT 1`,
    [targetDateStr]
  );
  
  return row ? rowToSnapshot(row) : null;
}

export function createDailySnapshotIfNeeded(): NetworkSnapshot | null {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  // Check if we already have a snapshot for today
  const existing = db.getFirstSync<{id: number}>(
    `SELECT id FROM network_snapshots WHERE date(created_at) = date(?)`,
    [today]
  );
  
  if (existing) {
    return getLatestSnapshot(); // Already taken today
  }
  
  // Generate new snapshot
  const summary = getIntelligenceSummary();
  const total = countContacts();
  const timestamp = now();
  
  // Count relationship warmth brackets
  const contextRows = db.getAllSync<{warmth: number, relationship_strength: string}>(
    `SELECT warmth, relationship_strength FROM contact_context`
  );
  
  let warm = 0;
  let cold = 0;
  let active = 0;
  
  for (const row of contextRows) {
    if (row.warmth >= 70) warm++;
    if (row.warmth <= 30) cold++;
    if (row.relationship_strength === 'active' || row.relationship_strength === 'close') active++;
  }

  db.runSync(
    `INSERT INTO network_snapshots
       (total_contacts, important_contacts, stale_contacts, overdue_follow_ups, 
        active_relationships, warm_relationships, cold_relationships, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      total,
      summary.highValueInactive, // Using high value inactive + active as proxy for important, or just track highValueInactive
      summary.highValueInactive, 
      summary.dueFollowUps,
      active,
      warm,
      cold,
      timestamp,
    ]
  );
  
  // Clean up old snapshots (retain 90 days)
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  db.runSync(`DELETE FROM network_snapshots WHERE created_at < ?`, [cutoff]);

  return getLatestSnapshot();
}
