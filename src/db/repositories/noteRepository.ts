/**
 * ContactForge — Contact Notes Repository
 *
 * Database operations for contact_notes table (Phase 8).
 */

import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type { ContactNote } from '../../types';

function rowToNote(row: Record<string, unknown>): ContactNote {
  return {
    id: row.id as number,
    contactId: row.contact_id as number,
    category: row.category as ContactNote['category'],
    title: (row.title as string) ?? null,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getNotesByContactId(contactId: number): ContactNote[] {
  const db = getDatabase();
  const rows = db.getAllSync<Record<string, unknown>>(
    `SELECT * FROM contact_notes WHERE contact_id = ? ORDER BY created_at DESC`,
    [contactId],
  );
  return rows.map(rowToNote);
}

export function getNoteById(noteId: number): ContactNote | null {
  const db = getDatabase();
  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM contact_notes WHERE id = ?`,
    [noteId],
  );
  return row ? rowToNote(row) : null;
}

export function createNote(params: {
  contactId: number;
  category: ContactNote['category'];
  title: string | null;
  content: string;
}): ContactNote {
  const db = getDatabase();
  const timestamp = now();
  db.runSync(
    `INSERT INTO contact_notes (contact_id, category, title, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [params.contactId, params.category, params.title, params.content, timestamp, timestamp],
  );

  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM contact_notes WHERE contact_id = ? AND created_at = ? ORDER BY id DESC LIMIT 1`,
    [params.contactId, timestamp],
  );
  return row ? rowToNote(row) : null as any;
}

export function updateNote(noteId: number, params: Partial<Omit<ContactNote, 'id' | 'createdAt'>>): void {
  const db = getDatabase();
  const updates: string[] = [];
  const values: any[] = [];

  if (params.title !== undefined) {
    updates.push('title = ?');
    values.push(params.title);
  }
  if (params.content !== undefined) {
    updates.push('content = ?');
    values.push(params.content);
  }
  if (params.category !== undefined) {
    updates.push('category = ?');
    values.push(params.category);
  }

  if (updates.length === 0) return;

  updates.push('updated_at = ?');
  values.push(now());
  values.push(noteId);

  db.runSync(`UPDATE contact_notes SET ${updates.join(', ')} WHERE id = ?`, values);
}

export function deleteNote(noteId: number): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM contact_notes WHERE id = ?`, [noteId]);
}

export function deleteNotesByContactId(contactId: number): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM contact_notes WHERE contact_id = ?`, [contactId]);
}

export function reassignNotes(fromContactId: number, toContactId: number): number {
  const db = getDatabase();
  const result = db.runSync(
    `UPDATE contact_notes SET contact_id = ? WHERE contact_id = ?`,
    [toContactId, fromContactId],
  );
  return result.changes ?? 0;
}

export function searchNotes(searchTerm: string): ContactNote[] {
  const db = getDatabase();
  const searchPattern = `%${searchTerm}%`;
  const rows = db.getAllSync<Record<string, unknown>>(
    `SELECT * FROM contact_notes 
     WHERE title LIKE ? OR content LIKE ? 
     ORDER BY updated_at DESC`,
    [searchPattern, searchPattern],
  );
  return rows.map(rowToNote);
}
