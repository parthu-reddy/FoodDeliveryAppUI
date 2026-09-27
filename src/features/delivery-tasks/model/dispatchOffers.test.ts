import { afterEach, describe, expect, it, vi } from 'vitest';
import { Order, OrderStatus } from '@/types';
import { isAvailableDispatch } from './dispatchOffers';

const offer = (overrides: Partial<Order> = {}) => ({
  id: 'test-order', status: OrderStatus.PREPARING, remainingPingSeconds: 60,
  ...overrides,
} as Order);
const rejected = new Set<string>();

afterEach(() => vi.useRealTimers());

describe('actionable dispatch offers', () => {
  it('removes a timed-out or declined offer from both presentation choices', () => {
    expect(isAvailableDispatch(offer(), rejected)).toBe(true);
    expect(isAvailableDispatch(offer(), new Set(['test-order']))).toBe(false);
    expect(isAvailableDispatch(offer({ remainingPingSeconds: 0 }), rejected)).toBe(false);
  });

  it('uses the absolute deadline even when the last poll had positive seconds remaining', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-27T10:00:00Z'));
    const job = offer({ expiresAt: new Date('2026-09-27T10:00:02Z').getTime() });
    expect(isAvailableDispatch(job, rejected)).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(isAvailableDispatch(job, rejected)).toBe(false);
  });

  it('does not offer assigned, cancelled, or expiry-less orders', () => {
    expect(isAvailableDispatch(offer({ deliveryExecutiveId: 'rider' }), rejected)).toBe(false);
    expect(isAvailableDispatch(offer({ status: OrderStatus.CANCELLED }), rejected)).toBe(false);
    expect(isAvailableDispatch(offer({ remainingPingSeconds: undefined }), rejected)).toBe(false);
  });

  it('skips an expired first offer so a subsequent live dispatch can open', () => {
    const jobs = [offer({ remainingPingSeconds: 0 }), offer({ id: 'live' })];
    expect(jobs.find(job => isAvailableDispatch(job, rejected))?.id).toBe('live');
  });
});
