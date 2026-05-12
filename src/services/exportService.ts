/**
 * ContactForge — Export Service
 *
 * Generates CSV and VCF exports of contact data.
 * All processing is local. No data leaves the device.
 *
 * Uses expo-file-system for writing and expo-sharing for sharing.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  getContactWithDetails,
  getAllContactIds,
} from '../db/repositories/contactRepository';
import { getNotesByContactId } from '../db/repositories/noteRepository';
import { logAction } from '../db/repositories/auditRepository';
import { isoToDisplay } from '../utils/normalization';
import type { ExportJob } from '../types';

function formatNoteCategory(category: string): string {
  return category.replace(/_/g, ' ');
}

function formatNotesForExport(
  legacyNotes: string | null,
  notes: Array<{ category: string; title: string | null; content: string }>,
): string {
  const chunks: string[] = [];
  if (legacyNotes?.trim()) {
    chunks.push(legacyNotes.trim());
  }

  if (notes.length > 0) {
    const memory = notes.map((note) => {
      const title = note.title ? `${note.title}: ` : '';
      return `[${formatNoteCategory(note.category)}] ${title}${note.content}`.trim();
    });
    chunks.push(memory.join(' | '));
  }

  return chunks.join('\n');
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function escapeCSVField(value: string | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportToCSV(
  job: ExportJob,
): Promise<{ filePath: string; rowCount: number }> {
  const ids =
    job.contactIds === 'all'
      ? getAllContactIds()
      : job.contactIds;

  const headers = [
    'First Name',
    'Last Name',
    'Display Name',
    'Company',
    'Job Title',
    'Phone Numbers',
    'Emails',
    ...(job.includeNotes ? ['Notes'] : []),
    'Birthday',
    'Tags',
  ];

  const rows: string[] = [headers.map(escapeCSVField).join(',')];

  for (const id of ids) {
    const c = getContactWithDetails(id);
    if (!c) continue;

    const memoryNotes = job.includeNotes ? getNotesByContactId(id) : [];
    const notesForExport = job.includeNotes
      ? formatNotesForExport(c.notes, memoryNotes)
      : '';

    const phones = c.phoneNumbers.map((p) => p.number).join(' | ');
    const emails = c.emails.map((e) => e.email).join(' | ');
    const tags = (() => {
      try { return JSON.parse(c.tags).join(', '); } catch { return ''; }
    })();

    const row = [
      c.firstName ?? '',
      c.lastName ?? '',
      c.displayName,
      c.company ?? '',
      c.jobTitle ?? '',
      phones,
      emails,
      ...(job.includeNotes ? [notesForExport] : []),
      c.birthday ? isoToDisplay(c.birthday) : '',
      tags,
    ];

    rows.push(row.map(escapeCSVField).join(','));
  }

  const csvContent = rows.join('\n');
  const filePath = `${FileSystem.documentDirectory}${job.filename}`;
  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  logAction('export_created', null, { format: 'csv', count: ids.length });

  return { filePath, rowCount: ids.length };
}

// ---------------------------------------------------------------------------
// VCF (vCard) export
// ---------------------------------------------------------------------------

function formatVCard(
  firstName: string | null,
  lastName: string | null,
  company: string | null,
  phones: string[],
  emails: string[],
  notes: string | null,
  includeNotes: boolean,
): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

  const fn = [firstName, lastName].filter(Boolean).join(' ').trim();
  lines.push(`FN:${fn || company || 'Unknown'}`);
  lines.push(`N:${lastName ?? ''};${firstName ?? ''};;;`);

  if (company) lines.push(`ORG:${company}`);
  for (const p of phones) lines.push(`TEL;TYPE=CELL:${p}`);
  for (const e of emails) lines.push(`EMAIL;TYPE=INTERNET:${e}`);
  if (includeNotes && notes) lines.push(`NOTE:${notes.replace(/\n/g, '\\n')}`);

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export async function exportToVCF(
  job: ExportJob,
): Promise<{ filePath: string; rowCount: number }> {
  const ids =
    job.contactIds === 'all'
      ? getAllContactIds()
      : job.contactIds;

  const cards: string[] = [];

  for (const id of ids) {
    const c = getContactWithDetails(id);
    if (!c) continue;
    const memoryNotes = job.includeNotes ? getNotesByContactId(id) : [];
    const notesForExport = job.includeNotes
      ? formatNotesForExport(c.notes, memoryNotes)
      : null;
    cards.push(
      formatVCard(
        c.firstName,
        c.lastName,
        c.company,
        c.phoneNumbers.map((p) => p.number),
        c.emails.map((e) => e.email),
        notesForExport,
        job.includeNotes,
      ),
    );
  }

  const vcfContent = cards.join('\r\n');
  const filePath = `${FileSystem.documentDirectory}${job.filename}`;
  await FileSystem.writeAsStringAsync(filePath, vcfContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  logAction('export_created', null, { format: 'vcf', count: ids.length });

  return { filePath, rowCount: ids.length };
}

// ---------------------------------------------------------------------------
// Sharing helper
// ---------------------------------------------------------------------------

export async function shareFile(filePath: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(filePath, { dialogTitle: 'Share ContactForge Export' });
}

// ---------------------------------------------------------------------------
// Backup helpers
// ---------------------------------------------------------------------------

export function generateBackupFilename(format: 'csv' | 'vcf'): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `contactforge-backup-${ts}.${format}`;
}

export async function createFullBackup(
  format: 'csv' | 'vcf' = 'csv',
  includeNotes = true,
): Promise<{ filePath: string; rowCount: number }> {
  const filename = generateBackupFilename(format);
  const job: ExportJob = {
    format,
    contactIds: 'all',
    includeNotes,
    filename,
  };

  const result =
    format === 'csv' ? await exportToCSV(job) : await exportToVCF(job);

  logAction('backup_created', null, { format, count: result.rowCount });
  return result;
}
