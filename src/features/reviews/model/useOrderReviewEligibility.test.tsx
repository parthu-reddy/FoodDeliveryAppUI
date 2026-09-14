import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderReviewEligibility } from './useOrderReviewEligibility';

const get = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  reviewsApi: {
    review: {
      get: (...args: unknown[]) => get(...args),
      post: (...args: unknown[]) => (typeof post !== 'undefined' ? post : vi.fn())(...args),
      getReviews: (...args: unknown[]) => get('/api/v1/reviews', ...args),
      getAggregate: (...args: unknown[]) => get('/api/v1/reviews/aggregate', ...args),
      getAggregates: (...args: unknown[]) => get('/api/v1/reviews/aggregates', ...args),
      getEligibility: (...args: unknown[]) => get('/api/v1/reviews/orders/:orderId/eligibility', ...args),
      createReviews: (...args: unknown[]) => (typeof post !== 'undefined' ? post : vi.fn())('/api/v1/reviews', ...args),
      getMyReviews: (...args: unknown[]) => get('/api/v1/reviews/me', ...args)
    },
    adminReview: {
      get: (...args: unknown[]) => get(...args)
    }
  }
}));

const ORDER_A = '11111111-1111-1111-1111-111111111111';
const ORDER_B = '22222222-2222-2222-2222-222222222222';

const envelope = (orderId: string, reviewable = true) => ({
  success: true, message: 'ok',
  data: { orderId, reviewable, targets: [], windowClosesAt: '2026-09-24T19:04:11Z' },
});

describe('useOrderReviewEligibility', () => {
  beforeEach(() => get.mockReset());

  it('fetches nothing until it is enabled', () => {
    renderHook(() => useOrderReviewEligibility(ORDER_A, false));

    expect(get).not.toHaveBeenCalled();
  });

  it('loads the eligibility for the order it was given', async () => {
    get.mockResolvedValue(envelope(ORDER_A));

    const { result } = renderHook(() => useOrderReviewEligibility(ORDER_A, true));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.eligibility?.orderId).toBe(ORDER_A);
    expect(result.current.error).toBeNull();
  });

  /** A refusal is data, not an error — `error` is reserved for the request itself failing. */
  it('does not treat a refusal as an error', async () => {
    get.mockResolvedValue(envelope(ORDER_A, false));

    const { result } = renderHook(() => useOrderReviewEligibility(ORDER_A, true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.eligibility?.reviewable).toBe(false);
    expect(result.current.error).toBeNull();
  });

  /**
   * The property the key-derived loading state exists for. Switching orders must never show the
   * previous order's targets under the new order's name, not even for one frame.
   */
  it('reports loading again when the order changes, not the previous order data', async () => {
    get.mockResolvedValueOnce(envelope(ORDER_A)).mockResolvedValueOnce(envelope(ORDER_B));

    const { result, rerender } = renderHook(
      ({ id }) => useOrderReviewEligibility(id, true),
      { initialProps: { id: ORDER_A } },
    );
    await waitFor(() => expect(result.current.eligibility?.orderId).toBe(ORDER_A));

    rerender({ id: ORDER_B });

    // Immediately after the switch there is nothing valid to show.
    expect(result.current.isLoading).toBe(true);
    expect(result.current.eligibility).toBeNull();

    await waitFor(() => expect(result.current.eligibility?.orderId).toBe(ORDER_B));
  });

  it('refetches on demand, which is what the 409 path relies on', async () => {
    get.mockResolvedValue(envelope(ORDER_A));

    const { result } = renderHook(() => useOrderReviewEligibility(ORDER_A, true));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));

    act(() => result.current.refetch());

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it('passes the order id as a path parameter', async () => {
    get.mockResolvedValue(envelope(ORDER_A));

    renderHook(() => useOrderReviewEligibility(ORDER_A, true));

    await waitFor(() => expect(get).toHaveBeenCalled());
    const [path, options] = get.mock.calls[0];
    expect(path).toBe('/api/v1/reviews/orders/:orderId/eligibility');
    expect(options).toEqual({ params: { orderId: ORDER_A } });
  });
});
