import { DeliveryStatus, Order } from '@/types';

/**
 * What the rider has just confirmed, held until the server's copy of the order catches up.
 *
 * The rider's job list is polled from `/orders/active`, which is served from the customer
 * service's copy of the order. That copy is updated from the delivery service's events, a few
 * seconds after the rider's OTP was accepted. Until then every poll returned the step before:
 * after pickup the screen flipped back to "enter pickup OTP", and after delivery the finished job
 * came back as the active contract.
 *
 * A delivery only moves forward, so a poll never takes an order behind the step its rider
 * confirmed. The server wins as soon as it has caught up, and always wins when it says the order
 * is over for another reason (cancelled, failed).
 */

const STEP: Partial<Record<DeliveryStatus, number>> = {
  [DeliveryStatus.ASSIGNED]: 20,
  [DeliveryStatus.AT_RESTAURANT]: 30,
  [DeliveryStatus.OUT_FOR_DELIVERY]: 40,
  [DeliveryStatus.DELIVERED]: 50,
  [DeliveryStatus.FAILED]: 100,
  [DeliveryStatus.CANCELLED]: 100,
};

const step = (s?: DeliveryStatus | string | null) => (s ? STEP[s as DeliveryStatus] ?? 0 : 0);

const isCancelled = (o: Order) => /^(CANCELLED|REJECTED)/.test(String(o.status ?? ''));

/** Orders as the rider should see them; drops confirmations the server has caught up with. */
export function applyConfirmedProgress(orders: Order[], confirmed: Map<string, DeliveryStatus>): Order[] {
  const present = new Set(orders.map((o) => o.id));
  for (const id of [...confirmed.keys()]) {
    if (!present.has(id)) confirmed.delete(id);
  }
  return orders.map((o) => {
    const mine = confirmed.get(o.id);
    if (!mine) return o;
    if (isCancelled(o) || step(o.deliveryStatus) >= step(mine)) {
      confirmed.delete(o.id);
      return o;
    }
    return { ...o, deliveryStatus: mine };
  });
}

/** Records (or, for a revert with no delivery step, forgets) what the rider just set. */
export function recordConfirmedProgress(
  confirmed: Map<string, DeliveryStatus>, orderId: string, deliveryStatus?: DeliveryStatus,
): void {
  if (deliveryStatus) confirmed.set(orderId, deliveryStatus);
  else confirmed.delete(orderId);
}
