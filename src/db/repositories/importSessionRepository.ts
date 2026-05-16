import { getDatabase } from '../index';
import { ImportSession, ImportSourceType, ImportSessionStatus, ImportSessionSummary } from '../../features/import/types';

export const importSessionRepository = {
  createSession(filePath: string, fileType: ImportSourceType): number {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Default summary
    const summary: ImportSessionSummary = {
      total_rows: 0,
      valid_rows: 0,
      collisions: 0,
      imported_count: 0
    };

    const result = db.runSync(
      `INSERT INTO import_sessions (file_path, file_type, status, created_at, updated_at, summary_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [filePath, fileType, 'planning', now, now, JSON.stringify(summary)]
    );

    return result.lastInsertRowId;
  },

  updateSessionStatus(sessionId: number, status: ImportSessionStatus, summary?: ImportSessionSummary): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    if (summary) {
      db.runSync(
        `UPDATE import_sessions 
         SET status = ?, summary_json = ?, updated_at = ?
         WHERE id = ?`,
        [status, JSON.stringify(summary), now, sessionId]
      );
    } else {
      db.runSync(
        `UPDATE import_sessions 
         SET status = ?, updated_at = ?
         WHERE id = ?`,
        [status, now, sessionId]
      );
    }
  },

  getSession(sessionId: number): ImportSession | null {
    const db = getDatabase();
    return db.getFirstSync<ImportSession>(
      `SELECT * FROM import_sessions WHERE id = ?`,
      [sessionId]
    ) || null;
  },

  getAllSessions(): ImportSession[] {
    const db = getDatabase();
    return db.getAllSync<ImportSession>(
      `SELECT * FROM import_sessions ORDER BY created_at DESC`
    );
  },
  
  deleteSession(sessionId: number): void {
    const db = getDatabase();
    db.runSync(`DELETE FROM import_sessions WHERE id = ?`, [sessionId]);
  }
};
