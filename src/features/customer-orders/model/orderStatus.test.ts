import { describe, expect, test } from 'vitest';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { Order } from '@/types';
import {
  classifyDeliveryStatus,
  classifyOrderStatus,
  completedStages,
  ORDER_STAGES,
  isActiveOrder,
  isFailedOrder,
  terminalHeadline,
} from './orderStatus';

const order = (status: OrderStatus, deliveryStatus?: DeliveryStatus) =>
  ({ status, deliveryStatus } as Partial<Order> as Order);

describe('order status classification', () => {
  test('every OrderStatus the backend declares is classified', () => {
    // Object.values over the generated enum, so a status added on the server and regenerated into
    // backend-enums.ts shows up here. The `never` default makes it a compile error too; this
    // asserts the runtime half, which a type-only guard cannot.
    const values = Object.values(OrderStatus);
    expect(values.length).toBeGreaterThan(0);
    for (const status of values) {
      expect(['IN_FLIGHT', 'SETTLED', 'FAILED']).toContain(classifyOrderStatus(status));
    }
  });

  test('every DeliveryStatus the backend declares is classified', () => {
    for (const status of Object.values(DeliveryStatus)) {
      expect(['IN_FLIGHT', 'SETTLED', 'FAILED']).toContain(classifyDeliveryStatus(status));
    }
  });

  test('the two statuses Phase 3 added are terminal, not active', () => {
    // Before this, isActiveOrder listed the statuses it considered finished and neither of these
    // was on the list, so a platform cancellation and a failed delivery both read as live orders.
    expect(isActiveOrder(order(OrderStatus.CANCELLED_BY_PLATFORM))).toBe(false);
    expect(isFailedOrder(order(OrderStatus.CANCELLED_BY_PLATFORM))).toBe(true);
    expect(isActiveOrder(order(OrderStatus.DELIVERY_FAILED))).toBe(false);
    expect(isFailedOrder(order(OrderStatus.DELIVERY_FAILED))).toBe(true);
  });

  test('an order awaiting delay approval is still active', () => {
    // M-10: the poll gate's hand-listed array omitted this status, so the customer saw the delay
    // prompt on the poll that delivered it and then never received another update.
    expect(isActiveOrder(order(OrderStatus.AWAITING_DELAY_APPROVAL))).toBe(true);
    expect(isFailedOrder(order(OrderStatus.AWAITING_DELAY_APPROVAL))).toBe(false);
  });

  test('a delivered order is finished but not failed', () => {
    const delivered = order(OrderStatus.HANDED_OVER, DeliveryStatus.DELIVERED);
    expect(isActiveOrder(delivered)).toBe(false);
    expect(isFailedOrder(delivered)).toBe(false);
  });

  test('a failed delivery ends the order whatever the order status says', () => {
    const failed = order(OrderStatus.HANDED_OVER, DeliveryStatus.FAILED);
    expect(isActiveOrder(failed)).toBe(false);
    expect(isFailedOrder(failed)).toBe(true);
  });

  test('an in-flight delivery keeps the order active', () => {
    expect(isActiveOrder(order(OrderStatus.HANDED_OVER, DeliveryStatus.OUT_FOR_DELIVERY))).toBe(true);
    expect(isActiveOrder(order(OrderStatus.ACCEPTED, DeliveryStatus.SEARCHING_FOR_DRIVER))).toBe(true);
  });

  test('a status the UI has never heard of keeps polling rather than freezing the tracker', () => {
    // Statuses arrive as strings off the wire. Treating an unknown one as finished is the M-10
    // failure mode; treating it as in flight is recoverable.
    const unknown = order('SOMETHING_NEW' as OrderStatus);
    expect(classifyOrderStatus('SOMETHING_NEW' as OrderStatus)).toBe('IN_FLIGHT');
    expect(isActiveOrder(unknown)).toBe(true);
  });

  test('the terminal copy says who ended the order', () => {
    // A dispatch failure is the platform's fault and a restaurant cancellation is not. They were
    // the same status before Phase 3, so the customer got the same sentence for both.
    expect(terminalHeadline(OrderStatus.CANCELLED_BY_PLATFORM)).toMatch(/rider/i);
    expect(terminalHeadline(OrderStatus.CANCELLED_BY_PLATFORM)).not.toMatch(/restaurant/i);
    expect(terminalHeadline(OrderStatus.CANCELLED_BY_RESTAURANT)).toMatch(/restaurant/i);
    expect(terminalHeadline(OrderStatus.DELIVERY_FAILED)).toMatch(/deliver/i);
    expect(terminalHeadline(OrderStatus.PREPARING)).toBeNull();
  });
});

describe('completedStages -- what the customer timeline shows', () => {
  const cases: [OrderStatus, DeliveryStatus | undefined, number][] = [
    [OrderStatus.PENDING_ACCEPTANCE, undefined, 1],
    [OrderStatus.AWAITING_DELAY_APPROVAL, undefined, 1],
    [OrderStatus.ACCEPTED, undefined, 2],
    [OrderStatus.PREPARING, undefined, 2],
    [OrderStatus.READY_FOR_PICKUP, DeliveryStatus.ASSIGNED, 3],
    // Handed to dispatch but the rider has not collected it: cooked, NOT picked up.
    [OrderStatus.HANDED_OVER, DeliveryStatus.ASSIGNED, 3],
    [OrderStatus.HANDED_OVER, DeliveryStatus.AT_RESTAURANT, 3],
    [OrderStatus.HANDED_OVER, DeliveryStatus.OUT_FOR_DELIVERY, 4],
    [OrderStatus.HANDED_OVER, DeliveryStatus.DELIVERED, 5],
    [OrderStatus.CANCELLED_BY_RESTAURANT, undefined, 0],
  ];
  test.each(cases)('%s / %s -> %i', (status, delivery, expected) => {
    expect(completedStages(status, delivery)).toBe(expected);
  });

  test('never reports more stages than exist', () => {
    for (const s of Object.values(OrderStatus)) {
      for (const d of [undefined, ...Object.values(DeliveryStatus)]) {
        expect(completedStages(s, d)).toBeLessThanOrEqual(ORDER_STAGES.length);
      }
    }
  });
});
