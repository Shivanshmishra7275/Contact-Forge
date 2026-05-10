/**
 * Tests for the cleanup service.
 *
 * scanContactForIssues is a pure function (given a contact object and phones array),
 * so it can be tested without any DB or UI mocks.
 */

import {
  buildStandardizedPhoneEntries,
  scanContactForIssues,
} from '../services/cleanupService';
import type { LocalContact } from '../types';

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

function makeContact(overrides: Partial<LocalContact> = {}): LocalContact {
  return {
    id: 1,
    nativeId: null,
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    normalizedName: 'john doe',
    company: null,
    jobTitle: null,
    notes: null,
    birthday: null,
    imageUri: null,
    hasThumbnail: false,
    isTemporary: false,
    isGhost: false,
    tags: '[]',
    syncedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// missing_name
// ---------------------------------------------------------------------------

describe('scanContactForIssues — missing_name', () => {
  it('detects missing name when no first, last, or company', () => {
    const contact = makeContact({
      firstName: null,
      lastName: null,
      displayName: '(Unknown)',
      normalizedName: '(unknown)',
      company: null,
    });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain('missing_name');
  });

  it('does not flag missing_name when company is set', () => {
    const contact = makeContact({
      firstName: null,
      lastName: null,
      displayName: 'Acme Corp',
      normalizedName: 'acme corp',
      company: 'Acme Corp',
    });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).not.toContain('missing_name');
  });
});

// ---------------------------------------------------------------------------
// uncapitalized_name
// ---------------------------------------------------------------------------

describe('scanContactForIssues — uncapitalized_name', () => {
  it('detects all-lowercase name', () => {
    const contact = makeContact({ displayName: 'john doe', normalizedName: 'john doe' });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const issue = issues.find((i) => i.kind === 'uncapitalized_name');
    expect(issue).toBeDefined();
    expect(issue?.suggestedValue).toBe('John Doe');
  });

  it('detects ALL CAPS name', () => {
    const contact = makeContact({ displayName: 'JOHN DOE', normalizedName: 'john doe' });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain('uncapitalized_name');
  });

  it('does not flag correctly-cased name', () => {
    const contact = makeContact({ displayName: 'John Doe', normalizedName: 'john doe' });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).not.toContain('uncapitalized_name');
  });

  it('does not flag (Unknown) placeholder', () => {
    const contact = makeContact({
      firstName: null,
      lastName: null,
      displayName: '(Unknown)',
      normalizedName: '(unknown)',
      company: null,
    });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).not.toContain('uncapitalized_name');
  });
});

// ---------------------------------------------------------------------------
// extra_whitespace
// ---------------------------------------------------------------------------

describe('scanContactForIssues — extra_whitespace', () => {
  it('detects leading whitespace', () => {
    const contact = makeContact({ displayName: ' John Doe', normalizedName: 'john doe' });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain('extra_whitespace');
  });

  it('detects repeated internal spaces', () => {
    const contact = makeContact({ displayName: 'John  Doe', normalizedName: 'john doe' });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain('extra_whitespace');
  });

  it('provides correct suggested value', () => {
    const contact = makeContact({ displayName: '  John  Doe  ', normalizedName: 'john doe' });
    const issues = scanContactForIssues(contact, ['5551234567']);
    const issue = issues.find((i) => i.kind === 'extra_whitespace');
    expect(issue?.suggestedValue).toBe('John Doe');
  });
});

// ---------------------------------------------------------------------------
// missing_phone
// ---------------------------------------------------------------------------

describe('scanContactForIssues — missing_phone', () => {
  it('flags contact with no phones', () => {
    const contact = makeContact();
    const issues = scanContactForIssues(contact, []);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain('missing_phone');
  });

  it('does not flag contact with a phone', () => {
    const contact = makeContact();
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).not.toContain('missing_phone');
  });
});

// ---------------------------------------------------------------------------
// phone standardization
// ---------------------------------------------------------------------------

describe('scanContactForIssues — phone standardization', () => {
  it('flags a 10-digit number as missing country code', () => {
    const contact = makeContact();
    const issues = scanContactForIssues(contact, ['(555) 123-4567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain('no_country_code');
  });

  it('flags malformed phone formatting when the number needs standardization', () => {
    const contact = makeContact();
    const issues = scanContactForIssues(contact, ['(555) 123-4567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain('malformed_phone');
  });

  it('flags duplicate phone numbers after normalization', () => {
    const contact = makeContact();
    const issues = scanContactForIssues(contact, ['5551234567', '(555) 123-4567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toContain('duplicate_numbers');
  });
});

describe('buildStandardizedPhoneEntries', () => {
  it('adds a country code and removes duplicates in a stable order', () => {
    const result = buildStandardizedPhoneEntries([
      { label: 'mobile', number: '(555) 123-4567' },
      { label: 'other', number: '15551234567' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      label: 'mobile',
      number: '+15551234567',
    });
  });
});

// ---------------------------------------------------------------------------
// ghost_contact
// ---------------------------------------------------------------------------

describe('scanContactForIssues — ghost_contact', () => {
  it('flags a ghost contact and returns only that issue', () => {
    const contact = makeContact({
      isGhost: true,
      displayName: '',
      normalizedName: '',
      firstName: null,
      lastName: null,
      company: null,
    });
    const issues = scanContactForIssues(contact, []);
    expect(issues.length).toBe(1);
    expect(issues[0].kind).toBe('ghost_contact');
  });

  it('does not flag non-ghost contacts as ghost', () => {
    const contact = makeContact();
    const issues = scanContactForIssues(contact, ['5551234567']);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).not.toContain('ghost_contact');
  });
});

// ---------------------------------------------------------------------------
// Clean contact
// ---------------------------------------------------------------------------

describe('scanContactForIssues — clean contact', () => {
  it('returns no issues for a well-formed contact', () => {
    const contact = makeContact({
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      normalizedName: 'john doe',
      isGhost: false,
    });
    const issues = scanContactForIssues(contact, ['+1 (555) 123-4567']);
    expect(issues).toHaveLength(0);
  });
});
