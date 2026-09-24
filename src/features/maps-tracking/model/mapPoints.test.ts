import { describe, it, expect } from 'vitest';
import { knownPoint, missingPointsNote, routeEnds } from './mapPoints';

const R = { lat: 12.97, lng: 77.64 };
const C = { lat: 12.95, lng: 77.6 };
const RIDER = { lat: 12.96, lng: 77.62 };

describe('knownPoint', () => {
  it('rejects missing, zero and out-of-range values instead of defaulting them', () => {
    expect(knownPoint(undefined, 77.6)).toBeNull();
    expect(knownPoint(0, 0)).toBeNull();
    expect(knownPoint(95, 10)).toBeNull();
    expect(knownPoint(NaN, 10)).toBeNull();
    expect(knownPoint('12.9', '77.6')).toEqual({ lat: 12.9, lng: 77.6 });
  });
});

describe('routeEnds', () => {
  it('routes the rider to the restaurant before pickup and to the customer after', () => {
    expect(routeEnds({ rider: RIDER, restaurant: R, customer: C, deliveryStatus: 'ASSIGNED' })).toEqual([RIDER, R]);
    expect(routeEnds({ rider: RIDER, restaurant: R, customer: C, deliveryStatus: 'OUT_FOR_DELIVERY' })).toEqual([RIDER, C]);
  });
  it('draws restaurant to customer when there is no rider position', () => {
    expect(routeEnds({ rider: null, restaurant: R, customer: C })).toEqual([R, C]);
  });
  it('draws no route to or from an unknown point', () => {
    expect(routeEnds({ rider: null, restaurant: null, customer: C })).toBeNull();
    expect(routeEnds({ rider: RIDER, restaurant: R, customer: null, deliveryStatus: 'OUT_FOR_DELIVERY' })).toBeNull();
  });
});

describe('missingPointsNote', () => {
  it('says what it could not show', () => {
    expect(missingPointsNote(R, C)).toBeNull();
    expect(missingPointsNote(null, C)).toBe('Restaurant location unavailable');
    expect(missingPointsNote(R, null)).toBe('Delivery location unavailable');
  });
});
