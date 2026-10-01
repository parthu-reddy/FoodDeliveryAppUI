import { useEffect, useRef, useState } from 'react';
import { customerApi, restaurantApi } from '@/lib/zodiosClients';
import { loadEffectiveMenu } from '@features/catalog/model/menuStore';
import type { CartItem, MenuItem, Order, Restaurant } from '@/types';
import type { CartState } from './useCustomerCart';
import type { ReorderSuggestion } from './useReorderSuggestions';

class ReorderError extends Error {}

/** Historical names/prices are display data; restore only current, available catalogue IDs. */
export function currentReorderItems(order: Order, menu: MenuItem[]): CartItem[] {
  if (order.deliveryStatus !== 'DELIVERED' || !order.items?.length) {
    throw new ReorderError('Only completed orders with items can be ordered again.');
  }
  const byId = new Map(menu.map(item => [item.id, item]));
  const restored = new Map<string, CartItem>();
  for (const line of order.items) {
    const id = line.menuItemId;
    const item = id ? byId.get(id) : undefined;
    if (!id || !item || item.isAvailable !== true || !Number.isFinite(item.price) || Number(item.price) < 0) {
      throw new ReorderError('Some items from this order are no longer available. Please choose from the current menu.');
    }
    if (!Number.isSafeInteger(line.quantity) || Number(line.quantity) <= 0) {
      throw new ReorderError('This order cannot be repeated. Please choose from the current menu.');
    }
    const quantity = (restored.get(id)?.quantity ?? 0) + Number(line.quantity);
    if (!Number.isSafeInteger(quantity)) throw new ReorderError('This order cannot be repeated.');
    restored.set(id, { item, quantity });
  }
  return [...restored.values()];
}

interface Options {
  locationKey: string;
  deliveryAddressId: string | null;
  carts: Record<string, CartState>;
  confirmReplacement: () => Promise<boolean>;
  restoreCart: (items: CartItem[], restaurant: Restaurant) => void;
  selectRestaurant: (restaurant: Restaurant) => void;
  openCart: () => void;
  showError: (message: string) => void;
}

/** Validate the owned order, current catalogue and server quote before one atomic cart update. */
export function useCustomerReorder(options: Options) {
  const latest = useRef(options);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  useEffect(() => { latest.current = options; });
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const reorder = async (suggestion: ReorderSuggestion) => {
    if (inFlight.current) return;
    const start = latest.current;
    if (!start.deliveryAddressId) {
      start.showError('Select a delivery address before ordering again.');
      return;
    }
    inFlight.current = true;
    setPendingOrderId(suggestion.orderId);
    const existing = start.carts[suggestion.restaurantId];
    const unchanged = () => mounted.current && latest.current.locationKey === start.locationKey
      && latest.current.deliveryAddressId === start.deliveryAddressId
      && latest.current.carts[suggestion.restaurantId] === existing;
    try {
      if (existing?.items.length && !await start.confirmReplacement()) return;
      if (!unchanged()) return;
      const history = await customerApi.order.getOrder({ params: { orderId: suggestion.orderId } });
      const order = history.data as Order | undefined;
      if (!order || order.id !== suggestion.orderId || order.restaurantId !== suggestion.restaurantId) {
        throw new ReorderError('This order cannot be repeated. Please choose from the current menu.');
      }
      const details = await restaurantApi.restaurantOutlet.getRestaurant({ params: { id: suggestion.restaurantId } });
      const restaurant = details.data;
      if (!restaurant || restaurant.id !== suggestion.restaurantId || restaurant.isActive !== true || restaurant.isOpen !== true) {
        throw new ReorderError('This restaurant is currently unavailable. Please choose another kitchen.');
      }
      const items = currentReorderItems(order, await loadEffectiveMenu(suggestion.restaurantId));
      const quote = await customerApi.order.post('/api/v1/orders/quote', {
        restaurantId: suggestion.restaurantId,
        deliveryAddressId: start.deliveryAddressId,
        items: items.map(line => ({ menuItemId: line.item.id as string, quantity: line.quantity })),
      });
      if (!quote.data?.quoteId) throw new ReorderError('Could not check this order. Please try again.');
      if (!unchanged()) {
        if (mounted.current) latest.current.showError('Your address or cart changed. Please try ordering again.');
        return;
      }
      const currentRestaurant = { ...restaurant, distance: quote.data.distanceKm } as Restaurant;
      start.restoreCart(items, currentRestaurant);
      start.selectRestaurant(currentRestaurant);
      start.openCart();
    } catch (failure) {
      if (mounted.current) {
        const response = (failure as { response?: { data?: { message?: string } } }).response;
        const message = response?.data?.message ?? (failure instanceof ReorderError ? failure.message : "Couldn't repeat this order. Please try again.");
        latest.current.showError(message);
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setPendingOrderId(null);
    }
  };
  return { reorder, pendingOrderId };
}
