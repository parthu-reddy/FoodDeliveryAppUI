import { formatINR } from '@shared/money';

/**
 * How the small facts on a restaurant read. The backend sends distance and rating as raw
 * doubles, and they were interpolated as-is: "2.4000000000000004 km", "₹0 fee", a rating of
 * "0" for a kitchen nobody has reviewed yet.
 */
export function formatKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function formatDeliveryFee(fee: number | string | null | undefined): string {
  const n = Number(fee ?? 0);
  return n > 0 ? `${formatINR(n)} delivery` : 'Free delivery';
}

export function formatRating(rating: number | null | undefined): string {
  return rating && rating > 0 ? rating.toFixed(1) : 'New';
}
