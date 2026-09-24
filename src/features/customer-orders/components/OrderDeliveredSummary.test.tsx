import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { Order } from '@/types';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';

vi.mock('@/lib/zodiosClients', () => ({ customerApi: { customerMoney: { get: vi.fn() } } }));

import { OrderDeliveredSummary } from './OrderDeliveredSummary';

const base = {
  id: 'ord-12345678', restaurantName: 'Paradise', totalAmount: 644, itemTotal: 580, deliveryFee: 30,
  customerPlatformFee: 5, sgst: 14.5, cgst: 14.5, items: [], createdAt: '',
} as unknown as Order;

function renderSummary(over: Partial<Order>) {
  render(<OrderDeliveredSummary order={{ ...base, ...over } as Order} onBack={() => {}} chatWidgetRef={createRef()} />);
}

describe('OrderDeliveredSummary', () => {
  it('offers the tax invoice once the order is delivered', () => {
    renderSummary({ status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.DELIVERED });
    expect(screen.getByRole('button', { name: /Tax invoice/ })).toBeInTheDocument();
  });

  it('offers none for an order that was not delivered', () => {
    renderSummary({ status: OrderStatus.CANCELLED });
    expect(screen.queryByRole('button', { name: /Tax invoice/ })).not.toBeInTheDocument();
  });
});
