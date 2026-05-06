/**
 * Tests for normalization utilities.
 * These functions are pure and testable without any UI or DB dependency.
 */

import {
  toTitleCase,
  normalizeName,
  buildDisplayName,
  normalizePhone,
  stripPhone,
  normalizeEmail,
  collapseWhitespace,
  hasExcessWhitespace,
  needsTitleCase,
  editDistance,
  nameSimilarity,
  isGhostContact,
  appendCountryCode,
  formatPhoneUS,
} from '../utils/normalization';

describe('toTitleCase', () => {
  it('capitalizes each word', () => {
    expect(toTitleCase('john doe')).toBe('John Doe');
  });
  it('collapses extra spaces', () => {
    expect(toTitleCase('  john   doe  ')).toBe('John Doe');
  });
  it('handles single word', () => {
    expect(toTitleCase('alice')).toBe('Alice');
  });
  it('lowercases all-caps', () => {
    expect(toTitleCase('JOHN DOE')).toBe('John Doe');
  });
  it('handles empty string', () => {
    expect(toTitleCase('')).toBe('');
  });
});

describe('normalizeName', () => {
  it('lowercases and trims', () => {
    expect(normalizeName('  John Doe  ')).toBe('john doe');
  });
  it('returns empty string for null', () => {
    expect(normalizeName(null)).toBe('');
  });
  it('collapses whitespace', () => {
    expect(normalizeName('John  Doe')).toBe('john doe');
  });
});

describe('buildDisplayName', () => {
  it('combines first and last name', () => {
    expect(buildDisplayName('John', 'Doe', null, null)).toBe('John Doe');
  });
  it('falls back to company', () => {
    expect(buildDisplayName(null, null, 'Acme Corp', null)).toBe('Acme Corp');
  });
  it('falls back to phone', () => {
    expect(buildDisplayName(null, null, null, '+1234567890')).toBe('+1234567890');
  });
  it('returns (Unknown) when nothing available', () => {
    expect(buildDisplayName(null, null, null, null)).toBe('(Unknown)');
  });
  it('handles first name only', () => {
    expect(buildDisplayName('Alice', null, null, null)).toBe('Alice');
  });
});

describe('normalizePhone', () => {
  it('strips non-digits from 10-digit US number', () => {
    expect(normalizePhone('(555) 123-4567')).toBe('5551234567');
  });
  it('keeps last 10 digits for 11-digit number without +', () => {
    expect(normalizePhone('15551234567')).toBe('5551234567');
  });
  it('keeps full string for international numbers > 10 digits', () => {
    expect(normalizePhone('+441234567890')).toBe('441234567890');
  });
  it('returns empty string for null', () => {
    expect(normalizePhone(null)).toBe('');
  });
  it('handles empty string', () => {
    expect(normalizePhone('')).toBe('');
  });
});

describe('stripPhone', () => {
  it('removes all non-digit characters', () => {
    expect(stripPhone('+1 (555) 123-4567')).toBe('15551234567');
  });
});

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  JOHN@EXAMPLE.COM  ')).toBe('john@example.com');
  });
  it('returns empty string for null', () => {
    expect(normalizeEmail(null)).toBe('');
  });
});

describe('collapseWhitespace', () => {
  it('collapses multiple spaces', () => {
    expect(collapseWhitespace('hello  world')).toBe('hello world');
  });
  it('trims leading and trailing whitespace', () => {
    expect(collapseWhitespace('  hello  ')).toBe('hello');
  });
});

describe('hasExcessWhitespace', () => {
  it('detects leading whitespace', () => {
    expect(hasExcessWhitespace(' hello')).toBe(true);
  });
  it('detects trailing whitespace', () => {
    expect(hasExcessWhitespace('hello ')).toBe(true);
  });
  it('detects double spaces', () => {
    expect(hasExcessWhitespace('hello  world')).toBe(true);
  });
  it('returns false for clean string', () => {
    expect(hasExcessWhitespace('hello world')).toBe(false);
  });
});

describe('needsTitleCase', () => {
  it('detects lowercase name', () => {
    expect(needsTitleCase('john doe')).toBe(true);
  });
  it('returns false for correctly cased name', () => {
    expect(needsTitleCase('John Doe')).toBe(false);
  });
  it('detects all-caps name', () => {
    expect(needsTitleCase('JOHN DOE')).toBe(true);
  });
});

describe('editDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(editDistance('hello', 'hello')).toBe(0);
  });
  it('returns correct distance for substitution', () => {
    expect(editDistance('kitten', 'sitten')).toBe(1);
  });
  it('returns correct distance for insertion', () => {
    expect(editDistance('kitten', 'kittens')).toBe(1);
  });
  it('handles empty strings', () => {
    expect(editDistance('', 'hello')).toBe(5);
    expect(editDistance('hello', '')).toBe(5);
    expect(editDistance('', '')).toBe(0);
  });
});

describe('nameSimilarity', () => {
  it('returns 1 for identical names', () => {
    expect(nameSimilarity('John Doe', 'John Doe')).toBe(1);
  });
  it('returns high score for similar names', () => {
    const score = nameSimilarity('John Doe', 'Jon Doe');
    expect(score).toBeGreaterThan(0.8);
  });
  it('returns lower score for very different names', () => {
    const score = nameSimilarity('Alice Smith', 'Bob Jones');
    expect(score).toBeLessThan(0.4);
  });
  it('returns 0 for empty names', () => {
    expect(nameSimilarity('', 'John Doe')).toBe(0);
  });
});

describe('isGhostContact', () => {
  it('returns true when all fields are empty', () => {
    expect(isGhostContact({ displayName: '', phoneNumbers: [], emails: [], company: null })).toBe(true);
  });
  it('returns false when display name is set', () => {
    expect(isGhostContact({ displayName: 'John', phoneNumbers: [], emails: [], company: null })).toBe(false);
  });
  it('returns false when phone is set', () => {
    expect(isGhostContact({ displayName: '', phoneNumbers: ['+15551234567'], emails: [], company: null })).toBe(false);
  });
  it('returns false when company is set', () => {
    expect(isGhostContact({ displayName: '', phoneNumbers: [], emails: [], company: 'Acme' })).toBe(false);
  });
  it('treats (Unknown) display name as no name', () => {
    expect(isGhostContact({ displayName: '(Unknown)', phoneNumbers: [], emails: [], company: null })).toBe(true);
  });
});

describe('appendCountryCode', () => {
  it('appends + country code to 10-digit number', () => {
    expect(appendCountryCode('5551234567', '+1')).toBe('+15551234567');
  });
  it('does not modify number with more than 10 digits', () => {
    expect(appendCountryCode('15551234567', '+1')).toBe('15551234567');
  });
  it('adds + prefix to country code without it', () => {
    expect(appendCountryCode('5551234567', '1')).toBe('+15551234567');
  });
});

describe('formatPhoneUS', () => {
  it('formats 10-digit number', () => {
    expect(formatPhoneUS('5551234567')).toBe('(555) 123-4567');
  });
  it('formats 11-digit number starting with 1', () => {
    expect(formatPhoneUS('15551234567')).toBe('+1 (555) 123-4567');
  });
  it('returns original for unrecognized format', () => {
    expect(formatPhoneUS('123')).toBe('123');
  });
});
