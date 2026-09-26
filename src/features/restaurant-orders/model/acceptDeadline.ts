import type { Order } from '@/types';
import { tryParseInstant } from '@/shared/time';

/**
 * When an unaccepted order is auto-cancelled.
 *
 * `CustomerApplication/.../scheduler/RestaurantTimeoutSweeper.java` sweeps every 60 s and
 * cancels a `PENDING_ACCEPTANCE` order whose `updatedAt` is older than 10 minutes. No deadline
 * field exists in the restaurant API, so it is derived here from the restaurant's own record
 * of when the order arrived. The sweeper's 60 s period means the real cancel lands up to a
 * minute AFTER this -- the clock can run out early, never late, which is the safe direction for
 * a kitchen deciding whether to accept.
 */
export const ACCEPT_WINDOW_MS = 10 * 60_000;

export function acceptDeadline(order: Pick<Order, 'createdAt' | 'updatedAt'>): number | null {
  const ms = (iso?: string) => tryParseInstant(iso) ?? NaN;
  const from = ms(order.createdAt) || ms(order.updatedAt);
  return Number.isFinite(from) && from > 0 ? from + ACCEPT_WINDOW_MS : null;
}

/** "6:12", never negative. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * The prep time the kitchen commits to by accepting -- the same arithmetic the server does
 * (RestaurentApplication `CreatedState.accept`: `prepTime ?? 15` plus any additional minutes),
 * so "Accept · 25 min" is the number the customer will be quoted, not a second opinion.
 */
export function promisedPrepMinutes(order: { prepTime?: number | null; additionalPrepTime?: number | null }): number {
  return (order.prepTime ?? 15) + (order.additionalPrepTime ?? 0);
}
