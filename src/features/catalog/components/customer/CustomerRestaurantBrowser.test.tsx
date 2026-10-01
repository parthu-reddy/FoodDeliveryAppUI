import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
const suggestion = vi.hoisted(() => ({ orderId: 'old-order', restaurantId: 'older-outlet', restaurantName: 'Previous kitchen', headline: 'Dosa', extraItems: 0, total: 75, ago: 'today' }));
vi.mock('@features/customer-orders/model/useReorderSuggestions', () => ({ useReorderSuggestions: () => ({ suggestions: [suggestion] }) }));
import { CustomerRestaurantBrowser } from './CustomerRestaurantBrowser';
test('routes the owned reorder suggestion to validation even when its outlet is absent from the nearby feed', () => {
  const onReorder = vi.fn(); const select = vi.fn();
  render(<CustomerRestaurantBrowser restaurants={[]} isRestaurantsLoading={false} setIsAddressSelectorOpen={vi.fn()} setSelectedRestaurant={select} onReorder={onReorder} />);
  fireEvent.click(screen.getByRole('button', { name: /Order Dosa from Previous kitchen again/ }));
  expect(onReorder).toHaveBeenCalledExactlyOnceWith(suggestion);
  expect(select).not.toHaveBeenCalled();
});
test('blocks additional reorder clicks while a current validation is pending', () => {
  const onReorder = vi.fn();
  render(<CustomerRestaurantBrowser restaurants={[]} isRestaurantsLoading={false} setIsAddressSelectorOpen={vi.fn()} setSelectedRestaurant={vi.fn()} onReorder={onReorder} pendingReorderId={suggestion.orderId} />);
  const button = screen.getByRole('button', { name: /Order Dosa/ });
  expect(button).toBeDisabled(); expect(button).toHaveAttribute('aria-busy', 'true');
  fireEvent.click(button); expect(onReorder).not.toHaveBeenCalled();
});
