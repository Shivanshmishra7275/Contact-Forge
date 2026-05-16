import { getDatabase } from '../index';
import { StagedImportRow, RowValidationStatus } from '../../features/import/types';

export const importRowRepository = {
  insertBatch(rows: Omit<StagedImportRow, 'id'>[]): void {
    const db = getDatabase();
    
    // Use transaction for batch insert
    db.withTransactionSync(() => {
      for (const row of rows) {
        db.runSync(
          `INSERT INTO import_rows 
           (session_id, row_index, csv_row_json, validation_status, validation_errors, mapped_contact_json, collision_type, collision_details, is_imported)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.session_id,
            row.row_index,
            row.csv_row_json,
            row.validation_status,
            row.validation_errors || null,
            row.mapped_contact_json || null,
            row.collision_type || null,
            row.collision_details || null,
            row.is_imported ? 1 : 0
          ]
        );
      }
    });
  },

  getRowsBySession(sessionId: number, limit: number = 50, offset: number = 0): StagedImportRow[] {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      `SELECT * FROM import_rows WHERE session_id = ? ORDER BY row_index ASC LIMIT ? OFFSET ?`,
      [sessionId, limit, offset]
    );
    
    return rows.map(r => ({
      ...r,
      is_imported: r.is_imported === 1
    }));
  },

  getAllRowsBySession(sessionId: number): StagedImportRow[] {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      `SELECT * FROM import_rows WHERE session_id = ? ORDER BY row_index ASC`,
      [sessionId]
    );
    
    return rows.map(r => ({
      ...r,
      is_imported: r.is_imported === 1
    }));
  },

  updateRowValidation(rowId: number, status: RowValidationStatus, mappedJson: string, errors?: string): void {
    const db = getDatabase();
    db.runSync(
      `UPDATE import_rows 
       SET validation_status = ?, mapped_contact_json = ?, validation_errors = ?
       WHERE id = ?`,
      [status, mappedJson, errors || null, rowId]
    );
  },
  
  markAsImported(rowId: number): void {
    const db = getDatabase();
    db.runSync(
      `UPDATE import_rows SET is_imported = 1 WHERE id = ?`,
      [rowId]
    );
  }
};
