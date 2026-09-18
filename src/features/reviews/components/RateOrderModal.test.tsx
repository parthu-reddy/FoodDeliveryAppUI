import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import RateOrderModal from './RateOrderModal';
import type { ReviewEligibility } from '../model/types';

const get = vi.fn();
const post = vi.fn();

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

const ORDER_ID = '55555555-5555-5555-5555-555555555555';
const OUTLET_ID = '66666666-6666-6666-6666-666666666666';
const DRIVER_ID = '77777777-7777-7777-7777-777777777777';

function eligibility(overrides: Partial<ReviewEligibility> = {}): ReviewEligibility {
  return {
    orderId: ORDER_ID,
    reviewable: true,
    windowClosesAt: '2026-09-24T19:04:11Z',
    targets: [
      {
        entityType: 'RESTAURANT', entityId: OUTLET_ID, displayName: 'Bombay Canteen',
        alreadyReviewed: false,
      },
      {
        entityType: 'DRIVER', entityId: DRIVER_ID, displayName: 'Delivery partner',
        alreadyReviewed: false,
      },
    ],
    ...overrides,
  };
}

/** The shape the zodios client returns: the ApiResponse envelope, unwrapped by the caller. */
const envelope = (data: unknown) => ({ success: true, message: 'ok', data });

/** An axios-shaped rejection carrying the errorCode the sheet branches on. */
const apiError = (status: number, errorCode?: string) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data: { success: false, message: 'nope', errorCode } },
  });

describe('RateOrderModal', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    get.mockResolvedValue(envelope(eligibility()));
  });

  it('lists every target the order offers', async () => {
    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);

    expect(await screen.findByText('Bombay Canteen')).toBeInTheDocument();
    expect(screen.getByText('Delivery partner')).toBeInTheDocument();
  });

  it('will not submit until something has actually been rated', async () => {
    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);
    await screen.findByText('Bombay Canteen');

    const submit = screen.getByRole('button', { name: /pick a rating to continue/i });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getAllByLabelText('5 stars')[0]);

    expect(await screen.findByRole('button', { name: /submit 1 review/i })).toBeEnabled();
  });

  /** Only what the customer rated is sent — an untouched target is not a silent 1-star. */
  it('sends only the targets that were rated', async () => {
    post.mockResolvedValue(envelope([]));
    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);
    await screen.findByText('Bombay Canteen');

    fireEvent.click(screen.getAllByLabelText('4 stars')[0]);
    fireEvent.click(await screen.findByRole('button', { name: /submit 1 review/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, body] = post.mock.calls[0];
    expect(path).toBe('/api/v1/reviews');
    expect(body).toEqual({
      orderId: ORDER_ID,
      entries: [{ entityType: 'RESTAURANT', entityId: OUTLET_ID, rating: 4, comment: undefined }],
    });
  });

  it('confirms in a way that says the review is final', async () => {
    post.mockResolvedValue(envelope([]));
    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);
    await screen.findByText('Bombay Canteen');

    fireEvent.click(screen.getAllByLabelText('5 stars')[0]);
    fireEvent.click(await screen.findByRole('button', { name: /submit 1 review/i }));

    expect(await screen.findByText(/thanks for that/i)).toBeInTheDocument();
    expect(screen.getByText(/can't be changed once submitted/i)).toBeInTheDocument();
  });

  /**
   * The subtle one. A 409 ALREADY_REVIEWED means another tab submitted first — which is the outcome
   * the customer wanted. Showing a red banner for a review that was in fact recorded would be the
   * wrong answer to the right event.
   */
  it('treats an already-reviewed conflict as a refresh, not an error', async () => {
    post.mockRejectedValue(apiError(409, 'ALREADY_REVIEWED'));
    get.mockResolvedValueOnce(envelope(eligibility()))
       .mockResolvedValue(envelope(eligibility({
         targets: [{
           entityType: 'RESTAURANT', entityId: OUTLET_ID, displayName: 'Bombay Canteen',
           alreadyReviewed: true, existingRating: 5, existingComment: 'Great',
           existingReviewedAt: '2026-09-11T10:15:30Z',
         }],
       })));

    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);
    await screen.findByText('Bombay Canteen');
    fireEvent.click(screen.getAllByLabelText('5 stars')[0]);
    fireEvent.click(await screen.findByRole('button', { name: /submit 1 review/i }));

    // It refetches and shows what was already said.
    expect(await screen.findByText(/already reviewed/i)).toBeInTheDocument();
    expect(screen.getByText(/Great/)).toBeInTheDocument();
    expect(screen.queryByText(/could not submit/i)).not.toBeInTheDocument();
  });

  it('surfaces a genuine failure instead of swallowing it', async () => {
    post.mockRejectedValue(apiError(500));
    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);
    await screen.findByText('Bombay Canteen');

    fireEvent.click(screen.getAllByLabelText('3 stars')[0]);
    fireEvent.click(await screen.findByRole('button', { name: /submit 1 review/i }));

    expect(await screen.findByText(/nope|could not submit/i)).toBeInTheDocument();
  });

  /** A refusal is explained, not hidden behind an empty sheet. */
  it('explains why an order cannot be reviewed', async () => {
    get.mockResolvedValue(envelope(eligibility({
      reviewable: false, reason: 'REVIEW_WINDOW_CLOSED', targets: [],
    })));

    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);

    expect(await screen.findByText(/review window for this order has closed/i)).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  /** Already-reviewed targets are shown with what was said, not hidden. */
  it('shows a previously submitted review read-only', async () => {
    get.mockResolvedValue(envelope(eligibility({
      targets: [{
        entityType: 'RESTAURANT', entityId: OUTLET_ID, displayName: 'Bombay Canteen',
        alreadyReviewed: true, existingRating: 4, existingComment: 'Quick and hot',
        existingReviewedAt: '2026-09-11T10:15:30Z',
      }],
    })));

    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);

    expect(await screen.findByText(/already reviewed/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick and hot/)).toBeInTheDocument();
    // Nothing to submit, so the sheet offers only a way out.
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('reports a transport failure with a way to retry', async () => {
    get.mockRejectedValue(apiError(503));

    render(<RateOrderModal isOpen onClose={() => {}} orderId={ORDER_ID} />);

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('asks for nothing while closed', () => {
    render(<RateOrderModal isOpen={false} onClose={() => {}} orderId={ORDER_ID} />);

    expect(get).not.toHaveBeenCalled();
  });
});
