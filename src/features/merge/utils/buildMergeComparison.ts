import type { ContactWithDetails } from '../../../types';
import type { FieldComparison, FieldSource, FieldComparisonState, MergeComparisonModel } from '../types';

interface FieldConfig {
  key: keyof ContactWithDetails;
  label: string;
  type: 'scalar' | 'array';
}

const SCALAR_FIELDS: FieldConfig[] = [
  { key: 'firstName', label: 'First Name', type: 'scalar' },
  { key: 'lastName', label: 'Last Name', type: 'scalar' },
  { key: 'company', label: 'Company', type: 'scalar' },
  { key: 'jobTitle', label: 'Job Title', type: 'scalar' },
  { key: 'birthday', label: 'Birthday', type: 'scalar' },
  { key: 'notes', label: 'Notes', type: 'scalar' },
];

export function buildMergeComparison(
  contactA: ContactWithDetails,
  contactB: ContactWithDetails
): MergeComparisonModel {
  const fields: FieldComparison[] = [];

  // Compare scalar fields
  for (const config of SCALAR_FIELDS) {
    const valA = contactA[config.key] as string | boolean | null;
    const valB = contactB[config.key] as string | boolean | null;

    const isEmptyA = valA === null || valA === '';
    const isEmptyB = valB === null || valB === '';

    let state: FieldComparisonState;
    let selectedSource: FieldSource;
    let resolvedValue: string | boolean | null;

    if (valA === valB) {
      state = 'match';
      selectedSource = 'a';
      resolvedValue = valA;
    } else if (isEmptyA && !isEmptyB) {
      state = 'single-source';
      selectedSource = 'b';
      resolvedValue = valB;
    } else if (!isEmptyA && isEmptyB) {
      state = 'single-source';
      selectedSource = 'a';
      resolvedValue = valA;
    } else {
      state = 'conflict';
      // Default to A for conflicts, but the UI will force a visible choice
      selectedSource = 'a';
      resolvedValue = valA;
    }

    fields.push({
      type: 'scalar',
      key: config.key,
      label: config.label,
      valueA: valA,
      valueB: valB,
      state,
      selectedSource,
      resolvedValue,
    });
  }

  // Tags are arrays
  const tagsA = parseTags(contactA.tags);
  const tagsB = parseTags(contactB.tags);
  const isTagsMatch = JSON.stringify(tagsA) === JSON.stringify(tagsB);

  fields.push({
    type: 'array',
    key: 'tags',
    label: 'Tags',
    valueA: tagsA,
    valueB: tagsB,
    state: isTagsMatch ? 'match' : 'mergeable',
    selectedSource: 'combined',
    resolvedValue: Array.from(new Set([...tagsA, ...tagsB])),
  });

  // Phones & Emails are inherently mergeable in ContactForge
  fields.push({
    type: 'array',
    key: 'phoneNumbers',
    label: 'Phone Numbers',
    valueA: contactA.phoneNumbers,
    valueB: contactB.phoneNumbers,
    state: 'mergeable',
    selectedSource: 'combined',
    resolvedValue: [...contactA.phoneNumbers, ...contactB.phoneNumbers],
  });

  fields.push({
    type: 'array',
    key: 'emails',
    label: 'Email Addresses',
    valueA: contactA.emails,
    valueB: contactB.emails,
    state: 'mergeable',
    selectedSource: 'combined',
    resolvedValue: [...contactA.emails, ...contactB.emails],
  });

  return { contactA, contactB, fields };
}

function parseTags(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}
