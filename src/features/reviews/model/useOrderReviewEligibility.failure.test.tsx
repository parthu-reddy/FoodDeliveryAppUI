import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOrderReviewEligibility } from './useOrderReviewEligibility';

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

/**
 * The transport-failure path, isolated for the same reason as
 * `useEntityAggregates.failure.test.tsx`: a rejecting mock beside any other `renderHook` in the same
 * file makes Vitest surface the rejection as an uncaught error, and it also poisons the test that
 * runs next. Verified independent of ordering, of `unmount()`, and of attaching a handler at the
 * promise's source.
 *
 * What it asserts is the point of the hook's error handling: a review service that cannot be reached
 * must say so, because a silently empty sheet is indistinguishable from "nothing to review" — the
 * failure mode that `validate_gateway_reachability.py` exists because of.
 */
describe('useOrderReviewEligibility — when the request itself fails', () => {
  it('surfaces the failure instead of rendering an empty sheet', async () => {
    get.mockImplementation(() => Promise.reject(new Error('network down')));

    const { result } = renderHook(() =>
      useOrderReviewEligibility('11111111-1111-1111-1111-111111111111', true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.eligibility).toBeNull();
  });
});
