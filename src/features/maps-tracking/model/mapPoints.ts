import { DeliveryStatus } from '@/types/backend-enums';

/**
 * Which points the order map may draw, and which route between them.
 *
 * The map used to fill a missing point with a fixed Bengaluru coordinate -- 12.96/77.61 for
 * the customer, 12.98/77.58 for the restaurant -- and then draw a pin and a route there as if
 * they were real. Anything unknown is now `null`, and nothing is drawn to or from it.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** A usable coordinate, or null. (0, 0) is the "unset" value some rows carry, not a place. */
export function knownPoint(lat: unknown, lng: unknown): LatLng | null {
  const la = typeof lat === 'string' ? Number(lat) : lat;
  const ln = typeof lng === 'string' ? Number(lng) : lng;
  if (typeof la !== 'number' || typeof ln !== 'number') return null;
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la === 0 && ln === 0) return null;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
  return { lat: la, lng: ln };
}

/** The rider still has to reach the restaurant. */
export function headingToRestaurant(deliveryStatus?: DeliveryStatus | string): boolean {
  return !deliveryStatus
    || deliveryStatus === DeliveryStatus.ASSIGNED
    || deliveryStatus === DeliveryStatus.AT_RESTAURANT
    || deliveryStatus === DeliveryStatus.PENDING
    || deliveryStatus === DeliveryStatus.SEARCHING_FOR_DRIVER;
}

/**
 * The route to draw: from the rider to wherever they are going next when the rider's position
 * is known, else restaurant to customer. Null when either end is unknown.
 */
export function routeEnds(points: {
  rider: LatLng | null;
  restaurant: LatLng | null;
  customer: LatLng | null;
  deliveryStatus?: DeliveryStatus | string;
}): [LatLng, LatLng] | null {
  const { rider, restaurant, customer, deliveryStatus } = points;
  if (rider) {
    const to = headingToRestaurant(deliveryStatus) ? restaurant : customer;
    return to ? [rider, to] : null;
  }
  return restaurant && customer ? [restaurant, customer] : null;
}

/** What the map should say it could not show, if anything. */
export function missingPointsNote(restaurant: LatLng | null, customer: LatLng | null): string | null {
  if (!restaurant && !customer) return 'Locations unavailable';
  if (!restaurant) return 'Restaurant location unavailable';
  if (!customer) return 'Delivery location unavailable';
  return null;
}
