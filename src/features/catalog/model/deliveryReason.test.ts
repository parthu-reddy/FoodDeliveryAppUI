import { describe, expect, it } from 'vitest';
import { deliveryUnavailableReason } from './deliveryReason';

describe('deliveryUnavailableReason', () => {
  it('shows the server sentence as written', () => {
    // The exact 409 body observed on the deployed app, 2026-09-19.
    const live = 'No delivery partner near that restaurant, please look for another restaurant.';
    expect(deliveryUnavailableReason(live)).toBe(live);
  });

  it('does not collapse a no-rider message into an out-of-area one', () => {
    // The defect: these need opposite actions, and the old code branch never fired because
    // the server sends errorCode: null, so every cause read as "Out of Serviceable Area".
    const live = 'No delivery partner near that restaurant, please look for another restaurant.';
    expect(deliveryUnavailableReason(live)).not.toMatch(/serviceable area/i);
  });

  it('maps the codes when a code is what arrives', () => {
    expect(deliveryUnavailableReason('NO_DELIVERY_PARTNER_NEARBY')).toBe(
      'No delivery partner available nearby'
    );
    expect(deliveryUnavailableReason('OUT_OF_SERVICE_AREA')).toBe('Out of serviceable area');
  });

  it('falls back rather than showing an unknown code to a customer', () => {
    expect(deliveryUnavailableReason('SOME_NEW_CODE')).toBe('Delivery unavailable right now');
  });

  it('falls back for absent, empty or non-string input', () => {
    for (const v of [null, undefined, '', '   ', 42, {}]) {
      expect(deliveryUnavailableReason(v)).toBe('Delivery unavailable right now');
    }
  });
});
