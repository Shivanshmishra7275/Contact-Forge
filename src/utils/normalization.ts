/**
 * ContactForge — Normalization Utilities
 *
 * Pure functions for cleaning, normalizing, and comparing contact data.
 * All functions are deterministic and free of side effects.
 * They can be tested in isolation from any UI or database code.
 */

// ---------------------------------------------------------------------------
// Name normalization
// ---------------------------------------------------------------------------

/**
 * Converts a string to Title Case, collapsing extra whitespace.
 * "  john  doe " → "John Doe"
 */
export function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Returns a lowercase, trimmed, whitespace-collapsed version of a name
 * suitable for storage as normalized_name.
 */
export function normalizeName(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Builds a display name from parts, falling back gracefully.
 */
export function buildDisplayName(
  firstName: string | null,
  lastName: string | null,
  company: string | null,
  phone: string | null,
): string {
  const parts = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  if (company) return company;
  if (phone) return phone;
  return '(Unknown)';
}

// ---------------------------------------------------------------------------
// Phone normalization
// ---------------------------------------------------------------------------

/**
 * Strips all non-digit characters from a phone number.
 * "+1 (555) 123-4567" → "15551234567"
 */
export function stripPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Returns a normalized version of a phone number for comparison/indexing.
 * Strips non-digits. For numbers ≤ 11 digits (US format with/without country code),
 * returns the last 10 digits. For longer international numbers, returns the full digit string.
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = stripPhone(phone);
  if (!digits) return '';
  // International numbers longer than 11 digits keep full form
  if (digits.length > 11) return digits;
  // All other numbers: use last 10 digits for consistent comparison
  return digits.slice(-10);
}

/**
 * Appends a country code if the number has exactly 10 digits and no code yet.
 * Returns the original string if unsure.
 */
export function appendCountryCode(
  phone: string,
  countryCode: string,
): string {
  const digits = stripPhone(phone);
  if (digits.length === 10) {
    const prefix = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    return `${prefix}${digits}`;
  }
  return phone;
}

/**
 * Formats a 10-digit US number as "(555) 123-4567".
 * Returns the original if formatting isn't applicable.
 */
export function formatPhoneUS(phone: string): string {
  const digits = stripPhone(phone);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.charAt(0) === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// ---------------------------------------------------------------------------
// Email normalization
// ---------------------------------------------------------------------------

/**
 * Lowercases and trims an email address.
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// String cleanup helpers
// ---------------------------------------------------------------------------

/**
 * Collapses multiple consecutive spaces into one and trims the string.
 */
export function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Returns true if the string contains leading/trailing or repeated whitespace.
 */
export function hasExcessWhitespace(value: string): boolean {
  return value !== value.trim() || /\s{2,}/.test(value);
}

/**
 * Returns true if the string has any uppercase characters that wouldn't
 * appear in proper title casing (e.g., "john doe" or "JOHN DOE").
 */
export function needsTitleCase(value: string): boolean {
  const titled = toTitleCase(value);
  return titled !== value;
}

// ---------------------------------------------------------------------------
// Levenshtein edit distance — used for fuzzy name matching
// ---------------------------------------------------------------------------

/**
 * Computes the Levenshtein edit distance between two strings.
 * O(n*m) time, O(m) space.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const m = a.length;
  const n = b.length;

  // Two-row rolling array to keep space at O(n)
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,     // insertion
        prev[j] + 1,         // deletion
        prev[j - 1] + cost,  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Returns a similarity score in [0, 1] based on edit distance.
 * 1.0 = identical, 0.0 = completely different.
 */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(na, nb) / maxLen;
}

// ---------------------------------------------------------------------------
// Ghost contact detection
// ---------------------------------------------------------------------------

/**
 * Returns true if a contact is considered a "ghost" —
 * it has no usable identity information.
 */
export function isGhostContact(params: {
  displayName: string;
  phoneNumbers: string[];
  emails: string[];
  company: string | null;
}): boolean {
  const hasName = params.displayName.trim().length > 0 &&
    params.displayName !== '(Unknown)';
  const hasPhone = params.phoneNumbers.some((p) => p.trim().length > 0);
  const hasEmail = params.emails.some((e) => e.trim().length > 0);
  const hasCompany = Boolean(params.company?.trim());
  return !hasName && !hasPhone && !hasEmail && !hasCompany;
}

// ---------------------------------------------------------------------------
// ISO timestamp helpers
// ---------------------------------------------------------------------------

export function now(): string {
  return new Date().toISOString();
}

export function isoToDisplay(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
