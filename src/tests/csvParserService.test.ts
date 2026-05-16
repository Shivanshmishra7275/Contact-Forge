import { csvParserService } from '../features/import/services/csvParserService';

describe('CSV Parser Service', () => {
  it('should parse a basic CSV string', () => {
    const csv = `first_name,last_name,phone\nJohn,Doe,12345\nJane,Smith,67890`;
    const result = csvParserService.parseCsvString(csv);
    
    expect(result.errors.length).toBe(0);
    expect(result.headers).toEqual(['first_name', 'last_name', 'phone']);
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].first_name).toBe('John');
    expect(result.rows[1].phone).toBe('67890');
  });

  it('should handle quoted strings with commas', () => {
    const csv = `name,company\n"Doe, John",Acme Inc`;
    const result = csvParserService.parseCsvString(csv);
    
    expect(result.errors.length).toBe(0);
    expect(result.rows[0].name).toBe('Doe, John');
    expect(result.rows[0].company).toBe('Acme Inc');
  });

  it('should handle escaped quotes inside quoted strings', () => {
    const csv = `name,notes\nJohn,"He said ""hello"" to me"`;
    const result = csvParserService.parseCsvString(csv);
    
    expect(result.errors.length).toBe(0);
    expect(result.rows[0].notes).toBe('He said "hello" to me');
  });

  it('should handle empty or malformed files gracefully', () => {
    const result = csvParserService.parseCsvString('');
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toBe('File is empty.');
  });

  it('should handle duplicate headers by making them unique', () => {
    const csv = `phone,phone,phone\n123,456,789`;
    const result = csvParserService.parseCsvString(csv);
    
    expect(result.headers).toEqual(['phone', 'phone_2', 'phone_3']);
    expect(result.rows[0]['phone']).toBe('123');
    expect(result.rows[0]['phone_2']).toBe('456');
    expect(result.rows[0]['phone_3']).toBe('789');
  });
});
