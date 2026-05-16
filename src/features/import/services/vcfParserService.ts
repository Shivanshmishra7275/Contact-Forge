import * as FileSystem from 'expo-file-system';

export interface ParsedVcfResult {
  cards: Record<string, string>[];
  errors: string[];
}

export const vcfParserService = {
  /**
   * Reads a local file URI and parses its VCF/vCard contents.
   */
  async parseLocalFile(fileUri: string): Promise<ParsedVcfResult> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'utf8',
      });
      return this.parseVcfString(fileContent);
    } catch (err: any) {
      return {
        cards: [],
        errors: [`Failed to read file: ${err.message}`]
      };
    }
  },

  /**
   * Basic vCard parser targeting MVP fields.
   * FN, N, TEL, EMAIL, ORG, TITLE, NOTE
   */
  parseVcfString(vcfString: string): ParsedVcfResult {
    const result: ParsedVcfResult = {
      cards: [],
      errors: []
    };

    if (!vcfString || vcfString.trim() === '') {
      result.errors.push('File is empty.');
      return result;
    }

    // Split by BEGIN:VCARD to handle multiple cards
    const cardBlocks = vcfString.split(/BEGIN:VCARD/i).map(c => c.trim()).filter(c => c.length > 0);

    for (const block of cardBlocks) {
      const cardRecord: Record<string, string> = {};
      let phoneCount = 0;
      let emailCount = 0;

      // Split lines, unwrapping folded lines (lines starting with space/tab)
      const lines = block.split(/\r?\n/);
      const unwrappedLines: string[] = [];
      
      for (const line of lines) {
        if (line.match(/^[ \t]+/) && unwrappedLines.length > 0) {
          unwrappedLines[unwrappedLines.length - 1] += line.trim();
        } else if (line.trim().length > 0) {
          unwrappedLines.push(line.trim());
        }
      }

      for (const line of unwrappedLines) {
        if (line.toUpperCase() === 'END:VCARD') break;

        // Split by first colon
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;

        const propPart = line.substring(0, colonIdx);
        const valuePart = line.substring(colonIdx + 1);

        // Property name might have parameters separated by semicolons (e.g., TEL;TYPE=WORK,VOICE)
        const propName = propPart.split(';')[0].toUpperCase();

        switch (propName) {
          case 'FN':
            cardRecord['full_name'] = valuePart;
            break;
          case 'N':
            // N is formatted as Family;Given;Middle;Prefix;Suffix
            const parts = valuePart.split(';');
            if (parts[0]) cardRecord['last_name'] = parts[0];
            if (parts[1]) cardRecord['first_name'] = parts[1];
            if (parts[2]) cardRecord['middle_name'] = parts[2];
            break;
          case 'TEL':
            phoneCount++;
            if (phoneCount === 1) cardRecord['phone_primary'] = valuePart;
            else if (phoneCount === 2) cardRecord['phone_secondary'] = valuePart;
            break;
          case 'EMAIL':
            emailCount++;
            if (emailCount === 1) cardRecord['email_primary'] = valuePart;
            else if (emailCount === 2) cardRecord['email_secondary'] = valuePart;
            break;
          case 'ORG':
            cardRecord['company'] = valuePart.split(';')[0]; // Sometimes it's Organization;Department
            break;
          case 'TITLE':
            cardRecord['title'] = valuePart;
            break;
          case 'NOTE':
            // Unescape newlines
            cardRecord['notes'] = valuePart.replace(/\\n/gi, '\n');
            break;
        }
      }

      // Only add if it has some meaningful data
      if (Object.keys(cardRecord).length > 0) {
        result.cards.push(cardRecord);
      }
    }

    if (result.cards.length === 0 && cardBlocks.length > 0) {
      result.errors.push('No readable contact fields found in vCards.');
    }

    return result;
  }
};
