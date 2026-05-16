import { importSessionRepository } from '../../../db/repositories/importSessionRepository';
import { importRowRepository } from '../../../db/repositories/importRowRepository';
import { csvParserService } from './csvParserService';
import { vcfParserService } from './vcfParserService';
import { suggestMappings } from '../utils/mappingSuggestions';
import { ImportSourceType, CsvHeaderMap, StagedImportRow, RowValidationStatus } from '../types';

export const importOrchestrator = {
  /**
   * Phase 1: Pick and Parse File.
   * Reads file, parses it, and creates a session.
   */
  async processPickedFile(fileUri: string, type: ImportSourceType, fileName: string): Promise<number | null> {
    const sessionId = importSessionRepository.createSession(fileName, type);

    try {
      importSessionRepository.updateSessionStatus(sessionId, 'validating');

      let rowsToStage: Omit<StagedImportRow, 'id'>[] = [];

      if (type === 'csv') {
        const parsed = await csvParserService.parseLocalFile(fileUri);
        if (parsed.errors.length > 0 && parsed.rows.length === 0) {
          importSessionRepository.updateSessionStatus(sessionId, 'failed', { total_rows: 0, valid_rows: 0, collisions: 0, imported_count: 0, error: parsed.errors[0] });
          throw new Error(parsed.errors[0]);
        }

        let wasTruncated = false;
        // Limit huge imports
        if (parsed.rows.length > 10000) {
          parsed.rows = parsed.rows.slice(0, 10000);
          wasTruncated = true;
        }

        rowsToStage = parsed.rows.map((row, idx) => ({
          session_id: sessionId,
          row_index: idx,
          csv_row_json: JSON.stringify(row),
          validation_status: 'valid' as RowValidationStatus,
          is_imported: false
        }));

        importRowRepository.insertBatch(rowsToStage);

        // Store headers in mapping table or session (for MVP, we'll suggest mappings on the fly)
        importSessionRepository.updateSessionStatus(sessionId, 'mapping', {
          total_rows: rowsToStage.length,
          valid_rows: 0,
          collisions: 0,
          imported_count: 0,
          was_truncated: wasTruncated,
          error: JSON.stringify(parsed.headers) // Stash headers here temporarily for mapping UI
        });

      } else if (type === 'vcf') {
        const parsed = await vcfParserService.parseLocalFile(fileUri);
        if (parsed.errors.length > 0 && parsed.cards.length === 0) {
          importSessionRepository.updateSessionStatus(sessionId, 'failed', { total_rows: 0, valid_rows: 0, collisions: 0, imported_count: 0, error: parsed.errors[0] });
          throw new Error(parsed.errors[0]);
        }

        let wasTruncated = false;
        if (parsed.cards.length > 10000) {
          parsed.cards = parsed.cards.slice(0, 10000);
          wasTruncated = true;
        }

        rowsToStage = parsed.cards.map((card, idx) => ({
          session_id: sessionId,
          row_index: idx,
          csv_row_json: JSON.stringify(card), // Actually VCF data
          mapped_contact_json: JSON.stringify(card), // Auto-mapped
          validation_status: 'valid' as RowValidationStatus,
          is_imported: false
        }));

        importRowRepository.insertBatch(rowsToStage);

        importSessionRepository.updateSessionStatus(sessionId, 'validating', {
          total_rows: rowsToStage.length,
          valid_rows: 0,
          collisions: 0,
          imported_count: 0,
          was_truncated: wasTruncated
        });

        // VCF skips mapping, goes straight to validation
        await this.validateSessionRows(sessionId);
      }

      return sessionId;
    } catch (err: any) {
      importSessionRepository.updateSessionStatus(sessionId, 'failed', { total_rows: 0, valid_rows: 0, collisions: 0, imported_count: 0, error: err.message });
      throw err;
    }
  },

  /**
   * Phase 2: Apply Mapping (CSV Only)
   */
  async applyCsvMapping(sessionId: number, mappings: CsvHeaderMap[]): Promise<void> {
    const rows = importRowRepository.getAllRowsBySession(sessionId);
    importSessionRepository.updateSessionStatus(sessionId, 'validating');

    const updatedRows = [];

    for (const row of rows) {
      const rawData = JSON.parse(row.csv_row_json);
      const mappedRecord: Record<string, string> = {};

      for (const map of mappings) {
        if (map.contact_field !== 'ignore' && rawData[map.csv_column] !== undefined) {
          // If multiple columns map to same field, just take first or join.
          // For simplicity, last one wins, but we should join strings like notes
          mappedRecord[map.contact_field] = rawData[map.csv_column];
        }
      }

      importRowRepository.updateRowValidation(row.id!, 'valid', JSON.stringify(mappedRecord));
    }

    await this.validateSessionRows(sessionId);
  },

  /**
   * Phase 3: Validate and Preview
   */
  async validateSessionRows(sessionId: number): Promise<void> {
    const rows = importRowRepository.getAllRowsBySession(sessionId);
    
    let validCount = 0;

    for (const row of rows) {
      const mappedRecord = JSON.parse(row.mapped_contact_json || '{}');
      
      const hasName = !!mappedRecord['first_name'] || !!mappedRecord['last_name'] || !!mappedRecord['full_name'];
      const hasPhone = !!mappedRecord['phone_primary'] || !!mappedRecord['phone_secondary'];
      const hasEmail = !!mappedRecord['email_primary'] || !!mappedRecord['email_secondary'];

      let status: RowValidationStatus = 'valid';
      let errors = [];

      if (!hasName && !hasPhone && !hasEmail) {
        status = 'error';
        errors.push('Row has no name, phone, or email.');
      }

      if (status === 'valid') {
        validCount++;
      }

      importRowRepository.updateRowValidation(row.id!, status, JSON.stringify(mappedRecord), errors.length ? JSON.stringify(errors) : undefined);
    }

    const session = importSessionRepository.getSession(sessionId);
    if (session) {
      const summary = session.summary_json ? JSON.parse(session.summary_json) : {};
      summary.total_rows = rows.length;
      summary.valid_rows = validCount;
      
      importSessionRepository.updateSessionStatus(sessionId, 'ready', summary);
    }
  },

  /**
   * Phase 4: Commit to Contacts DB
   */
  async commitImport(sessionId: number): Promise<void> {
    importSessionRepository.updateSessionStatus(sessionId, 'committed');
    
    // In a full implementation, we'd loop through rows and insert them into the real Contacts table using the contactSyncService or contactRepository.
    // For Step 1, we will mock the contact creation logic or rely on the fact that this is just the Import Studio portion.
    // We update the row status to is_imported = true.
    const rows = importRowRepository.getAllRowsBySession(sessionId);
    let importedCount = 0;

    for (const row of rows) {
      if (row.validation_status === 'valid') {
        // Mocking the contact insert for MVP
        importRowRepository.markAsImported(row.id!);
        importedCount++;
      }
    }

    const session = importSessionRepository.getSession(sessionId);
    if (session) {
      const summary = session.summary_json ? JSON.parse(session.summary_json) : {};
      summary.imported_count = importedCount;
      importSessionRepository.updateSessionStatus(sessionId, 'committed', summary);
    }
  }
};
