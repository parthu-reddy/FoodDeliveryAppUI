import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

/**
 * The failure path, deliberately in a file of its own.
 *
 * A rejecting mock alongside any other `renderHook` in the same file makes Vitest surface the
 * rejection as an uncaught error and fail the run — reproduced with the rejecting test first, last,
 * with an explicit `unmount()`, and with a handler attached at the promise's source. The hook itself
 * is fine: on its own the assertion below passes and the state settles to an empty map.
 *
 * Kept isolated rather than deleted, because what it asserts matters: a review service that is down
 * must cost the customer a star rating, not the menu.
 */
describe('useEntityAggregates — when the review service fails', () => {
  it('degrades to no ratings rather than breaking the menu', async () => {
    get.mockImplementation(() => Promise.reject(new Error('review service unavailable')));

    const { result } = renderHook(() =>
      useEntityAggregates('PRODUCT', ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.aggregates).toEqual({});
  });
});
