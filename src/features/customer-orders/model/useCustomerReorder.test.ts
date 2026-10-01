import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuItem, Order, Restaurant } from '@/types';
import type { CartState } from './useCustomerCart';
import type { ReorderSuggestion } from './useReorderSuggestions';

const api = vi.hoisted(() => ({ order: vi.fn(), restaurant: vi.fn(), menu: vi.fn(), quote: vi.fn() }));
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: { order: { getOrder: api.order, post: api.quote } },
  restaurantApi: { restaurantOutlet: { getRestaurant: api.restaurant } },
}));
vi.mock('@features/catalog/model/menuStore', () => ({ loadEffectiveMenu: api.menu }));
import { currentReorderItems, useCustomerReorder } from './useCustomerReorder';

const order = { id: 'order-1', restaurantId: 'outlet-1', deliveryStatus: 'DELIVERED',
  items: [{ menuItemId: 'item-1', name: 'Old dish', quantity: 3, price: 10 }] } as Order;
const item = { id: 'item-1', name: 'Current dish', isAvailable: true, price: 25 } as MenuItem;
const restaurant = { id: 'outlet-1', name: 'Kitchen', isActive: true, isOpen: true } as Restaurant;
const suggestion = { orderId: order.id, restaurantId: restaurant.id, restaurantName: 'Kitchen' } as ReorderSuggestion;
const cart = { items: [{ item, quantity: 2 }], restaurant } as CartState;
function options(over: Partial<Parameters<typeof useCustomerReorder>[0]> = {}) {
  return { locationKey: 'home', deliveryAddressId: 'home-id', carts: {},
    confirmReplacement: vi.fn().mockResolvedValue(true), restoreCart: vi.fn(), selectRestaurant: vi.fn(),
    openCart: vi.fn(), showError: vi.fn(), ...over };
}
async function run(result: { current: ReturnType<typeof useCustomerReorder> }) {
  await act(async () => { await result.current.reorder(suggestion); });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.order.mockReset().mockResolvedValue({ data: order });
  api.restaurant.mockReset().mockResolvedValue({ data: restaurant });
  api.menu.mockReset().mockResolvedValue([item]);
  api.quote.mockReset().mockResolvedValue({ data: { quoteId: 'quote-1', distanceKm: 0.5 } });
});

describe('currentReorderItems', () => {
  it('uses current catalogue prices/names and retains historical quantities', () => {
    expect(currentReorderItems(order, [item])).toEqual([{ item, quantity: 3 }]);
  });
  it('aggregates repeated menu IDs before quoting', () => {
    const repeated = { ...order, items: [...order.items!, { ...order.items![0], quantity: 2 }] };
    expect(currentReorderItems(repeated, [item])).toEqual([{ item, quantity: 5 }]);
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid quantity %s', quantity => {
    expect(() => currentReorderItems({ ...order, items: [{ ...order.items![0], quantity }] }, [item])).toThrow();
  });
  it.each([{ label: 'missing', menu: [] }, { label: 'unavailable', menu: [{ ...item, isAvailable: false }] }, { label: 'invalid-price', menu: [{ ...item, price: NaN }] }])('never partially restores $label items', ({ menu }) => {
    expect(() => currentReorderItems(order, menu)).toThrow();
  });
  it('refuses an incomplete order rather than replaying a cancelled cart', () => {
    expect(() => currentReorderItems({ ...order, deliveryStatus: 'CANCELLED' as Order['deliveryStatus'] }, [item])).toThrow();
  });
});

