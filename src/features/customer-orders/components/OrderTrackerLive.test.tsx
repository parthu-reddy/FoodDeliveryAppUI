import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Order } from '@/types';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { ConfirmProvider } from '@shared/ui';

const post = vi.fn().mockResolvedValue({});
vi.mock('@/lib/zodiosClients', () => ({ customerApi: { order: { post: (...a: unknown[]) => post(...a) } } }));

import { OrderTrackerLive } from './OrderTrackerLive';

const base = {
  id: 'ord-1234567890', restaurantName: 'Paradise Biryani', totalAmount: 646.4, itemTotal: 580,
  deliveryFee: 0, customerPlatformFee: 20, sgst: 23.2, cgst: 23.2, items: [], createdAt: '',
} as unknown as Order;

function renderLive(over: Partial<Order>) {
  const setInternalOrders = vi.fn();
  render(
    <ConfirmProvider>
      <OrderTrackerLive
        currentTrackingOrder={{ ...base, ...over } as Order}
        isFailedOrder={() => false}
        startCall={() => {}}
        setInternalOrders={setInternalOrders}
        setTrackingOrder={() => {}}
        showError={() => {}}
      />
    </ConfirmProvider>,
  );
  return { setInternalOrders };
}

describe('OrderTrackerLive', () => {
  it('does not cancel on a single tap -- it asks first', async () => {
    renderLive({ status: OrderStatus.PENDING_ACCEPTANCE });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Keep order' }));
    // The request would follow the awaited confirm, so wait for the dialog to settle before
    // asserting -- a synchronous check here passed even with the guard deleted.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Keep order' })).not.toBeInTheDocument());
    await new Promise((r) => setTimeout(r, 0));
    expect(post).not.toHaveBeenCalled();
  });

  it('counts down to the food being ready while cooking, and calls it that', () => {
    renderLive({ status: OrderStatus.PREPARING, estimatedCompletionTime: Date.now() + 12 * 60_000 });
    expect(screen.getByText('FOOD READY IN')).toBeInTheDocument();
    expect(screen.queryByText(/ARRIVING/)).not.toBeInTheDocument();
  });

  it('does not reuse the kitchen ready time as an arrival time once the rider has the food', () => {
    renderLive({
      status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.OUT_FOR_DELIVERY,
      estimatedCompletionTime: Date.now() + 5 * 60_000,
    });
    expect(screen.queryByText('FOOD READY IN')).not.toBeInTheDocument();
    expect(screen.getByText('On the way')).toBeInTheDocument();
  });

  it('shows the delivery code only when there is one', () => {
    renderLive({ status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.OUT_FOR_DELIVERY, otp: '4821' } as Partial<Order>);
    expect(screen.getByText('4821')).toBeInTheDocument();
  });

  it('shows the delay the kitchen asked for, with its reason', () => {
    renderLive({ status: OrderStatus.AWAITING_DELAY_APPROVAL, requestedDelayMinutes: 20, delayReason: 'Tandoor is backed up' });
    expect(screen.getByText('The kitchen asked for 20 more minutes')).toBeInTheDocument();
    expect(screen.getByText(/Tandoor is backed up/)).toBeInTheDocument();
  });

  it('falls back to the generic delay prompt when the order carries no request', () => {
    renderLive({ status: OrderStatus.AWAITING_DELAY_APPROVAL });
    expect(screen.getByText('The kitchen needs more time')).toBeInTheDocument();
    expect(screen.queryByText(/asked for/)).not.toBeInTheDocument();
  });

  it('approving a delay sends only the answer -- no invented minutes', async () => {
    post.mockClear();
    renderLive({ status: OrderStatus.AWAITING_DELAY_APPROVAL, requestedDelayMinutes: 20 });
    fireEvent.click(screen.getByRole('button', { name: /ll wait$/ }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    const [path, body] = post.mock.calls[0];
    expect(path).toBe('/api/v1/orders/:orderId/delay-approval');
    expect(body).toEqual({ approved: true });
  });

  it('carries no demo instructions', () => {
    renderLive({ status: OrderStatus.PREPARING });
    expect(screen.queryByText(/switch roles/i)).not.toBeInTheDocument();
  });
});
