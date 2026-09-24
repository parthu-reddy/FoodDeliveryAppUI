import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Order } from '@/types';
import { OrderStatus } from '@/types';

const post = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  restaurantApi: { fulfillment: { post: (...a: unknown[]) => post(...a), get: vi.fn().mockResolvedValue({ data: [] }) } },
  customerApi: { restaurantMoney: { fetchActiveRefundRequests: vi.fn().mockResolvedValue([]) } },
}));
// Polling is not under test here; keep it from firing.
vi.mock('@/hooks/usePolling', () => ({ usePolling: () => ({}) }));

import { useRestaurantOrders } from './useRestaurantOrders';

const order = { id: 'o1', status: OrderStatus.PENDING_ACCEPTANCE } as unknown as Order;

function setup() {
  const showError = vi.fn();
  const hook = renderHook(() => useRestaurantOrders({ restaurantId: 'r1', showError }));
  act(() => hook.result.current.setInternalOrders([order]));
  return { hook, showError };
}

describe('useRestaurantOrders -- optimistic status', () => {
  beforeEach(() => { post.mockReset(); localStorage.clear(); });

  it('keeps the new status when the server agrees', async () => {
    post.mockResolvedValue({});
    const { hook } = setup();
    await act(() => hook.result.current.onUpdateOrderStatus('o1', OrderStatus.ACCEPTED));
    expect(hook.result.current.internalOrders[0].status).toBe(OrderStatus.ACCEPTED);
  });

  it('puts the old status back when the server refuses, and says so', async () => {
    post.mockRejectedValue({ response: { data: { message: 'Order already cancelled' } } });
    const { hook, showError } = setup();
    await act(() => hook.result.current.onUpdateOrderStatus('o1', OrderStatus.ACCEPTED));
    expect(hook.result.current.internalOrders[0].status).toBe(OrderStatus.PENDING_ACCEPTANCE);
    expect(showError).toHaveBeenCalledWith('Order already cancelled');
  });

  it('clears the "cooking" flag when start-cooking fails, so the poll cannot resurrect it', async () => {
    post.mockRejectedValue(new Error('boom'));
    const { hook } = setup();
    await act(() => hook.result.current.onUpdateOrderStatus('o1', OrderStatus.PREPARING));
    expect(localStorage.getItem('order_preparing_o1')).toBeNull();
  });
});