describe('useCustomerReorder', () => {
  it('validates the owned order and current quote before atomically restoring and opening the cart', async () => {
    const opts = options(); const { result } = renderHook(() => useCustomerReorder(opts));
    await run(result);
    expect(api.order).toHaveBeenCalledWith({ params: { orderId: order.id } });
    expect(api.quote).toHaveBeenCalledExactlyOnceWith('/api/v1/orders/quote', {
      restaurantId: restaurant.id, deliveryAddressId: 'home-id', items: [{ menuItemId: item.id, quantity: 3 }],
    });
    expect(opts.restoreCart).toHaveBeenCalledExactlyOnceWith([{ item, quantity: 3 }], { ...restaurant, distance: 0.5 });
    expect(opts.selectRestaurant).toHaveBeenCalledOnce(); expect(opts.openCart).toHaveBeenCalledOnce();
    expect(opts.showError).not.toHaveBeenCalled(); expect(result.current.pendingOrderId).toBeNull();
  });
  it('requires a selected saved address before any network or cart work', async () => {
    const opts = options({ deliveryAddressId: null }); const { result } = renderHook(() => useCustomerReorder(opts));
    await run(result); expect(api.order).not.toHaveBeenCalled(); expect(opts.restoreCart).not.toHaveBeenCalled();
    expect(opts.showError).toHaveBeenCalledWith('Select a delivery address before ordering again.');
  });
  it('keeps an existing cart when its replacement is declined', async () => {
    const opts = options({ carts: { 'outlet-1': cart }, confirmReplacement: vi.fn().mockResolvedValue(false) });
    const { result } = renderHook(() => useCustomerReorder(opts)); await run(result);
    expect(opts.confirmReplacement).toHaveBeenCalledOnce(); expect(api.order).not.toHaveBeenCalled();
    expect(opts.restoreCart).not.toHaveBeenCalled(); expect(opts.openCart).not.toHaveBeenCalled();
  });
  it('requires confirmation before replacing an existing cart with the original quantities', async () => {
    const opts = options({ carts: { 'outlet-1': cart } }); const { result } = renderHook(() => useCustomerReorder(opts));
    await run(result); expect(opts.confirmReplacement).toHaveBeenCalledOnce();
    expect(opts.restoreCart).toHaveBeenCalledWith([{ item, quantity: 3 }], expect.anything());
  });
  it.each([{ ...order, id: 'other-order' }, { ...order, restaurantId: 'other-outlet' }])('rejects mismatched order identity', async other => {
    api.order.mockResolvedValue({ data: other }); const opts = options();
    const { result } = renderHook(() => useCustomerReorder(opts)); await run(result);
    expect(opts.restoreCart).not.toHaveBeenCalled(); expect(api.quote).not.toHaveBeenCalled();
    expect(opts.showError).toHaveBeenCalledOnce();
  });
  it.each([{ ...restaurant, isOpen: false }, { ...restaurant, isActive: false }])('does not add items from a closed/inactive outlet', async outlet => {
    api.restaurant.mockResolvedValue({ data: outlet }); const opts = options();
    const { result } = renderHook(() => useCustomerReorder(opts)); await run(result);
    expect(opts.restoreCart).not.toHaveBeenCalled(); expect(api.menu).not.toHaveBeenCalled();
    expect(opts.showError).toHaveBeenCalledWith(expect.stringContaining('unavailable'));
  });
  it('keeps the cart unchanged when the authoritative quote rejects the address', async () => {
    api.quote.mockRejectedValue({ response: { data: { message: 'Restaurant is too far away.' } } });
    const opts = options({ carts: { 'outlet-1': cart } }); const { result } = renderHook(() => useCustomerReorder(opts));
    await run(result); expect(opts.restoreCart).not.toHaveBeenCalled(); expect(opts.openCart).not.toHaveBeenCalled();
    expect(opts.showError).toHaveBeenCalledWith('Restaurant is too far away.');
  });
  it('does not double-add when repeat clicks happen during validation', async () => {
    let release: (value: unknown) => void = () => {}; api.order.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const opts = options(); const { result } = renderHook(() => useCustomerReorder(opts));
    let first: Promise<void> = Promise.resolve();
    act(() => { first = result.current.reorder(suggestion); });
    await act(async () => { await result.current.reorder(suggestion); });
    expect(api.order).toHaveBeenCalledOnce(); expect(result.current.pendingOrderId).toBe(order.id);
    await act(async () => { release({ data: order }); await first; });
    expect(opts.restoreCart).toHaveBeenCalledOnce();
  });
  it('does not restore a quote after the customer changes address during validation', async () => {
    let release: (value: unknown) => void = () => {}; api.quote.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const opts = options(); const { result, rerender } = renderHook(props => useCustomerReorder(props), { initialProps: opts });
    let pending: Promise<void> = Promise.resolve();
    await act(async () => { pending = result.current.reorder(suggestion); });
    await waitFor(() => expect(api.quote).toHaveBeenCalledOnce());
    rerender({ ...opts, locationKey: 'work', deliveryAddressId: 'work-id' });
    await act(async () => { release({ data: { quoteId: 'old-quote' } }); await pending; });
    expect(opts.restoreCart).not.toHaveBeenCalled(); expect(opts.selectRestaurant).not.toHaveBeenCalled();
  });
  it('preserves edits made to the target cart while validation is pending', async () => {
    let release: (value: unknown) => void = () => {}; api.quote.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const opts = options(); const { result, rerender } = renderHook(props => useCustomerReorder(props), { initialProps: opts });
    let pending: Promise<void> = Promise.resolve();
    await act(async () => { pending = result.current.reorder(suggestion); });
    await waitFor(() => expect(api.quote).toHaveBeenCalledOnce());
    rerender({ ...opts, carts: { 'outlet-1': cart } });
    await act(async () => { release({ data: { quoteId: 'old-quote' } }); await pending; });
    expect(opts.restoreCart).not.toHaveBeenCalled(); expect(opts.openCart).not.toHaveBeenCalled();
  });
  it('reports a safe retry message when the current menu cannot load', async () => {
    api.menu.mockRejectedValue(new Error('raw schema/internal details')); const opts = options();
    const { result } = renderHook(() => useCustomerReorder(opts)); await run(result);
    expect(opts.restoreCart).not.toHaveBeenCalled();
    expect(opts.showError).toHaveBeenCalledWith("Couldn't repeat this order. Please try again.");
  });
});
