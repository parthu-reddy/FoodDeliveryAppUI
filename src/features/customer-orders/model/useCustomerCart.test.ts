import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { MenuItem, Restaurant } from '@/types';
import { useCustomerCart } from './useCustomerCart';

const RESTAURANT_ID = '44444444-4444-4444-4444-444444444444';
const ADDRESS_ID = '55555555-5555-5555-5555-555555555555';

const restaurant = { id: RESTAURANT_ID, name: 'Test Kitchen' } as Partial<Restaurant> as Restaurant;
const item = { id: '66666666-6666-6666-6666-666666666666', name: 'Dosa', price: 120 } as Partial<MenuItem> as MenuItem;

describe('useCustomerCart payment method', () => {
  let orderPosts: number;
  let lastOrderBody: Record<string, unknown> | null;

  beforeEach(() => {
    orderPosts = 0;
    lastOrderBody = null;
    localStorage.clear();
    server.use(
      http.post('*/api/v1/orders', async ({ request }) => {
        orderPosts++;
        lastOrderBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true, message: 'ok', timestamp: new Date().toISOString(), data: { id: 'ord-1' } });
      }),
      http.get('*/api/v1/restaurants/:id/delivery-availability', () =>
        HttpResponse.json({ success: true, message: 'ok', timestamp: new Date().toISOString(), data: true })),
      http.post('*/api/v1/orders/quote', () =>
        HttpResponse.json({ success: true, message: 'ok', timestamp: new Date().toISOString(), data: { quoteId: 'quote-1', total: 150 } })),
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  const primedCart = async () => {
    const rendered = renderHook(() => useCustomerCart({ locationKey: 'test-location' }));
    act(() => {
      rendered.result.current.addToCart(item, restaurant);
    });
    await waitFor(() => {
      expect(rendered.result.current.carts[RESTAURANT_ID]?.items).toHaveLength(1);
    });
    act(() => {
      rendered.result.current.setDeliveryAddressId(ADDRESS_ID);
    });
    // The quote is fetched on a 500ms debounce and processPaymentAndOrder refuses to send an order
    // without one, so the fixture has to wait for it -- otherwise every case here fails at the
    // quote guard and a test about the payment method proves nothing about the payment method.
    await waitFor(() => {
      expect(rendered.result.current.quotes[RESTAURANT_ID]?.data?.quoteId).toBe('quote-1');
    }, { timeout: 3000 });
    await act(async () => {
      await rendered.result.current.handleCheckout(RESTAURANT_ID);
    });
    return rendered;
  };

  test('no payment method means no order and a visible error', async () => {
    // M-11. The payload used to read `paymentMethod: (paymentMethod || 'WALLET')`, so an unset
    // method silently charged the wallet -- the exact behaviour createOrderWithPayment rejects a
    // null method server-side in order to prevent. With the default restored, this test sees a POST.
    const { result } = await primedCart();

    await act(async () => {
      await result.current.processPaymentAndOrder(undefined, ADDRESS_ID, () => {});
    });

    expect(orderPosts).toBe(0);
    await waitFor(() => {
      expect(result.current.globalError).toMatch(/how you would like to pay/i);
    });
    expect(result.current.paymentStatus).toBe('idle');
  });

  test('a method the customer chose is sent as-is', async () => {
    const { result } = await primedCart();

    await act(async () => {
      await result.current.processPaymentAndOrder('COD', ADDRESS_ID, () => {});
    });

    // Assert the POST and its body, not the absence of an error message: without this the test
    // would pass while the order was rejected two guards later for a completely different reason,
    // and it is the body that carries the point -- the method the customer picked, unrewritten.
    expect(orderPosts).toBe(1);
    expect(lastOrderBody?.paymentMethod).toBe('COD');
  });
});
