import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';

/**
 * Where an order sits in its life, from the UI's point of view.
 *
 * `IN_FLIGHT` is the only class that should be polled, tracked or offered a chat widget.
 */
export type Lifecycle = 'IN_FLIGHT' | 'SETTLED' | 'FAILED';

/**
 * Classify a backend `OrderStatus`.
 *
 * Exhaustive on purpose. `backend-enums.ts` is generated from the Java enum, so a status added on
 * the server becomes a TypeScript error here rather than silently falling into whichever branch
 * happened to be last -- which is how `CANCELLED_BY_PLATFORM` and `DELIVERY_FAILED`, added in
 * Phase 3, were being reported as active orders.
 */
export const classifyOrderStatus = (s: OrderStatus): Lifecycle => {
  switch (s) {
    case OrderStatus.CREATED:
    case OrderStatus.PENDING_ACCEPTANCE:
    case OrderStatus.AWAITING_DELAY_APPROVAL:
    case OrderStatus.ACCEPTED:
    case OrderStatus.PREPARING:
    case OrderStatus.READY_FOR_PICKUP:
    case OrderStatus.HANDED_OVER:
      return 'IN_FLIGHT';
    case OrderStatus.CANCELLED:
    case OrderStatus.CANCELLED_BY_RESTAURANT:
    case OrderStatus.CANCELLED_BY_PLATFORM:
    case OrderStatus.DELIVERY_FAILED:
      return 'FAILED';
    default: {
      // Compile-time exhaustiveness. At runtime `status` arrives as a string off the wire, so a
      // value the UI has never heard of is possible -- treat it as in flight. That keeps polling,
      // which is recoverable; treating it as finished freezes the tracker, which is M-10.
      const unhandled: never = s;
      void unhandled;
      return 'IN_FLIGHT';
    }
  }
};

/** Classify a backend `DeliveryStatus`. Exhaustive for the same reason. */
export const classifyDeliveryStatus = (ds: DeliveryStatus): Lifecycle => {
  switch (ds) {
    case DeliveryStatus.PENDING:
    case DeliveryStatus.SEARCHING_FOR_DRIVER:
    case DeliveryStatus.MANUAL_INTERVENTION_REQUIRED:
    case DeliveryStatus.ASSIGNED:
    case DeliveryStatus.AT_RESTAURANT:
    case DeliveryStatus.OUT_FOR_DELIVERY:
      return 'IN_FLIGHT';
    case DeliveryStatus.DELIVERED:
      return 'SETTLED';
    case DeliveryStatus.CANCELLED:
    case DeliveryStatus.FAILED:
      return 'FAILED';
    default: {
      const unhandled: never = ds;
      void unhandled;
      return 'IN_FLIGHT';
    }
  }
};

type OrderLike = Pick<import('@/types').Order, 'status' | 'deliveryStatus'>;

/**
 * The single definition of "this order is still happening".
 *
 * The poller, the active-orders carousel, the restaurant queue and the rider's task list all ask
 * this one function. They used to each carry their own list of statuses: the poll gate's omitted
 * `AWAITING_DELAY_APPROVAL`, so a customer asked to approve a delay saw the prompt once and then
 * stopped receiving updates for the rest of the order (M-10).
 */
export const isActiveOrder = (order: OrderLike): boolean => {
  if (!order) return false;
  if (order.deliveryStatus && classifyDeliveryStatus(order.deliveryStatus) !== 'IN_FLIGHT') {
    return false;
  }
  if (!order.status) return false;
  return classifyOrderStatus(order.status) === 'IN_FLIGHT';
};

/** The order ended badly: cancelled by anyone, or the delivery failed. */
export const isFailedOrder = (order: OrderLike): boolean => {
  if (!order) return false;
  if (order.deliveryStatus && classifyDeliveryStatus(order.deliveryStatus) === 'FAILED') {
    return true;
  }
  return !!order.status && classifyOrderStatus(order.status) === 'FAILED';
};

/**
 * What to tell the customer about an order that ended, keyed on *who* ended it.
 *
 * Before Phase 3 a dispatch failure and a restaurant cancellation were the same status, so the UI
 * could only say "cancelled". They are now distinct, they mean different things to the customer,
 * and only one of them is the restaurant's doing.
 */
