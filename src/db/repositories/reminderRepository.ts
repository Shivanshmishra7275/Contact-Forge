/**
 * ContactForge — Contact Reminders Repository
 *
 * Local follow-up reminder storage. No cloud dependency.
 * Reminders are surfaced in the Follow-Up Inbox on the dashboard.
 */

import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type { ContactReminder, ReminderStatus, ReminderWithContact } from '../../types';

function rowToReminder(row: Record<string, unknown>): ContactReminder {
  return {
    id: row.id as number,
    contactId: row.contact_id as number,
    title: row.title as string,
    dueAt: row.due_at as string,
    intervalDays: (row.interval_days as number) ?? null,
    status: (row.status as ReminderStatus) ?? 'pending',
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getRemindersByContactId(contactId: number): ContactReminder[] {
  const db = getDatabase();
  const rows = db.getAllSync<Record<string, unknown>>(
    `SELECT * FROM contact_reminders WHERE contact_id = ? ORDER BY due_at ASC`,
    [contactId],
  );
  return rows.map(rowToReminder);
}

export function getPendingReminders(): ReminderWithContact[] {
  const db = getDatabase();
  const rows = db.getAllSync<Record<string, unknown>>(
    `SELECT r.*, c.display_name as contact_display_name
     FROM contact_reminders r
     JOIN contacts c ON c.id = r.contact_id
     WHERE r.status = 'pending'
     ORDER BY r.due_at ASC`,
    [],
  );
  return rows.map((row) => ({
    ...rowToReminder(row),
    contactDisplayName: row.contact_display_name as string,
  }));
}

export function getDueReminders(): ReminderWithContact[] {
  const db = getDatabase();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const rows = db.getAllSync<Record<string, unknown>>(
    `SELECT r.*, c.display_name as contact_display_name
     FROM contact_reminders r
     JOIN contacts c ON c.id = r.contact_id
     WHERE r.status = 'pending' AND r.due_at <= ?
     ORDER BY r.due_at ASC`,
    [todayEnd.toISOString()],
  );
  return rows.map((row) => ({
    ...rowToReminder(row),
    contactDisplayName: row.contact_display_name as string,
  }));
}

export function countDueReminders(): number {
  const db = getDatabase();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM contact_reminders
     WHERE status = 'pending' AND due_at <= ?`,
    [todayEnd.toISOString()],
  );
  return row?.count ?? 0;
}

export function createReminder(params: {
  contactId: number;
  title: string;
  dueAt: string;
  intervalDays?: number | null;
  notes?: string | null;
}): ContactReminder {
  const db = getDatabase();
  const timestamp = now();

  db.runSync(
    `INSERT INTO contact_reminders
       (contact_id, title, due_at, interval_days, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [
      params.contactId,
      params.title,
      params.dueAt,
      params.intervalDays ?? null,
      params.notes ?? null,
      timestamp,
      timestamp,
    ],
  );

  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM contact_reminders WHERE contact_id = ? AND created_at = ? ORDER BY id DESC LIMIT 1`,
    [params.contactId, timestamp],
  );
  return row ? rowToReminder(row) : null as any;
}

export function updateReminderStatus(reminderId: number, status: ReminderStatus): void {
  const db = getDatabase();
  const timestamp = now();

  // If marking done and it's a recurring reminder, schedule next occurrence
  if (status === 'done') {
    const existing = db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM contact_reminders WHERE id = ?`, [reminderId]
    );
    if (existing && existing.interval_days) {
      const nextDue = new Date(Date.now() + (existing.interval_days as number) * 24 * 60 * 60 * 1000).toISOString();
      db.runSync(
        `INSERT INTO contact_reminders
           (contact_id, title, due_at, interval_days, status, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [existing.contact_id, existing.title, nextDue, existing.interval_days, existing.notes ?? null, timestamp, timestamp] as any[],
      );
    }
  }

  db.runSync(
    `UPDATE contact_reminders SET status = ?, updated_at = ? WHERE id = ?`,
    [status, timestamp, reminderId],
  );
}

export function deleteReminder(reminderId: number): void {
  getDatabase().runSync(`DELETE FROM contact_reminders WHERE id = ?`, [reminderId]);
}

export function deleteRemindersByContactId(contactId: number): void {
  getDatabase().runSync(`DELETE FROM contact_reminders WHERE contact_id = ?`, [contactId]);
}
