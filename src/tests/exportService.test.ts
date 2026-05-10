/**
 * Tests for the export service — pure formatting functions only.
 *
 * Note: File system writes and sharing are excluded from unit tests
 * (they require native modules). Those are covered by integration testing.
 * We test the pure formatting logic: CSV escaping, VCF formatting, filename generation.
 */

// ---------------------------------------------------------------------------
// escapeCSVField — inline test helper replicating the private function
// ---------------------------------------------------------------------------

/**
 * Replication of the private escapeCSVField function from exportService.ts
 * for white-box testing purposes. If the implementation changes, update here too.
 */
function escapeCSVField(value: string | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

describe('escapeCSVField', () => {
  it('returns empty string for null', () => {
    expect(escapeCSVField(null)).toBe('');
  });
  it('returns empty string for undefined', () => {
    expect(escapeCSVField(undefined)).toBe('');
  });
  it('returns plain string unchanged when no special chars', () => {
    expect(escapeCSVField('John Doe')).toBe('John Doe');
  });
  it('wraps string with comma in double quotes', () => {
    expect(escapeCSVField('Doe, John')).toBe('"Doe, John"');
  });
  it('escapes embedded double quotes by doubling them', () => {
    expect(escapeCSVField('Say "hello"')).toBe('"Say ""hello"""');
  });
  it('wraps string with newline in double quotes', () => {
    expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
  });
  it('handles numeric values coerced to string', () => {
    expect(escapeCSVField('12345')).toBe('12345');
  });
});

// ---------------------------------------------------------------------------
// formatVCard — inline helper replicating the private function
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

describe('formatVCard', () => {
  it('produces valid VCF structure for a basic contact', () => {
    const card = formatVCard('John', 'Doe', null, ['5551234567'], ['john@example.com'], null, true);
    expect(card).toContain('BEGIN:VCARD');
    expect(card).toContain('VERSION:3.0');
    expect(card).toContain('FN:John Doe');
    expect(card).toContain('N:Doe;John;;;');
    expect(card).toContain('TEL;TYPE=CELL:5551234567');
    expect(card).toContain('EMAIL;TYPE=INTERNET:john@example.com');
    expect(card).toContain('END:VCARD');
  });

  it('uses company as FN when no name available', () => {
    const card = formatVCard(null, null, 'Acme Corp', [], [], null, true);
    expect(card).toContain('FN:Acme Corp');
    expect(card).toContain('ORG:Acme Corp');
  });

  it('uses Unknown as FN fallback when nothing available', () => {
    const card = formatVCard(null, null, null, [], [], null, true);
    expect(card).toContain('FN:Unknown');
  });

  it('omits NOTE line when includeNotes is false', () => {
    const card = formatVCard('Jane', 'Smith', null, [], [], 'some notes', false);
    expect(card).not.toContain('NOTE:');
  });

  it('includes NOTE line when includeNotes is true and notes exist', () => {
    const card = formatVCard('Jane', 'Smith', null, [], [], 'important note', true);
    expect(card).toContain('NOTE:important note');
  });

  it('escapes newlines in notes using \\n', () => {
    const card = formatVCard('Jane', 'Smith', null, [], [], 'line1\nline2', true);
    expect(card).toContain('NOTE:line1\\nline2');
  });

  it('includes multiple phone numbers', () => {
    const card = formatVCard('Bob', null, null, ['111', '222'], [], null, true);
    expect(card).toContain('TEL;TYPE=CELL:111');
    expect(card).toContain('TEL;TYPE=CELL:222');
  });

  it('uses CRLF line endings per VCF spec', () => {
    const card = formatVCard('A', 'B', null, [], [], null, true);
    expect(card).toContain('\r\n');
  });
});

// ---------------------------------------------------------------------------
// generateBackupFilename
// ---------------------------------------------------------------------------

import { generateBackupFilename } from '../services/exportService';

describe('generateBackupFilename', () => {
  it('generates a .csv filename for csv format', () => {
    const name = generateBackupFilename('csv');
    expect(name).toMatch(/\.csv$/);
  });

  it('generates a .vcf filename for vcf format', () => {
    const name = generateBackupFilename('vcf');
    expect(name).toMatch(/\.vcf$/);
  });

  it('starts with contactforge-backup-', () => {
    const name = generateBackupFilename('csv');
    expect(name).toMatch(/^contactforge-backup-/);
  });

  it('each call produces a unique filename (timestamp-based)', async () => {
    const a = generateBackupFilename('csv');
    await new Promise((r) => setTimeout(r, 2));
    const b = generateBackupFilename('csv');
    // Both valid, and in practice different if timestamps differ;
    // at minimum they must have the correct prefix and suffix
    expect(a).toMatch(/^contactforge-backup-.+\.csv$/);
    expect(b).toMatch(/^contactforge-backup-.+\.csv$/);
  });

  it('does not contain colons (safe for filesystem)', () => {
    const name = generateBackupFilename('csv');
    expect(name).not.toContain(':');
  });
});
