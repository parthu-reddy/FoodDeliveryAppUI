import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Restaurant } from '@/types';
vi.mock('@features/reviews', () => ({
  InlineRating: () => null, toAverage: () => 0,
  useEntityAggregate: () => ({ aggregate: null, isLoading: false, error: null }),
  useEntityAggregates: () => ({ aggregates: {} }),
}));
vi.mock('@features/reviews/components/ReviewsPanel', () => ({ ReviewsPanel: () => null }));
import { CustomerMenuView } from './CustomerMenuView';
const props = {
  selectedRestaurant: { id: 'outlet', name: 'Test Kitchen' } as Restaurant,
  setSelectedRestaurant: vi.fn(), getCartTotal: () => ({ subtotal: 0 }),
  isDeliveryAvailable: true, brandOutlets: [], setIsOutletSelectorOpen: vi.fn(),
  isMenuLoading: false, effectiveMenu: [], carts: {}, addToCart: vi.fn(), removeFromCart: vi.fn(),
  deliveryAddressId: 'home',
};
describe('customer menu failure and empty presentation', () => {
  it('offers an explicit retry for a failed catalog', async () => {
    const retry = vi.fn();
    render(<CustomerMenuView {...props} menuError="failure" onRetryMenu={retry} />);
    await waitFor(() => expect(screen.getByText("Couldn't load menu")).toBeVisible());
    expect(screen.queryByText('Menu unavailable')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
  it('shows a successful empty catalog without an outage retry', async () => {
    render(<CustomerMenuView {...props} />);
    await waitFor(() => expect(screen.getByText('Menu unavailable')).toBeVisible());
    expect(screen.queryByText("Couldn't load menu")).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
  it('shows loading without briefly claiming an empty menu', () => {
    render(<CustomerMenuView {...props} isMenuLoading />);
    expect(screen.queryByText('Menu unavailable')).not.toBeInTheDocument();
    expect(screen.queryByText("Couldn't load menu")).not.toBeInTheDocument();
  });
});
