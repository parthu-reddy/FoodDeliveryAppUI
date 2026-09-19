import { describe, expect, it } from 'vitest';
import { parseIndianAddress } from './addressParts';

describe('parseIndianAddress', () => {
  it('splits a state and postcode sharing one part, and drops the country', () => {
    // The shape a reverse geocode actually returns. The positional parser this replaces read
    // "Karnataka 560034" as the state and "India" as the ZIP.
    expect(parseIndianAddress('12 Main Rd, Koramangala, Bengaluru, Karnataka 560034, India'))
      .toEqual({
        addressLine1: '12 Main Rd',
        addressLine2: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560034',
      });
  });

  it('takes a postcode that stands on its own', () => {
    expect(parseIndianAddress('5 Church St, Bengaluru, Karnataka, 560001')).toMatchObject({
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560001',
    });
  });

  it('leaves the fields it cannot find empty rather than guessing', () => {
    expect(parseIndianAddress('Somewhere')).toEqual({
      addressLine1: 'Somewhere',
      addressLine2: '',
      city: '',
      state: 'Somewhere',
      zipCode: '',
    });
    expect(parseIndianAddress(undefined)).toEqual({
      addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '',
    });
  });

  it('keeps every part between the street and the city as the second line', () => {
    expect(parseIndianAddress('Flat 4, Tower B, Palm Grove, Pune, Maharashtra 411001'))
      .toMatchObject({ addressLine1: 'Flat 4', addressLine2: 'Tower B, Palm Grove', city: 'Pune' });
  });
});
