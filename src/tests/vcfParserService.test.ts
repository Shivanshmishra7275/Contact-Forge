import { vcfParserService } from '../features/import/services/vcfParserService';

describe('VCF Parser Service', () => {
  it('should parse a basic vCard', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
N:Gump;Forrest;;Mr.;
FN:Forrest Gump
ORG:Bubba Gump Shrimp Co.
TITLE:Shrimp Man
TEL;TYPE=WORK,VOICE:(111) 555-1212
TEL;TYPE=HOME,VOICE:(404) 555-1212
EMAIL;TYPE=PREF,INTERNET:forrestgump@example.com
END:VCARD`;

    const result = vcfParserService.parseVcfString(vcf);
    
    expect(result.errors.length).toBe(0);
    expect(result.cards.length).toBe(1);
    
    const card = result.cards[0];
    expect(card.full_name).toBe('Forrest Gump');
    expect(card.last_name).toBe('Gump');
    expect(card.first_name).toBe('Forrest');
    expect(card.company).toBe('Bubba Gump Shrimp Co.');
    expect(card.title).toBe('Shrimp Man');
    expect(card.phone_primary).toBe('(111) 555-1212');
    expect(card.phone_secondary).toBe('(404) 555-1212');
    expect(card.email_primary).toBe('forrestgump@example.com');
  });

  it('should unwrap folded lines correctly', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Long Name
NOTE:This is a very long note that spans
  multiple lines according to vCard spec.
END:VCARD`;

    const result = vcfParserService.parseVcfString(vcf);
    expect(result.cards[0].notes).toBe('This is a very long note that spansmultiple lines according to vCard spec.');
  });

  it('should handle unescaped newlines in NOTE fields', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Jane Doe
NOTE:Line 1\\nLine 2
END:VCARD`;

    const result = vcfParserService.parseVcfString(vcf);
    expect(result.cards[0].notes).toBe('Line 1\nLine 2');
  });

  it('should handle multiple vCards in one file', () => {
    const vcf = `BEGIN:VCARD
FN:Card 1
END:VCARD
BEGIN:VCARD
FN:Card 2
END:VCARD`;

    const result = vcfParserService.parseVcfString(vcf);
    expect(result.cards.length).toBe(2);
    expect(result.cards[0].full_name).toBe('Card 1');
    expect(result.cards[1].full_name).toBe('Card 2');
  });
});
