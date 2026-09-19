import { describe, expect, it } from 'vitest';
import type { Order } from '@/types';
import { relativeAgo, toSuggestions } from './useReorderSuggestions';

const NOW = new Date('2026-09-19T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const order = (o: Partial<Order> & { id: string }): Order =>
  ({
    restaurantId: 'r1',
    restaurantName: 'Paradise Biryani',
    deliveryStatus: 'DELIVERED',
    totalAmount: 486,
    createdAt: daysAgo(3),
    items: [{ id: 'i1', menuItemId: 'm1', name: 'Chicken Dum Biryani', quantity: 2, price: 249 }],
    ...o,
  }) as unknown as Order;

describe('relativeAgo', () => {
  it('uses the artboard phrasing', () => {
    expect(relativeAgo(daysAgo(0), NOW)).toBe('today');
    expect(relativeAgo(daysAgo(1), NOW)).toBe('yesterday');
    expect(relativeAgo(daysAgo(3), NOW)).toBe('3 days ago');
    expect(relativeAgo(daysAgo(9), NOW)).toBe('last week');
    expect(relativeAgo(daysAgo(21), NOW)).toBe('3 weeks ago');
  });

  it('returns empty rather than NaN for an unparseable date', () => {
    expect(relativeAgo('not-a-date', NOW)).toBe('');
  });
});

describe('toSuggestions', () => {
  it('keeps only the most recent completed order per restaurant', () => {
    const out = toSuggestions(
      [
        order({ id: 'old', createdAt: daysAgo(20) }),
        order({ id: 'new', createdAt: daysAgo(2) }),
        order({ id: 'other', restaurantId: 'r2', restaurantName: 'Napoli', createdAt: daysAgo(9) }),
      ],
      6,
      NOW
    );
    // One card per restaurant -- five biryanis from one outlet is one suggestion.
    expect(out.map((s) => s.orderId)).toEqual(['new', 'other']);
    expect(out[0].ago).toBe('2 days ago');
    expect(out[1].restaurantName).toBe('Napoli');
  });

  it('excludes orders that did not complete', () => {
    const out = toSuggestions(
      [
        order({ id: 'cancelled', deliveryStatus: 'CANCELLED' } as Partial<Order> & { id: string }),
        order({ id: 'failed', restaurantId: 'r2', deliveryStatus: 'FAILED' } as Partial<Order> & { id: string }),
      ],
      6,
      NOW
    );
    expect(out).toEqual([]);
  });

  it('names the order by its largest line, and counts the rest', () => {
    const out = toSuggestions(
      [
        order({
          id: 'multi',
          items: [
            { id: 'a', menuItemId: 'ma', name: 'Raita', quantity: 1, price: 45 },
            { id: 'b', menuItemId: 'mb', name: 'Chicken Dum Biryani', quantity: 3, price: 249 },
            { id: 'c', menuItemId: 'mc', name: 'Coke', quantity: 1, price: 40 },
          ],
        } as Partial<Order> & { id: string }),
      ],
      6,
      NOW
    );
    expect(out[0].headline).toBe('Chicken Dum Biryani');
    expect(out[0].extraItems).toBe(2);
  });

  it('skips an order with no items rather than rendering an unnamed card', () => {
    expect(toSuggestions([order({ id: 'empty', items: [] } as Partial<Order> & { id: string })], 6, NOW)).toEqual([]);
  });

  it('honours the limit', () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      order({ id: `o${i}`, restaurantId: `r${i}`, createdAt: daysAgo(i + 1) })
    );
    expect(toSuggestions(many, 6, NOW)).toHaveLength(6);
  });

  it('returns nothing for a customer with no history, so the section disappears', () => {
    expect(toSuggestions([], 6, NOW)).toEqual([]);
  });
});
