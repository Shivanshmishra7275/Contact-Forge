import * as FileSystem from 'expo-file-system';

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export const csvParserService = {
  /**
   * Reads a local file URI and parses its CSV contents.
   * Uses a synchronous JS-based state machine for RFC 4180 compatibility.
   */
  async parseLocalFile(fileUri: string): Promise<ParsedCsvResult> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'utf8',
      });
      return this.parseCsvString(fileContent);
    } catch (err: any) {
      return {
        headers: [],
        rows: [],
        errors: [`Failed to read file: ${err.message}`]
      };
    }
  },

  /**
   * Pure function to parse a CSV string.
   */
  parseCsvString(csvString: string): ParsedCsvResult {
    const result: ParsedCsvResult = {
      headers: [],
      rows: [],
      errors: []
    };

    if (!csvString || csvString.trim() === '') {
      result.errors.push('File is empty.');
      return result;
    }

    const records = this._tokenize(csvString);
    if (records.length === 0) {
      result.errors.push('No readable rows found.');
      return result;
    }

    // Assume first row is header
    const rawHeaders = records[0];
    result.headers = rawHeaders.map(h => h.trim());

    if (result.headers.length === 0 || (result.headers.length === 1 && result.headers[0] === '')) {
      result.errors.push('No valid headers found.');
      return result;
    }

    // Ensure headers are unique
    const uniqueHeaders: string[] = [];
    const headerCounts: Record<string, number> = {};
    for (const header of result.headers) {
      let finalHeader = header || 'Unknown';
      if (headerCounts[finalHeader]) {
        headerCounts[finalHeader]++;
        finalHeader = `${finalHeader}_${headerCounts[finalHeader]}`;
      } else {
        headerCounts[finalHeader] = 1;
      }
      uniqueHeaders.push(finalHeader);
    }
    result.headers = uniqueHeaders;

    // Parse rows
    for (let i = 1; i < records.length; i++) {
      const rowArr = records[i];
      // Skip completely empty rows
      if (rowArr.length === 0 || (rowArr.length === 1 && rowArr[0].trim() === '')) {
        continue;
      }

      const rowRecord: Record<string, string> = {};
      
      for (let j = 0; j < result.headers.length; j++) {
        rowRecord[result.headers[j]] = rowArr[j] ? rowArr[j].trim() : '';
      }
      
      result.rows.push(rowRecord);
    }

    return result;
  },

  /**
   * RFC 4180 compliant tokenizer
   */
  _tokenize(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote
            currentCell += '"';
            i++; // Skip next quote
          } else {
            // End of quoted section
            inQuotes = false;
          }
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          // End of cell
          currentRow.push(currentCell);
          currentCell = '';
        } else if (char === '\r' || char === '\n') {
          // End of row
          if (char === '\r' && nextChar === '\n') {
            i++; // skip \n
          }
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    // Push the last cell/row if text doesn't end with newline
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows;
  }
};
