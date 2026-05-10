/**
 * ContactForge — Cleanup Service
 *
 * Business logic for detecting and fixing contact data quality issues.
 * All functions are pure (apart from DB reads) and have no UI dependencies.
 * The scan functions are unit-testable by supplying mock contact data.
 *
 * Issue kinds detected:
 * - missing_name        → contact has no first/last name and no company
 * - uncapitalized_name  → display name doesn't match title case
 * - extra_whitespace    → leading/trailing/repeated whitespace in name
 * - missing_phone       → contact has no phone numbers
 * - ghost_contact       → no name, phone, email, or company
 */

import {
  listContacts,
  getContactById,
  getPhonesByContactId,
  replacePhonesByContactId,
  replacePhonesByContactIdSync,
  updateContact,
  deleteContact,
} from '../db/repositories/contactRepository';
import { logAction } from '../db/repositories/auditRepository';
import { getDatabase } from '../db';
import { DEFAULT_COUNTRY_CODE } from '../constants';
import {
  appendCountryCode,
  toTitleCase,
  hasExcessWhitespace,
  collapseWhitespace,
  formatPhoneUS,
  normalizePhone,
  stripPhone,
} from '../utils/normalization';
import type { CleanupIssue, LocalContact } from '../types';

export interface ContactIssues {
  contact: LocalContact;
  issues: CleanupIssue[];
}

interface PhoneEntry {
  label: string | null;
  number: string;
}

