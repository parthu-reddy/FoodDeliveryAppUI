import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Order } from '@/types';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { isActiveOrder as active } from '../model/orderStatus';
import CustomerActiveOrdersCarousel from './CustomerActiveOrdersCarousel';
const first = { id: '11111111-1111-4111-8111-111111111111', restaurantName: 'Same outlet', status: OrderStatus.PREPARING } as Order;
const second = { ...first, id: '22222222-2222-4222-8222-222222222222', status: OrderStatus.READY_FOR_PICKUP };
const completed = { ...first, id: '33333333-3333-4333-8333-333333333333', status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.DELIVERED };
describe('active-order carousel', () => {
  it('shows each in-flight identity and chooses the exact order even from the same outlet', () => {
    const select = vi.fn();
    render(<CustomerActiveOrdersCarousel activeOrders={[first, second, completed]} isActiveOrder={active} trackingOrder={null} cartLength={0} setTrackingOrder={select} />);
    const list = screen.getByRole('list', { name: 'Active orders' });
    const cards = within(list).getAllByRole('button', { name: 'Track your order from Same outlet' });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute('data-order-id', second.id);
    expect(cards[1]).toHaveAttribute('data-order-id', first.id);
    expect(cards[0]).toHaveTextContent('Ready for Pickup');
    fireEvent.click(cards[1]); expect(select).toHaveBeenCalledExactlyOnceWith(first);
  });
  it('hides when an order is selected', () => {
    render(<CustomerActiveOrdersCarousel activeOrders={[first]} isActiveOrder={active} trackingOrder={first} cartLength={0} setTrackingOrder={vi.fn()} />);
    expect(screen.queryByRole('list', { name: 'Active orders' })).not.toBeInTheDocument();
  });
  it('hides when every order is complete', () => {
    render(<CustomerActiveOrdersCarousel activeOrders={[completed]} isActiveOrder={active} trackingOrder={null} cartLength={0} setTrackingOrder={vi.fn()} />);
    expect(screen.queryByRole('list', { name: 'Active orders' })).not.toBeInTheDocument();
  });
});
