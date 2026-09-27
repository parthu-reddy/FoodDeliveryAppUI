import { describe, expect, it } from 'vitest';
import { DeliveryStatus, Order, OrderStatus } from '@/types';
import { applyConfirmedProgress, recordConfirmedProgress } from './confirmedProgress';

const order = (deliveryStatus: DeliveryStatus, status: OrderStatus = OrderStatus.PREPARING) =>
  ({ id: 'o-1', status, deliveryStatus } as Order);

describe('applyConfirmedProgress', () => {
  it('keeps a confirmed pickup when a poll still has the rider at the restaurant', () => {
    const confirmed = new Map([['o-1', DeliveryStatus.OUT_FOR_DELIVERY]]);
    const [o] = applyConfirmedProgress([order(DeliveryStatus.AT_RESTAURANT)], confirmed);
    expect(o.deliveryStatus).toBe(DeliveryStatus.OUT_FOR_DELIVERY);
    expect(confirmed.has('o-1')).toBe(true);
  });

  it('keeps a confirmed delivery when a poll still lists the order as out for delivery', () => {
    const confirmed = new Map([['o-1', DeliveryStatus.DELIVERED]]);
    const [o] = applyConfirmedProgress([order(DeliveryStatus.OUT_FOR_DELIVERY)], confirmed);
    expect(o.deliveryStatus).toBe(DeliveryStatus.DELIVERED);
  });

  it('hands back to the server once it has caught up', () => {
    const confirmed = new Map([['o-1', DeliveryStatus.OUT_FOR_DELIVERY]]);
    const [o] = applyConfirmedProgress([order(DeliveryStatus.OUT_FOR_DELIVERY)], confirmed);
    expect(o.deliveryStatus).toBe(DeliveryStatus.OUT_FOR_DELIVERY);
    expect(confirmed.size).toBe(0);
  });

  it('lets a cancellation win over anything the rider confirmed', () => {
    const confirmed = new Map([['o-1', DeliveryStatus.OUT_FOR_DELIVERY]]);
    const [o] = applyConfirmedProgress([order(DeliveryStatus.AT_RESTAURANT, OrderStatus.CANCELLED_BY_RESTAURANT)], confirmed);
    expect(o.deliveryStatus).toBe(DeliveryStatus.AT_RESTAURANT);
    expect(confirmed.size).toBe(0);
  });

  it('forgets orders that have left the list', () => {
    const confirmed = new Map([['gone', DeliveryStatus.DELIVERED]]);
    applyConfirmedProgress([order(DeliveryStatus.AT_RESTAURANT)], confirmed);
    expect(confirmed.has('gone')).toBe(false);
  });
});

describe('recordConfirmedProgress', () => {
  it('records a step and forgets it on a revert that carries none', () => {
    const confirmed = new Map<string, DeliveryStatus>();
    recordConfirmedProgress(confirmed, 'o-1', DeliveryStatus.OUT_FOR_DELIVERY);
    expect(confirmed.get('o-1')).toBe(DeliveryStatus.OUT_FOR_DELIVERY);
    recordConfirmedProgress(confirmed, 'o-1', undefined);
    expect(confirmed.has('o-1')).toBe(false);
  });
});
