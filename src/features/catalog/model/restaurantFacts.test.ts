import { describe, it, expect } from 'vitest';
import { formatDeliveryFee, formatKm, formatRating } from './restaurantFacts';

describe('restaurant facts', () => {
  it('rounds the raw double the backend sends for distance', () => {
    expect(formatKm(2.4000000000000004)).toBe('2.4 km');
    expect(formatKm(12.6)).toBe('13 km');
    expect(formatKm(undefined)).toBeNull();
  });
  it('says free instead of a zero fee', () => {
    expect(formatDeliveryFee(0)).toBe('Free delivery');
    expect(formatDeliveryFee(40)).toMatch(/40\.00 delivery$/);
  });
  it('does not show 0 stars for an unreviewed kitchen', () => {
    expect(formatRating(0)).toBe('New');
    expect(formatRating(4.2000001)).toBe('4.2');
  });
});
