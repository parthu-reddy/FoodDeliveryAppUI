import { describe, expect, it } from 'vitest';

import { readDispatchScope, readRestaurantCoordinates } from './dispatchScope';

describe('dispatch scope', () => {
  it('accepts only a complete server-provided city and positive radius', () => {
    expect(readDispatchScope({ dispatchCityId: 'BLR', fleetSearchRadiusKm: 5 }))
      .toEqual({ cityId: 'BLR', radiusKm: 5 });
    expect(readDispatchScope({ dispatchCityId: 'BLR', fleetSearchRadiusKm: 0 })).toBeNull();
    expect(readDispatchScope({ dispatchCityId: '', fleetSearchRadiusKm: 5 })).toBeNull();
  });

  it('reads finite restaurant coordinates from an API envelope only', () => {
    expect(readRestaurantCoordinates({ data: { lat: 12.97, lng: 77.59 } }))
      .toEqual({ lat: 12.97, lng: 77.59 });
    expect(readRestaurantCoordinates({ lat: Number.NaN, lng: 77.59 })).toBeNull();
    expect(readRestaurantCoordinates({ data: { lat: 12.97 } })).toBeNull();
    expect(readRestaurantCoordinates({ data: { lat: 0, lng: 0 } })).toBeNull();
  });
});
