/**
 * ContactForge — Contact Relationships Repository
 *
 * Database operations for contact_relationships table (Phase 8).
 */

import { getDatabase } from '..';
import type { ContactRelationship } from '../../types';

function rowToRelationship(row: Record<string, unknown>): ContactRelationship {
  return {
    id: row.id as number,
    contactIdFrom: row.contact_id_from as number,
    contactIdTo: row.contact_id_to as number,
    relationshipType: row.relationship_type as ContactRelationship['relationshipType'],
    direction: row.direction as ContactRelationship['direction'],
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function getRelationshipsByContactId(contactId: number): ContactRelationship[] {
  const db = getDatabase();
  const rows = db.getAllSync<Record<string, unknown>>(
    `SELECT * FROM contact_relationships 
     WHERE contact_id_from = ? OR contact_id_to = ?
     ORDER BY created_at DESC`,
    [contactId, contactId],
  );
  return rows.map(rowToRelationship);
}

export function getRelationshipsFrom(contactId: number): ContactRelationship[] {
  const db = getDatabase();
  const rows = db.getAllSync<Record<string, unknown>>(
    `SELECT * FROM contact_relationships WHERE contact_id_from = ? ORDER BY created_at DESC`,
    [contactId],
  );
  return rows.map(rowToRelationship);
}

export function getRelationshipsTo(contactId: number): ContactRelationship[] {
  const db = getDatabase();
  const rows = db.getAllSync<Record<string, unknown>>(
    `SELECT * FROM contact_relationships WHERE contact_id_to = ? ORDER BY created_at DESC`,
    [contactId],
  );
  return rows.map(rowToRelationship);
}

export function createRelationship(params: {
  contactIdFrom: number;
  contactIdTo: number;
  relationshipType: ContactRelationship['relationshipType'];
  direction: ContactRelationship['direction'];
  notes?: string | null;
}): ContactRelationship {
  const db = getDatabase();
  const timestamp = new Date().toISOString();

  db.runSync(
    `INSERT INTO contact_relationships (contact_id_from, contact_id_to, relationship_type, direction, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      params.contactIdFrom,
      params.contactIdTo,
      params.relationshipType,
      params.direction,
      params.notes ?? null,
      timestamp,
    ],
  );

  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM contact_relationships 
     WHERE contact_id_from = ? AND contact_id_to = ? AND created_at = ?
     ORDER BY id DESC LIMIT 1`,
    [params.contactIdFrom, params.contactIdTo, timestamp],
  );
  return row ? rowToRelationship(row) : null as any;
}

export function updateRelationship(
  relationshipId: number,
  params: Partial<Pick<ContactRelationship, 'relationshipType' | 'direction' | 'notes'>>,
): void {
  const db = getDatabase();
  const updates: string[] = [];
  const values: any[] = [];

  if (params.relationshipType !== undefined) {
    updates.push('relationship_type = ?');
    values.push(params.relationshipType);
  }
  if (params.direction !== undefined) {
    updates.push('direction = ?');
    values.push(params.direction);
  }
  if (params.notes !== undefined) {
    updates.push('notes = ?');
    values.push(params.notes);
  }

  if (updates.length === 0) return;

  values.push(relationshipId);
  db.runSync(`UPDATE contact_relationships SET ${updates.join(', ')} WHERE id = ?`, values);
}

export function deleteRelationship(relationshipId: number): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM contact_relationships WHERE id = ?`, [relationshipId]);
}

export function deleteRelationshipsByContactId(contactId: number): void {
  const db = getDatabase();
  db.runSync(
    `DELETE FROM contact_relationships WHERE contact_id_from = ? OR contact_id_to = ?`,
    [contactId, contactId],
  );
}

export function getRelationshipBetween(
  contactIdA: number,
  contactIdB: number,
): ContactRelationship | null {
  const db = getDatabase();
  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM contact_relationships 
     WHERE (contact_id_from = ? AND contact_id_to = ?) OR (contact_id_from = ? AND contact_id_to = ?)
     LIMIT 1`,
    [contactIdA, contactIdB, contactIdB, contactIdA],
  );
  return row ? rowToRelationship(row) : null;
}
