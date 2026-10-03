import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { Order } from '@/types';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';

vi.mock('@/lib/zodiosClients', () => ({ customerApi: { customerMoney: { get: vi.fn() } } }));

import { customerApi } from '@/lib/zodiosClients';
import { OrderDeliveredSummary } from './OrderDeliveredSummary';

const base = {
  id: 'ord-12345678', restaurantName: 'Paradise', totalAmount: 644, itemTotal: 580, deliveryFee: 30,
  customerPlatformFee: 5, sgst: 14.5, cgst: 14.5, items: [], createdAt: '',
} as unknown as Order;

function renderSummary(over: Partial<Order>) {
  render(<OrderDeliveredSummary order={{ ...base, ...over } as Order} onBack={() => {}} chatWidgetRef={createRef()} />);
}

describe('OrderDeliveredSummary', () => {
  beforeEach(() => vi.mocked(customerApi.customerMoney.get).mockResolvedValue([]));
  it('offers the tax invoice once the order is delivered', () => {
    renderSummary({ status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.DELIVERED });
    expect(screen.getByRole('button', { name: /Tax invoice/ })).toBeInTheDocument();
  });

  it('offers none for an order that was not delivered', () => {
    renderSummary({ status: OrderStatus.CANCELLED });
    expect(screen.queryByRole('button', { name: /Tax invoice/ })).not.toBeInTheDocument();
  });
  it('offers "Something wrong with this order?" while the order chat is offered', () => {
    renderSummary({ status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.DELIVERED,
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() });
    expect(screen.getByRole('button', { name: 'Something wrong with this order?' })).toBeInTheDocument();
  });

  it('hides it once the chat it opens is gone, instead of a button that does nothing', () => {
    renderSummary({ status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.DELIVERED,
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() });
    expect(screen.queryByRole('button', { name: 'Something wrong with this order?' })).not.toBeInTheDocument();
  });

  it('shows a delivered order refund independently of its delivery status', async () => {
    vi.mocked(customerApi.customerMoney.get).mockResolvedValue([{ id: 'refund-1', orderId: base.id,
      amount: 90, status: 'PROCESSING', destination: 'ORIGINAL_METHOD' }]);
    renderSummary({ status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.DELIVERED });
    expect(await screen.findByTestId('refund-state')).toHaveTextContent('Refund pending to your original payment method');
    expect(screen.getByRole('heading', { name: 'Order delivered' })).toBeInTheDocument();
    expect(customerApi.customerMoney.get).toHaveBeenCalledWith('/api/v1/money/customer/orders/:orderId/refunds', { params: { orderId: base.id } });
  });

});
