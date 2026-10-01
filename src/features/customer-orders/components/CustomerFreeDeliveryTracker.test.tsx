import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { MenuItem, Restaurant } from '@/types';
import { CustomerFreeDeliveryTracker } from './CustomerFreeDeliveryTracker';
import { CartState } from '../model/useCustomerCart';

const restaurant = { id: 'restaurant-1', name: 'Threshold Kitchen' } as Restaurant;
const item = { id: 'item-1', name: 'Meal', price: 50 } as MenuItem;
const carts: Record<string, CartState> = {
  'restaurant-1': { restaurant, items: [{ item, quantity: 1 }] },
};

function tracker(subtotal: number, threshold?: number, isQuoting = false) {
  return render(<CustomerFreeDeliveryTracker
    carts={carts}
    selectedRestaurantId="restaurant-1"
    getCartTotal={() => ({ subtotal, minAmountForFreeDelivery: threshold })}
    deliveryPricing={{ total: 0 }}
    isQuoting={isQuoting}
  />);
}

afterEach(cleanup);

describe('free delivery threshold boundaries', () => {
  test('one paisa below the threshold still shows the amount needed', () => {
    tracker(49.99, 50);
    // Rounding the bar to 100 must not unlock delivery before the actual threshold.
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Add ₹0.01 for Free Delivery!')).toBeInTheDocument();
    expect(screen.queryByText('Free Delivery Unlocked! 🎉')).not.toBeInTheDocument();
  });

  test.each([50, 50.01])('at or above the threshold (%s) unlocks delivery', subtotal => {
    tracker(subtotal, 50);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Free Delivery Unlocked! 🎉')).toBeInTheDocument();
    expect(screen.queryByText(/for Free Delivery!/)).not.toBeInTheDocument();
  });

  test('an absent quote threshold shows no invented promotion', () => {
    tracker(49.99);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/Free Delivery/)).not.toBeInTheDocument();
  });

  test('a quote in progress hides stale threshold results', () => {
    tracker(50, 50, true);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('Free Delivery Unlocked! 🎉')).not.toBeInTheDocument();
  });
});
