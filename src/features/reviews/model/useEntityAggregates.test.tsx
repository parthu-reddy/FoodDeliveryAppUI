import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEntityAggregates } from './useEntityAggregates';

const get = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  reviewsApi: {
    review: {
      get: (...args: unknown[]) => get(...args),
      post: (...args: unknown[]) => post(...args),
      getReviews: (...args: unknown[]) => get('/api/v1/reviews', ...args),
      getAggregate: (...args: unknown[]) => get('/api/v1/reviews/aggregate', ...args),
      getAggregates: (...args: unknown[]) => get('/api/v1/reviews/aggregates', ...args),
      getEligibility: (...args: unknown[]) => get('/api/v1/reviews/orders/:orderId/eligibility', ...args),
      createReviews: (...args: unknown[]) => post('/api/v1/reviews', ...args),
      getMyReviews: (...args: unknown[]) => get('/api/v1/reviews/me', ...args)
    },
    adminReview: {
      get: (...args: unknown[]) => get(...args)
    }
  }
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const DISH_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const DISH_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const envelope = (aggregates: unknown[]) => ({
  success: true, message: 'ok', data: { entityType: 'PRODUCT', aggregates },
});

describe('useEntityAggregates', () => {
  beforeEach(() => get.mockReset());

  it('maps the batch response by entity id', async () => {
    get.mockResolvedValue(envelope([
      { entityType: 'PRODUCT', entityId: DISH_A, totalReviews: 7, averageRating: '4.29' },
      { entityType: 'PRODUCT', entityId: DISH_B, totalReviews: 0, averageRating: '0.00' },
    ]));

    const { result } = renderHook(() => useEntityAggregates('PRODUCT', [DISH_A, DISH_B]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.aggregates[DISH_A]).toEqual({ average: 4.29, totalReviews: 7 });
    // Zero-filled rather than absent, so the menu can tell "no reviews" from "not loaded".
    expect(result.current.aggregates[DISH_B]).toEqual({ average: 0, totalReviews: 0 });
  });

  /** averageRating crosses the wire as a string, because it is a BigDecimal on the service side. */
  it('parses the average out of the string the service sends', async () => {
    get.mockResolvedValue(envelope([
      { entityType: 'PRODUCT', entityId: DISH_A, totalReviews: 3, averageRating: '4.33' },
    ]));

    const { result } = renderHook(() => useEntityAggregates('PRODUCT', [DISH_A]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.aggregates[DISH_A].average).toBeCloseTo(4.33);
  });

  it('asks once for a repeated id, and skips blanks', async () => {
    get.mockResolvedValue(envelope([]));

    renderHook(() => useEntityAggregates('PRODUCT', [DISH_A, DISH_A, '', DISH_B]));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    const [, options] = get.mock.calls[0];
    expect(options.queries.entityIds).toEqual([DISH_A, DISH_B].sort());
  });

  /** Re-rendering with the same ids in a different order is the same request, not a new one. */
  it('does not refetch when only the id order changes', async () => {
    get.mockResolvedValue(envelope([]));

    const { rerender } = renderHook(
      ({ ids }) => useEntityAggregates('PRODUCT', ids),
      { initialProps: { ids: [DISH_A, DISH_B] } },
    );
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));

    rerender({ ids: [DISH_B, DISH_A] });

    await new Promise((r) => setTimeout(r, 20));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('asks for nothing when there are no ids', () => {
    const { result } = renderHook(() => useEntityAggregates('PRODUCT', []));

    expect(get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('asks for nothing when disabled', () => {
    renderHook(() => useEntityAggregates('PRODUCT', [DISH_A], false));

    expect(get).not.toHaveBeenCalled();
  });

  /** The server caps the batch at 100; sending more earns a 400 for the whole page. */
  it('never asks for more ids than the server accepts', async () => {
    get.mockResolvedValue(envelope([]));
    const many = Array.from({ length: 150 }, (_, i) => `id-${String(i).padStart(3, '0')}`);

    renderHook(() => useEntityAggregates('PRODUCT', many));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(get.mock.calls[0][1].queries.entityIds).toHaveLength(100);
  });
});
