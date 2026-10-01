import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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
    window.history.replaceState({}, '', window.location.href);
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
    vi.useRealTimers();
    localStorage.clear();
  });

  const primedCart = async (options: Partial<Parameters<typeof useCustomerCart>[0]> = {}) => {
    const rendered = renderHook(() => useCustomerCart({ locationKey: 'test-location', ...options }));
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
      await result.current.processPaymentAndOrder('UPI', ADDRESS_ID, () => {});
    });

    // Assert the POST and its body, not the absence of an error message: without this the test
    // would pass while the order was rejected two guards later for a completely different reason,
    // and it is the body that carries the point -- the method the customer picked, unrewritten.
    expect(orderPosts).toBe(1);
    expect(lastOrderBody?.paymentMethod).toBe('UPI');
  });

  test('an older empty-menu quote cannot overwrite the cart quote', async () => {
    let emptyQuoteRequests = 0;
    server.use(
      http.post('*/api/v1/orders/quote', async ({ request }) => {
        const body = await request.json() as { items?: unknown[] };
        if (!body.items?.length) {
          emptyQuoteRequests++;
          await new Promise(resolve => setTimeout(resolve, 800));
          return HttpResponse.json({
            success: true,
            message: 'empty quote',
            timestamp: new Date().toISOString(),
            data: { quoteId: 'empty-quote', total: 28 },
          });
        }
        return HttpResponse.json({
          success: true,
          message: 'cart quote',
          timestamp: new Date().toISOString(),
          data: { quoteId: 'cart-quote', total: 150 },
        });
      }),
    );

    const rendered = renderHook(() => useCustomerCart({
      locationKey: 'test-location',
      selectedRestaurantId: RESTAURANT_ID,
    }));
    act(() => rendered.result.current.setDeliveryAddressId(ADDRESS_ID));
    await waitFor(() => expect(emptyQuoteRequests).toBe(1), { timeout: 2000 });

    act(() => rendered.result.current.addToCart(item, restaurant));
    await waitFor(() => {
      expect(rendered.result.current.quotes[RESTAURANT_ID]?.data?.quoteId).toBe('cart-quote');
    }, { timeout: 2000 });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    expect(rendered.result.current.quotes[RESTAURANT_ID]?.data?.quoteId).toBe('cart-quote');
    expect(rendered.result.current.getCartTotal(RESTAURANT_ID).total).toBe(150);
  });

  test('an unavailable-item response removes only rejected items and keeps checkout retryable', async () => {
    const rejectedId = item.id;
    server.use(http.post('*/api/v1/orders', () => {
      orderPosts++;
      return HttpResponse.json({ success: false, message: 'Menu item unavailable', data: [rejectedId] }, { status: 400 });
    }));
    const { result } = await primedCart();
    const remainingItem = { ...item, id: '77777777-7777-7777-7777-777777777777', name: 'Idli', price: 60 };
    act(() => result.current.addToCart(remainingItem, restaurant));
    await waitFor(() => expect(result.current.carts[RESTAURANT_ID].items).toHaveLength(2));
    await waitFor(() => expect(result.current.quotes[RESTAURANT_ID]?.data?.quoteId).toBe('quote-1'), { timeout: 3000 });
    const onSuccess = () => { throw new Error('Rejected order must not reach success'); };
    await act(async () => result.current.processPaymentAndOrder('CARD', ADDRESS_ID, onSuccess));

    expect(orderPosts).toBe(1);
    expect(result.current.carts[RESTAURANT_ID].items.map(row => row.item.id)).toEqual([remainingItem.id]);
    expect(result.current.globalError).toBe('Removed unavailable items from cart: Dosa');
    expect(result.current.paymentStatus).toBe('idle');
    expect(result.current.isPaymentModalOpen).toBe(true);
  });

  test('removing the only rejected cart item does not fabricate successful payment', async () => {
    server.use(http.post('*/api/v1/orders', () => {
      orderPosts++;
      return HttpResponse.json({ success: false, message: 'Menu item unavailable', data: [item.id] }, { status: 400 });
    }));
    const { result } = await primedCart();
    await act(async () => result.current.processPaymentAndOrder('CARD', ADDRESS_ID, () => {
      throw new Error('Rejected order must not reach success');
    }));
    expect(orderPosts).toBe(1);
    expect(result.current.carts[RESTAURANT_ID]).toBeUndefined();
    expect(result.current.paymentStatus).toBe('idle');
    expect(result.current.globalError).toBe('Removed unavailable items from cart: Dosa');
  });


  test('tracking starts from the current server order after fast Dev payment completion', async () => {
    const orderId = '88888888-8888-4888-8888-888888888888';
    const onPlaceOrder = vi.fn();
    const setTrackingOrder = vi.fn();
    let orderReads = 0;
    server.use(
      http.post('*/api/v1/orders', () => {
        orderPosts++;
        return HttpResponse.json({ success: true, data: { id: orderId, status: 'CREATED' } });
      }),
      http.get('*/api/v1/orders/:orderId', ({ params }) => {
        expect(params.orderId).toBe(orderId);
        orderReads++;
        return HttpResponse.json({ success: true, data: { id: orderId, status: 'PENDING_ACCEPTANCE' } });
      }),
    );
    const { result } = await primedCart({ onPlaceOrder, setTrackingOrder });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => result.current.processPaymentAndOrder('CARD', ADDRESS_ID, () => {}));
    expect(result.current.paymentStatus).toBe('success');
    expect(setTrackingOrder).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    await waitFor(() => expect(setTrackingOrder).toHaveBeenCalledWith({ id: orderId, status: 'PENDING_ACCEPTANCE' }));
    expect(onPlaceOrder).toHaveBeenCalledWith({ id: orderId, status: 'PENDING_ACCEPTANCE' });
    expect(orderPosts).toBe(1);
    expect(orderReads).toBe(1);
  });


  test('a failed tracking refresh preserves successful creation without another order POST', async () => {
    const orderId = '99999999-9999-4999-8999-999999999999';
    const onPlaceOrder = vi.fn();
    const setTrackingOrder = vi.fn();
    const onSuccess = vi.fn();
    server.use(
      http.post('*/api/v1/orders', () => {
        orderPosts++;
        return HttpResponse.json({ success: true, data: { id: orderId, status: 'CREATED' } });
      }),
      http.get('*/api/v1/orders/:orderId', () => HttpResponse.json({ success: false }, { status: 503 })),
    );
    const { result } = await primedCart({ onPlaceOrder, setTrackingOrder });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => result.current.processPaymentAndOrder('CARD', ADDRESS_ID, onSuccess));
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(setTrackingOrder).toHaveBeenCalledWith({ id: orderId, status: 'CREATED' });
    expect(onPlaceOrder).toHaveBeenCalledTimes(1);
    expect(orderPosts).toBe(1);
    expect(result.current.carts[RESTAURANT_ID]).toBeUndefined();
    expect(result.current.paymentStatus).toBe('idle');
    await waitFor(() => expect(result.current.isPaymentModalOpen).toBe(false));
  });

});


describe('validated reorder cart restoration', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());
  test('restores multiple lines and quantities atomically without affecting another outlet', async () => {
    const other = { ...restaurant, id: '77777777-7777-7777-7777-777777777777' };
    const extra = { ...item, id: '88888888-8888-8888-8888-888888888888' };
    const { result } = renderHook(() => useCustomerCart({ locationKey: 'home' }));
    act(() => result.current.addToCart(item, other));
    act(() => result.current.restoreCart([{ item, quantity: 3 }, { item: extra, quantity: 2 }], restaurant));
    expect(result.current.carts[RESTAURANT_ID].items.map(line => line.quantity)).toEqual([3, 2]);
    expect(result.current.carts[other.id!].items).toEqual([{ item, quantity: 1 }]);
    const persisted = JSON.parse(localStorage.getItem('food_delivery_carts_v2')!);
    expect(persisted.home[RESTAURANT_ID].items).toHaveLength(2);
  });
});
