export type ImportSourceType = 'csv' | 'vcf';

export type ImportSessionStatus = 'planning' | 'mapping' | 'validating' | 'ready' | 'committed' | 'failed';

export interface ImportSessionSummary {
  total_rows: number;
  valid_rows: number;
  collisions: number;
  imported_count: number;
  error?: string;
  was_truncated?: boolean;
}

export interface ImportSession {
  id: number;
  file_path: string;
  file_type: ImportSourceType;
  status: ImportSessionStatus;
  created_at: string;
  updated_at: string;
  summary_json?: string;
}

export type RowValidationStatus = 'valid' | 'warning' | 'error';

export interface StagedImportRow {
  id?: number;
  session_id: number;
  row_index: number;
  csv_row_json: string; // Original payload
  validation_status: RowValidationStatus;
  validation_errors?: string; // JSON array of reasons
  mapped_contact_json?: string; // Payload mapped to internal schema
  collision_type?: 'exact_match' | 'phone_overlap' | 'email_overlap' | 'name_overlap' | null;
  collision_details?: string;
  is_imported: boolean;
}

export interface CsvHeaderMap {
  csv_column: string;
  contact_field: string;
}

export interface ValidationIssue {
  type: RowValidationStatus;
  message: string;
}
