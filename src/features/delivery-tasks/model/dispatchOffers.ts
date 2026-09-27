import { Order, OrderStatus } from '@/types';
import { msUntil } from '@/shared/time';

export function remainingDispatchSeconds(order: Order): number {
  if (order.expiresAt) return Math.max(0, Math.floor(msUntil(order.expiresAt) / 1000));
  return order.remainingPingSeconds ?? 0;
}

/** The popup and jobs board must expose the same actionable offers. */
export function isAvailableDispatch(order: Order, rejectedIds: ReadonlySet<string>): boolean {
  return !order.deliveryExecutiveId
    && !rejectedIds.has(order.id)
    && [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP].includes(order.status)
    && remainingDispatchSeconds(order) > 0;
}
