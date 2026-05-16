import { CsvHeaderMap } from '../types';

export const ALL_CONTACT_FIELDS = [
  'first_name',
  'middle_name',
  'last_name',
  'full_name',
  'phone_primary',
  'phone_secondary',
  'email_primary',
  'email_secondary',
  'company',
  'title',
  'notes',
  'ignore'
] as const;

/**
 * Normalizes a header string for better matching.
 * "Email Address" -> "emailaddress"
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Attempts to guess the best target field for a given CSV header.
 */
export function suggestMappingForHeader(header: string): string {
  const norm = normalizeHeader(header);

  if (norm.includes('first') || norm === 'givenname') return 'first_name';
  if (norm.includes('last') || norm === 'familyname' || norm === 'surname') return 'last_name';
  if (norm.includes('middle')) return 'middle_name';
  if (norm.includes('name')) return 'full_name'; // Fallback for name

  if (norm.includes('mobile') || norm === 'phone' || norm === 'cell' || norm === 'phone1' || norm === 'primaryphone' || norm.includes('telephone')) {
    return 'phone_primary';
  }
  if (norm.includes('phone') || norm === 'homephone' || norm === 'workphone' || norm === 'phone2') {
    return 'phone_secondary';
  }

  if (norm.includes('email') && (norm.includes('2') || norm.includes('second') || norm.includes('work'))) {
    return 'email_secondary';
  }
  if (norm.includes('email')) return 'email_primary';

  if (norm.includes('company') || norm.includes('organization') || norm === 'org') return 'company';
  if (norm.includes('title') || norm.includes('job')) return 'title';
  if (norm.includes('note') || norm.includes('desc')) return 'notes';

  return 'ignore';
}

/**
 * Computes suggested mappings for all detected headers.
 */
export function suggestMappings(headers: string[]): CsvHeaderMap[] {
  return headers.map(header => ({
    csv_column: header,
    contact_field: suggestMappingForHeader(header)
  }));
}
