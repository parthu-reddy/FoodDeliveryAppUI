import { usePolling } from '@/hooks/usePolling';
import { restaurantApi } from '@/lib/zodiosClients';
import { Order, OrderStatus } from '@/types';
import { useCallback, useState } from 'react';
import { fromContract } from '../../../lib/untypedResponse';

interface UseRestaurantOrdersOptions {
  restaurantId: string;
  onAddApiLog?: (log: unknown) => void;
  showError?: (msg: string) => void;
  externalOrders?: Order[];
  externalUpdateStatus?: (orderId: string, status: OrderStatus, payload?: { reason?: string }) => void;
}

export function useRestaurantOrders({
  restaurantId: selectedOutletId,
  onAddApiLog,
  showError,
  externalOrders,
  externalUpdateStatus
}: UseRestaurantOrdersOptions) {
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const activeOrders = externalOrders ?? internalOrders;

  const onUpdateOrderStatus = externalUpdateStatus ?? (async (orderId: string, status: OrderStatus, payload?: { reason?: string }) => {
    // Optimistic UI update
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    // API call
    try {
      if (status === OrderStatus.ACCEPTED) {
        // @ts-expect-error auto-migration type suppression
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/accept', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/accept`, method: 'POST' });
      } else if (status === OrderStatus.PREPARING) {
        localStorage.setItem(`order_preparing_${orderId}`, 'true');
        // @ts-expect-error auto-migration type suppression
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/prepare', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/prepare`, method: 'POST' });
      } else if (status === OrderStatus.CANCELLED_BY_RESTAURANT) {
        // @ts-expect-error auto-migration type suppression
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/reject', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/reject`, method: 'POST' });
      } else if (status === OrderStatus.READY_FOR_PICKUP) {
        localStorage.removeItem(`order_preparing_${orderId}`);
        // @ts-expect-error auto-migration type suppression
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/ready', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/ready`, method: 'POST' });
      } else if (status === OrderStatus.CANCELLED) {
        // @ts-expect-error auto-migration type suppression
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/cancel', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/cancel`, method: 'POST' });
      }
    } catch (error: unknown) {
      console.error('Failed to update order status:', error);
      if (showError) showError((error as {response?: {data?: {message?: string}}})?.response?.data?.message || 'Failed to update order status');
      // Revert optimistic update on failure could be implemented here
    }
  });

  const fetchOrders = useCallback(async () => {
    if (!selectedOutletId) return [];
    const res = await restaurantApi.fulfillment.get('/api/v1/restaurants/:restaurantId/fulfillment/orders/active', { params: { restaurantId: selectedOutletId } });
    if (res.data) {
      const activeOrdersData = fromContract<{ id: string; orderId: string; [key: string]: unknown }[]>(res.data || []);
      const mapped = activeOrdersData.map((o: unknown) => {
        const orderData = o as Order & { itemsJson?: string, orderId?: string };
        const s = orderData.status?.toUpperCase() || '';
        let parsedItems = orderData.items || [];
        if (orderData.itemsJson) {
            // malformed itemsJson falls back to o.items rather than failing the row
        try { parsedItems = JSON.parse(orderData.itemsJson); } catch { /* keep fallback */ }
        }
        const calculatedTotal = parsedItems.reduce((acc: number, item: unknown) => {
            const itemData = item as { item?: { price?: number }, price?: number, quantity?: number };
            return acc + (itemData.item?.price || itemData.price || 0) * (itemData.quantity || 1);
        }, 0);
        
        return { 
          ...orderData, 
          id: orderData.orderId || orderData.id || '', 
          status: s as OrderStatus, 
          items: parsedItems as { quantity: number; item: { id: string; name: string; price: number } }[],
          total: orderData.total || calculatedTotal,
          subtotal: orderData.subtotal || calculatedTotal,
          customerName: orderData.customerName || 'Customer'
        };
      });
      return mapped;
    }
    return [];
  }, [selectedOutletId]);

  usePolling<Order[]>({
    fetchFn: fetchOrders,
    intervalMs: 5000,
    enabled: !!selectedOutletId,
    onData: (mapped: Order[]) => {
      setInternalOrders(mapped.map((newOrder: Order) => {
        const isLocallyPreparing = localStorage.getItem(`order_preparing_${newOrder.id}`) === 'true';
        if (isLocallyPreparing && newOrder.status === OrderStatus.ACCEPTED) {
          return { ...newOrder, status: OrderStatus.PREPARING };
        }
        return newOrder;
      }));
    },
    onError: (err) => console.error("Failed to poll orders", err)
  });

  const [refundRequests, setRefundRequests] = useState<{ id: string; orderId: string; [key: string]: unknown }[]>([]);

  const fetchRefundRequests = useCallback(async () => {
    if (!selectedOutletId) return [];
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/internal/restaurants/outlets/${selectedOutletId}/refund-requests`;
      const token = localStorage.getItem('token');
       
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.error('Failed to fetch refund requests', e);
    }
    return [];
  }, [selectedOutletId]);

  usePolling<{ id: string; orderId: string; [key: string]: unknown }[]>({
    fetchFn: fetchRefundRequests,
    intervalMs: 10000,
    enabled: !!selectedOutletId,
    onData: (data) => setRefundRequests(data),
    onError: (err) => console.error("Failed to poll refund requests", err)
  });

  return {
    internalOrders,
    setInternalOrders,
    activeOrders,
    onUpdateOrderStatus,
    refundRequests,
    setRefundRequests
  };
}