export function buildStandardizedPhoneEntries(
  phoneEntries: PhoneEntry[],
  countryCode = DEFAULT_COUNTRY_CODE,
): PhoneEntry[] {
  const seen = new Set<string>();
  const cleaned: PhoneEntry[] = [];

  for (const entry of phoneEntries) {
    const rawNumber = entry.number.trim();
    const digits = stripPhone(rawNumber);
    if (!digits) continue;

    let standardized = rawNumber;
    if (digits.length === 10) {
      standardized = appendCountryCode(rawNumber, countryCode);
    } else if (digits.length === 11 && digits.startsWith('1')) {
      standardized = formatPhoneUS(rawNumber);
    }

    const normalized = normalizePhone(standardized);
    if (!normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    cleaned.push({
      label: entry.label ?? null,
      number: standardized,
    });
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// Issue scanner — pure, testable
// ---------------------------------------------------------------------------

/**
 * Scans a single contact and returns any detected issues.
 * Pure function: no side effects, fully testable without mocks.
 */
export function scanContactForIssues(
  contact: LocalContact,
  phoneNumbers: string[],
): CleanupIssue[] {
  const issues: CleanupIssue[] = [];

  // Ghost contact — catches everything at once
  if (contact.isGhost) {
    issues.push({
      contactId: contact.id,
      kind: 'ghost_contact',
      field: 'all',
      currentValue: null,
      suggestedValue: null,
    });
    // Ghost contacts are reported only with this one issue to avoid noise
    return issues;
  }

  // Missing name
  if (
    !contact.firstName?.trim() &&
    !contact.lastName?.trim() &&
    !contact.company?.trim()
  ) {
    issues.push({
      contactId: contact.id,
      kind: 'missing_name',
      field: 'displayName',
      currentValue: contact.displayName,
      suggestedValue: null,
    });
  }

  // Uncapitalized name
  if (contact.displayName && contact.displayName !== '(Unknown)') {
    const titled = toTitleCase(contact.displayName);
    if (titled !== contact.displayName) {
      issues.push({
        contactId: contact.id,
        kind: 'uncapitalized_name',
        field: 'displayName',
        currentValue: contact.displayName,
        suggestedValue: titled,
      });
    }
  }

  // Extra whitespace in name
  if (contact.displayName && hasExcessWhitespace(contact.displayName)) {
    issues.push({
      contactId: contact.id,
      kind: 'extra_whitespace',
      field: 'displayName',
      currentValue: contact.displayName,
      suggestedValue: collapseWhitespace(contact.displayName),
    });
  }

  // Missing phone
  if (phoneNumbers.length === 0) {
    issues.push({
      contactId: contact.id,
      kind: 'missing_phone',
      field: 'phoneNumbers',
      currentValue: null,
      suggestedValue: null,
    });
  } else {
    const normalizedPhones = phoneNumbers
      .map((phone) => normalizePhone(phone))
      .filter(Boolean);

    if (normalizedPhones.length > 0 && new Set(normalizedPhones).size < normalizedPhones.length) {
      issues.push({
        contactId: contact.id,
        kind: 'duplicate_numbers',
        field: 'phoneNumbers',
        currentValue: phoneNumbers.join(' | '),
        suggestedValue: 'Remove duplicate phone numbers',
      });
    }

    const hasNoCountryCode = phoneNumbers.some((phone) => stripPhone(phone).length === 10);
    if (hasNoCountryCode) {
      issues.push({
        contactId: contact.id,
        kind: 'no_country_code',
        field: 'phoneNumbers',
        currentValue: phoneNumbers.join(' | '),
        suggestedValue: `Add ${DEFAULT_COUNTRY_CODE} to 10-digit numbers`,
      });
    }

    const hasMalformedPhone = phoneNumbers.some((phone) => {
      const digits = stripPhone(phone);
      return (
        (digits.length === 10 && phone !== appendCountryCode(phone, DEFAULT_COUNTRY_CODE)) ||
        (digits.length === 11 && digits.startsWith('1') && phone !== formatPhoneUS(phone))
      );
    });

    if (hasMalformedPhone) {
      issues.push({
        contactId: contact.id,
        kind: 'malformed_phone',
        field: 'phoneNumbers',
        currentValue: phoneNumbers.join(' | '),
        suggestedValue: 'Standardize phone formatting',
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Full scan — paginated DB scan
// ---------------------------------------------------------------------------

const CLEANUP_SCAN_PAGE_SIZE = 100;

/**
 * Scans all contacts in the local DB for cleanup issues.
 * Returns only contacts that have at least one issue.
 * Uses pagination to avoid loading the full contact list at once.
 */
export function scanAllContactsForIssues(): ContactIssues[] {
  const results: ContactIssues[] = [];
  let page = 0;

  while (true) {
    const batch = listContacts({ page, pageSize: CLEANUP_SCAN_PAGE_SIZE });
    if (batch.length === 0) break;

    for (const contact of batch) {
      const phones = getPhonesByContactId(contact.id).map((p) => p.number);
      const issues = scanContactForIssues(contact, phones);
      if (issues.length > 0) {
        results.push({ contact, issues });
      }
    }
    page++;
  }

  return results;
}

// ---------------------------------------------------------------------------
// Fix applicator
// ---------------------------------------------------------------------------

/**
 * Applies a single fixable cleanup issue to the contact.
 * Only fixes issues that have a suggested value.
 * Logs the action to the audit log.
 *
 * Returns true if a fix was applied, false if the issue has no fix.
 */
export function applyCleanupFix(
  contact: LocalContact,
  issue: CleanupIssue,
): boolean {
  return applyCleanupFixInternal(contact, issue, replacePhonesByContactId);
}

function applyCleanupFixInternal(
  contact: LocalContact,
  issue: CleanupIssue,
  replacePhones: typeof replacePhonesByContactId,
): boolean {
  switch (issue.kind) {
    case 'uncapitalized_name':
    case 'extra_whitespace': {
      if (!issue.suggestedValue) return false;
      // Apply title case + whitespace collapse together
      const cleaned = toTitleCase(collapseWhitespace(contact.displayName));
      const parts = cleaned.split(' ');
      updateContact(contact.id, {
        firstName: parts[0] ?? null,
        lastName: parts.slice(1).join(' ') || null,
      });
      logAction('cleanup_applied', contact.id, { kind: issue.kind, value: cleaned });
      return true;
    }
    case 'malformed_phone':
    case 'no_country_code':
    case 'duplicate_numbers': {
      const phoneEntries = getPhonesByContactId(contact.id).map((phone) => ({
        label: phone.label,
        number: phone.number,
      }));
      const standardized = buildStandardizedPhoneEntries(phoneEntries, DEFAULT_COUNTRY_CODE);
      replacePhones(contact.id, standardized);
      logAction('cleanup_applied', contact.id, {
        kind: issue.kind,
        phoneCount: standardized.length,
      });
      return true;
    }
    default:
      return false;
  }
}

/**
 * Applies all fixable issues for a contact in one DB round-trip.
 * Skips issues with no suggested fix (missing_name, missing_phone, ghost_contact).
 * Returns the number of fixes applied.
 */
export function applyAllFixesForContact(
  contactIssues: ContactIssues,
): number {
  let count = 0;
  for (const issue of contactIssues.issues) {
    if (applyCleanupFix(contactIssues.contact, issue)) {
      count++;
    }
  }
  return count;
}

export function applyBulkCleanupFixes(contactIssuesList: ContactIssues[]): number {
  let totalFixes = 0;

  for (const contactIssues of contactIssuesList) {
    if (contactIssues.issues.some((issue) => issue.kind === 'ghost_contact')) {
      continue;
    }
    totalFixes += applyAllFixesForContact(contactIssues);
  }

  return totalFixes;
}

export function purgeGhostContacts(contactIssuesList: ContactIssues[]): number {
  const ghostContacts = contactIssuesList.filter((item) =>
    item.issues.some((issue) => issue.kind === 'ghost_contact'),
  );

  if (ghostContacts.length === 0) return 0;

  for (const item of ghostContacts) {
    deleteContact(item.contact.id);
    logAction('cleanup_applied', item.contact.id, {
      kind: 'ghost_contact',
      action: 'deleted_ghost_contact',
    });
  }

  return ghostContacts.length;
}

export function applyBulkCleanupFixesByContactIds(contactIds: number[]): number {
  if (contactIds.length === 0) return 0;

  const db = getDatabase();
  let totalFixes = 0;

  db.withTransactionSync(() => {
    for (const contactId of contactIds) {
      const contact = getContactById(contactId);

      if (!contact) continue;

      const phoneNumbers = getPhonesByContactId(contact.id).map((phone) => phone.number);
      const issues = scanContactForIssues(contact, phoneNumbers);

      for (const issue of issues) {
        if (issue.kind === 'ghost_contact') continue;
        if (applyCleanupFixInternal(contact, issue, replacePhonesByContactIdSync)) {
          totalFixes++;
        }
      }
    }
  });

  return totalFixes;
}
