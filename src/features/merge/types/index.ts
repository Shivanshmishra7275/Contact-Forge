import type { ContactWithDetails, PhoneNumber, EmailAddress } from '../../../types';

export type FieldComparisonState = 'match' | 'single-source' | 'conflict' | 'mergeable';
export type FieldSource = 'a' | 'b' | 'combined';

export interface ScalarFieldComparison {
  type: 'scalar';
  key: keyof ContactWithDetails;
  label: string;
  valueA: string | boolean | null;
  valueB: string | boolean | null;
  state: FieldComparisonState;
  selectedSource: FieldSource;
  resolvedValue: string | boolean | null;
}

export interface ArrayFieldComparison {
  type: 'array';
  key: keyof ContactWithDetails;
  label: string;
  valueA: any[];
  valueB: any[];
  state: FieldComparisonState;
  selectedSource: FieldSource;
  resolvedValue: any[];
}

export type FieldComparison = ScalarFieldComparison | ArrayFieldComparison;

export interface MergeComparisonModel {
  contactA: ContactWithDetails;
  contactB: ContactWithDetails;
  fields: FieldComparison[];
}
