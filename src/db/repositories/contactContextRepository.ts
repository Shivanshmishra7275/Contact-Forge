/**
 * ContactForge — Contact Context Repository
 *
 * Stores relationship context per contact: where met, warmth,
 * last interaction, next action. One row per contact.
 */

import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type { ContactContext, RelationshipStrength } from '../../types';

function rowToContext(row: Record<string, unknown>): ContactContext {
  return {
    id: row.id as number,
    contactId: row.contact_id as number,
    whereMet: (row.where_met as string) ?? null,
    relationshipStrength: (row.relationship_strength as RelationshipStrength) ?? 'neutral',
    warmth: (row.warmth as number) ?? 50,
    lastInteractionAt: (row.last_interaction_at as string) ?? null,
    nextAction: (row.next_action as string) ?? null,
    notesPlain: (row.notes_plain as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getContactContext(contactId: number): ContactContext | null {
  const db = getDatabase();
  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM contact_context WHERE contact_id = ?`,
    [contactId],
  );
  return row ? rowToContext(row) : null;
}

export function upsertContactContext(params: {
  contactId: number;
  whereMet?: string | null;
  relationshipStrength?: RelationshipStrength;
  warmth?: number;
  lastInteractionAt?: string | null;
  nextAction?: string | null;
  notesPlain?: string | null;
}): ContactContext {
  const db = getDatabase();
  const timestamp = now();
  const existing = getContactContext(params.contactId);

  if (existing) {
    const updates: string[] = [];
    const values: unknown[] = [];

    if ('whereMet' in params) { updates.push('where_met = ?'); values.push(params.whereMet ?? null); }
    if ('relationshipStrength' in params) { updates.push('relationship_strength = ?'); values.push(params.relationshipStrength); }
    if ('warmth' in params) { updates.push('warmth = ?'); values.push(params.warmth); }
    if ('lastInteractionAt' in params) { updates.push('last_interaction_at = ?'); values.push(params.lastInteractionAt ?? null); }
    if ('nextAction' in params) { updates.push('next_action = ?'); values.push(params.nextAction ?? null); }
    if ('notesPlain' in params) { updates.push('notes_plain = ?'); values.push(params.notesPlain ?? null); }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(timestamp, existing.id);
      db.runSync(`UPDATE contact_context SET ${updates.join(', ')} WHERE id = ?`, values as any[]);
    }

    return getContactContext(params.contactId) ?? existing;
  }

  db.runSync(
    `INSERT INTO contact_context
       (contact_id, where_met, relationship_strength, warmth,
        last_interaction_at, next_action, notes_plain, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.contactId,
      params.whereMet ?? null,
      params.relationshipStrength ?? 'neutral',
      params.warmth ?? 50,
      params.lastInteractionAt ?? null,
      params.nextAction ?? null,
      params.notesPlain ?? null,
      timestamp,
      timestamp,
    ],
  );

  return getContactContext(params.contactId)!;
}

export function deleteContactContext(contactId: number): void {
  getDatabase().runSync(`DELETE FROM contact_context WHERE contact_id = ?`, [contactId]);
}

export function getStaleContacts(daysThreshold = 90): Array<{ contactId: number; daysSince: number }> {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString();
  const rows = db.getAllSync<{ contact_id: number; last_interaction_at: string }>(
    `SELECT contact_id, last_interaction_at FROM contact_context
     WHERE last_interaction_at IS NOT NULL AND last_interaction_at < ?
     ORDER BY last_interaction_at ASC`,
    [cutoff],
  );
  const now_ms = Date.now();
  return rows.map((r) => ({
    contactId: r.contact_id,
    daysSince: Math.floor((now_ms - new Date(r.last_interaction_at).getTime()) / (24 * 60 * 60 * 1000)),
  }));
}

export function getHighWarmthContacts(minWarmth = 70): number[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ contact_id: number }>(
    `SELECT contact_id FROM contact_context WHERE warmth >= ? ORDER BY warmth DESC`,
    [minWarmth],
  );
  return rows.map((r) => r.contact_id);
}