export const terminalHeadline = (status: OrderStatus | undefined): string | null => {
  switch (status) {
    case OrderStatus.CANCELLED:
      return 'This order was cancelled.';
    case OrderStatus.CANCELLED_BY_RESTAURANT:
      return 'The restaurant could not fulfil this order.';
    case OrderStatus.CANCELLED_BY_PLATFORM:
      return 'We could not find a rider for this order, so we cancelled it. This one is on us.';
    case OrderStatus.DELIVERY_FAILED:
      return 'This order could not be delivered.';
    default:
      return null;
  }
};


/* ------------------------------------------------------------------------------------ */
/* Presentation                                                                          */
/* ------------------------------------------------------------------------------------ */

import type { StatusTone } from '@shared/ui';
import { getFriendlyStatusMessage } from './statusMessaging';

/**
 * How an order status is shown. One map, feeding `StatusPill`.
 *
 * The labels come from `getFriendlyStatusMessage`, which already existed and is already the
 * single source of wording — this adds the tone beside it rather than starting a second
 * vocabulary. Phase 3 called for this map and shipped without it; the Phase 4 gate checks the
 * components that consume it.
 *
 * Exhaustive over `OrderStatus` on purpose: a status added on the server becomes a TypeScript
 * error here instead of rendering an untoned pill.
 */
export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  [OrderStatus.CREATED]: 'neutral',
  [OrderStatus.PENDING_ACCEPTANCE]: 'warning',
  [OrderStatus.AWAITING_DELAY_APPROVAL]: 'warning',
  [OrderStatus.ACCEPTED]: 'info',
  [OrderStatus.PREPARING]: 'info',
  [OrderStatus.READY_FOR_PICKUP]: 'info',
  [OrderStatus.HANDED_OVER]: 'live',
  [OrderStatus.CANCELLED]: 'danger',
  [OrderStatus.CANCELLED_BY_RESTAURANT]: 'danger',
  [OrderStatus.CANCELLED_BY_PLATFORM]: 'danger',
  [OrderStatus.DELIVERY_FAILED]: 'danger',
};

export interface OrderStatusView {
  label: string;
  tone: StatusTone;
  /** True only while the order is genuinely moving — drives the pulsing dot on StatusPill. */
  live: boolean;
}

/** The label and tone for one order, delivery status included where it is more specific. */
export function orderStatusView(
  status: OrderStatus,
  deliveryStatus?: DeliveryStatus,
): OrderStatusView {
  const label = getFriendlyStatusMessage(status, deliveryStatus);
  const settled = deliveryStatus === DeliveryStatus.DELIVERED;
  const lifecycle = classifyOrderStatus(status);

  if (settled) return { label, tone: 'success', live: false };
  if (deliveryStatus === DeliveryStatus.FAILED) return { label, tone: 'danger', live: false };

  return {
    label,
    tone: ORDER_STATUS_TONE[status] ?? 'neutral',
    live: lifecycle === 'IN_FLIGHT' && deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY,
  };
}

/**
 * The stages a customer is shown, in order. `Tracking.dc.html` draws Placed / Cooked /
 * Picked up / Delivered; Accepted stays because a restaurant that has not answered is a real
 * state with a real consequence (auto-cancel after 10 minutes), and the customer should be
 * able to see which side of it they are on.
 */
export const ORDER_STAGES = ['Placed', 'Accepted', 'Cooked', 'Picked up', 'Delivered'] as const;
export type OrderStage = (typeof ORDER_STAGES)[number];

/**
 * How many stages are complete, 0–5.
 *
 * Derived from BOTH statuses: an order can be `HANDED_OVER` while its rider is still
 * `AT_RESTAURANT` or merely `ASSIGNED`. The food is cooked in all three, but it has only been
 * picked up once the rider has it -- which the delivery status says, not the order status.
 */
export function completedStages(status: OrderStatus, deliveryStatus?: DeliveryStatus): number {
  if (deliveryStatus === DeliveryStatus.DELIVERED) return 5;
  if (classifyOrderStatus(status) === 'FAILED') return 0;
  if (deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY) return 4;
  if (
    status === OrderStatus.HANDED_OVER &&
    deliveryStatus !== DeliveryStatus.AT_RESTAURANT &&
    deliveryStatus !== DeliveryStatus.ASSIGNED
  ) return 4;
  if (
    status === OrderStatus.READY_FOR_PICKUP ||
    status === OrderStatus.HANDED_OVER ||
    deliveryStatus === DeliveryStatus.AT_RESTAURANT
  ) return 3;
  if (status === OrderStatus.PREPARING || status === OrderStatus.ACCEPTED) return 2;
  return 1;
}
