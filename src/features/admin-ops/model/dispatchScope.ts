export interface DispatchScope {
  cityId: string;
  radiusKm: number;
}

export interface RestaurantCoordinates {
  lat: number;
  lng: number;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' ? value as UnknownRecord : null;
}

/**
 * Reads the server-owned dispatch facts without inventing a city or a search
 * radius in the browser. Missing facts leave force assignment unavailable.
 */
export function readDispatchScope(order: UnknownRecord): DispatchScope | null {
  const cityId = order.dispatchCityId;
  const radiusKm = order.fleetSearchRadiusKm;
  if (typeof cityId !== 'string' || !cityId.trim()) return null;
  if (typeof radiusKm !== 'number' || !Number.isFinite(radiusKm) || radiusKm <= 0) return null;
  return { cityId, radiusKm };
}

/** Accept both the generated API wrapper and its direct payload form. */
export function readRestaurantCoordinates(response: unknown): RestaurantCoordinates | null {
  const outer = asRecord(response);
  const payload = asRecord(outer?.data) ?? outer;
  if (!payload) return null;
  const { lat, lng } = payload;
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return null;
  if (typeof lng !== 'number' || !Number.isFinite(lng)) return null;
  // RestaurantOutletController uses (0, 0) as its explicit missing-location sentinel.
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}
