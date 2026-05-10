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
  getPhonesByContactId,
  updateContact,
} from '../db/repositories/contactRepository';
import { logAction } from '../db/repositories/auditRepository';
import {
  toTitleCase,
  hasExcessWhitespace,
  collapseWhitespace,
} from '../utils/normalization';
import type { CleanupIssue, LocalContact } from '../types';

export interface ContactIssues {
  contact: LocalContact;
  issues: CleanupIssue[];
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
  if (!issue.suggestedValue) return false;

  switch (issue.kind) {
    case 'uncapitalized_name':
    case 'extra_whitespace': {
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
