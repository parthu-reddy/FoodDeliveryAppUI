import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Order } from '@/types';

vi.mock('@/lib/zodiosClients', () => ({
  restaurantApi: { fulfillment: { get: vi.fn().mockResolvedValue({ data: {} }) } },
  customerApi: {},
}));

import { RestaurantOrderDrawers } from './RestaurantOrderDrawers';

const order = { id: 'o1', status: 'PENDING_ACCEPTANCE', items: [] } as unknown as Order;

function cancelDrawer(cancelReason: string) {
  const submitCancel = vi.fn();
  render(
    <RestaurantOrderDrawers
      order={order}
      activeModal="cancel"
      setActiveModal={vi.fn()}
      showDetails={false}
      setShowDetails={vi.fn()}
      cancelReason={cancelReason}
      setCancelReason={vi.fn()}
      submitCancel={submitCancel}
    />,
  );
  return { submitCancel, confirm: screen.getByRole('button', { name: 'Confirm Cancel' }) };
}

// REST-ACCEPT-11: rejecting or cancelling ends the customer's order, and the customer's cancelled
// screen shows the restaurant's reason. It could be sent blank.
describe('RestaurantOrderDrawers -- cancel', () => {
  it('will not cancel without a reason', () => {
    const { confirm, submitCancel } = cancelDrawer('');
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(submitCancel).not.toHaveBeenCalled();
  });

  it('treats whitespace as no reason', () => {
    expect(cancelDrawer('   ').confirm).toBeDisabled();
  });

  it('cancels once there is a reason', () => {
    const { confirm, submitCancel } = cancelDrawer('Out of paneer');
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(submitCancel).toHaveBeenCalledTimes(1);
  });

  it('says the reason is required', () => {
    cancelDrawer('');
    expect(screen.getByLabelText(/Reason for cancellation/)).toBeRequired();
  });
});
