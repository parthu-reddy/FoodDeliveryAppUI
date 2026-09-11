import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { OrderStatus } from '@/types/backend-enums';
import { useCustomerOrders } from './useCustomerOrders';

const ORDER_ID = '11111111-1111-1111-1111-111111111111';

const orderPage = (status: OrderStatus) => ({
  success: true,
  message: 'ok',
  timestamp: new Date().toISOString(),
  data: {
    content: [{
      id: ORDER_ID,
      customerId: '22222222-2222-2222-2222-222222222222',
      restaurantId: '33333333-3333-3333-3333-333333333333',
      restaurantName: 'Test Kitchen',
      status,
      totalAmount: 420,
      itemTotal: 400,
      customerPlatformFee: 5,
      sgst: 5,
      cgst: 5,
      deliveryFee: 5,
      deliveryAddress: '1 Test Road',
      items: [],
      createdAt: new Date().toISOString(),
    }],
  },
});

/** Serve `status` from /orders/active until the test changes it. */
function serveStatus(status: OrderStatus) {
  server.use(
    http.get('*/api/v1/orders/active', () => HttpResponse.json(orderPage(status))),
  );
}

describe('useCustomerOrders polling', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('an order awaiting delay approval keeps the poller running and sees the transition', async () => {
    // M-10. The poll gate used to filter on a hand-listed array that omitted
    // AWAITING_DELAY_APPROVAL, so activeOrderIdsStr went empty the moment the delay prompt arrived,
    // the polling effect tore down, and the customer's tracker stayed frozen on "Restaurant
    // Requested Delay" for the life of the order. Without isActiveOrder this test times out at the
    // second assertion with the order still AWAITING_DELAY_APPROVAL.
    serveStatus(OrderStatus.AWAITING_DELAY_APPROVAL);

    const { result } = renderHook(() => useCustomerOrders());

    await waitFor(() => {
      expect(result.current.internalOrders).toHaveLength(1);
    });
    expect(result.current.internalOrders[0].status).toBe(OrderStatus.AWAITING_DELAY_APPROVAL);
    expect(result.current.activeOrders.map(o => o.id)).toContain(ORDER_ID);

    // The restaurant accepts the delay while the customer is looking at the prompt.
    serveStatus(OrderStatus.ACCEPTED);
    await vi.advanceTimersByTimeAsync(31000);

    await waitFor(() => {
      expect(result.current.internalOrders[0].status).toBe(OrderStatus.ACCEPTED);
    });
  });

  test('a terminal order stops the poller', async () => {
    // The other half of one definition of active: a cancelled order must not keep polling forever.
    serveStatus(OrderStatus.CANCELLED_BY_PLATFORM);

    const { result } = renderHook(() => useCustomerOrders());

    await waitFor(() => {
      expect(result.current.internalOrders).toHaveLength(1);
    });

    let polls = 0;
    server.use(
      http.get('*/api/v1/orders/active', () => {
        polls++;
        return HttpResponse.json(orderPage(OrderStatus.CANCELLED_BY_PLATFORM));
      }),
    );
    await vi.advanceTimersByTimeAsync(120000);

    expect(polls).toBe(0);
    // It is still shown to the customer -- finished, not hidden.
    expect(result.current.activeOrders.map(o => o.id)).toContain(ORDER_ID);
  });
});
