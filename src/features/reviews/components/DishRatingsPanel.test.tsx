import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { DishRatingsPanel } from './DishRatingsPanel';

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
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const BIRYANI = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const NAAN = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const KULFI = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const DISHES = [
  { id: BIRYANI, name: 'Biryani' },
  { id: NAAN, name: 'Naan' },
  { id: KULFI, name: 'Kulfi' },
];

const envelope = (aggregates: unknown[]) => ({
  success: true, message: 'ok', data: { entityType: 'PRODUCT', aggregates },
});

describe('DishRatingsPanel', () => {
  beforeEach(() => get.mockReset());

  /** The whole point of the panel: the kitchen sees what to look at first. */
  it('puts the worst-rated dish at the top', async () => {
    get.mockResolvedValue(envelope([
      { entityId: BIRYANI, totalReviews: 12, averageRating: '2.10' },
      { entityId: NAAN, totalReviews: 30, averageRating: '4.80' },
      { entityId: KULFI, totalReviews: 4, averageRating: '3.50' },
    ]));

    render(<DishRatingsPanel dishes={DISHES} />);

    await waitFor(() => expect(screen.getByText('Biryani')).toBeInTheDocument());
    const rows = screen.getAllByText(/Biryani|Naan|Kulfi/);
    expect(rows.map((r) => r.textContent)).toEqual(['Biryani', 'Kulfi', 'Naan']);
  });

  /** An unrated dish is unknown, not bad — it must not lead the list. */
  it('sorts unrated dishes last rather than treating them as zero', async () => {
    get.mockResolvedValue(envelope([
      { entityId: BIRYANI, totalReviews: 0, averageRating: '0.00' },
      { entityId: NAAN, totalReviews: 5, averageRating: '3.00' },
    ]));

    render(<DishRatingsPanel dishes={[{ id: BIRYANI, name: 'Biryani' }, { id: NAAN, name: 'Naan' }]} />);

    await waitFor(() => expect(screen.getByText('Naan')).toBeInTheDocument());
    const rows = screen.getAllByText(/Biryani|Naan/);
    expect(rows.map((r) => r.textContent)).toEqual(['Naan', 'Biryani']);
    expect(screen.getByText('Not rated yet')).toBeInTheDocument();
  });

  it('shows the average and the count for a rated dish', async () => {
    get.mockResolvedValue(envelope([
      { entityId: BIRYANI, totalReviews: 12, averageRating: '2.10' },
    ]));

    render(<DishRatingsPanel dishes={[{ id: BIRYANI, name: 'Biryani' }]} />);

    await waitFor(() => expect(screen.getByText(/2\.1/)).toBeInTheDocument());
    expect(screen.getByText(/\(12\)/)).toBeInTheDocument();
  });

  it('says how much of the menu has been rated', async () => {
    get.mockResolvedValue(envelope([
      { entityId: BIRYANI, totalReviews: 12, averageRating: '2.10' },
      { entityId: NAAN, totalReviews: 0, averageRating: '0.00' },
      { entityId: KULFI, totalReviews: 0, averageRating: '0.00' },
    ]));

    render(<DishRatingsPanel dishes={DISHES} />);

    expect(await screen.findByText(/1 of 3 dishes rated/i)).toBeInTheDocument();
  });

  it('asks for ratings in one request for the whole menu', async () => {
    get.mockResolvedValue(envelope([]));

    render(<DishRatingsPanel dishes={DISHES} />);

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(get.mock.calls[0][1].queries.entityIds).toHaveLength(3);
  });

  it('says so plainly when the outlet has no menu', () => {
    render(<DishRatingsPanel dishes={[]} />);

    expect(screen.getByText(/no dishes yet/i)).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });
});
