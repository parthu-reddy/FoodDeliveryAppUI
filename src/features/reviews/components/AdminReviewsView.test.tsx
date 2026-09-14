import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { AdminReviewsView } from './AdminReviewsView';

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

const USER_ID = '99999999-9999-9999-9999-999999999999';
const ORDER_ID = '88888888-8888-8888-8888-888888888888';
const OUTLET_ID = '77777777-7777-7777-7777-777777777777';

const review = {
  id: '11111111-1111-1111-1111-111111111111',
  entityType: 'RESTAURANT' as const,
  entityId: OUTLET_ID,
  orderId: ORDER_ID,
  userId: USER_ID,
  authorDisplayName: 'Priya R.',
  rating: 1,
  comment: 'Cold and late',
  createdAt: '2026-09-11T10:15:30Z',
};

const envelope = (content: unknown[]) => ({ success: true, message: 'ok', data: { content } });

describe('AdminReviewsView', () => {
  beforeEach(() => get.mockReset());

  it('asks for nothing until an id is supplied', () => {
    render(<AdminReviewsView />);

    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
    expect(get).not.toHaveBeenCalled();
  });

  /** The reason this screen exists: it is the only one that shows the author and the order. */
  it('shows the author and the order a review came from', async () => {
    get.mockResolvedValue(envelope([review]));
    render(<AdminReviewsView />);

    fireEvent.change(screen.getByLabelText('Entity ID'),
      { target: { value: OUTLET_ID } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => expect(screen.getByText(/Cold and late/)).toBeInTheDocument());
    expect(screen.getByText(new RegExp(USER_ID))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(ORDER_ID))).toBeInTheDocument();
  });

  it('looks an author up by id when asked to', async () => {
    get.mockResolvedValue(envelope([review]));
    render(<AdminReviewsView />);

    fireEvent.change(screen.getByRole('combobox', { name: /look up by/i }),
      { target: { value: 'user' } });
    fireEvent.change(await screen.findByLabelText('Author user ID'), { target: { value: USER_ID } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => expect(get).toHaveBeenCalled());
    const [path, options] = get.mock.calls[0];
    expect(path).toBe('/api/v1/internal/admin/reviews/by-user/:userId');
    expect(options.params).toEqual({ userId: USER_ID });
  });

  it('says plainly when nothing was found', async () => {
    get.mockResolvedValue(envelope([]));
    render(<AdminReviewsView />);

    fireEvent.change(screen.getByLabelText('Entity ID'),
      { target: { value: OUTLET_ID } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText(/no reviews found/i)).toBeInTheDocument();
  });

  /** No hide, no delete — a review is immutable and an admin quietly removing one is a different product. */
  it('offers no way to change or remove a review', async () => {
    get.mockResolvedValue(envelope([review]));
    render(<AdminReviewsView />);

    fireEvent.change(screen.getByLabelText('Entity ID'),
      { target: { value: OUTLET_ID } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => expect(screen.getByText(/Cold and late/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /delete|hide|remove|edit/i })).not.toBeInTheDocument();
  });
});
