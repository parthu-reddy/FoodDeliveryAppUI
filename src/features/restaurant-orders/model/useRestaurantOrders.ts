import { usePolling } from '@/hooks/usePolling';
import { restaurantApi } from '@/lib/zodiosClients';
import { Order, OrderStatus } from '@/types';
import { useCallback, useState } from 'react';
import { fromContract } from '../../../lib/untypedResponse';

interface UseRestaurantOrdersOptions {
  restaurantId: string;
  onAddApiLog?: (log: any) => void;
  showError?: (msg: string) => void;
  externalOrders?: Order[];
  externalUpdateStatus?: (orderId: string, status: OrderStatus, payload?: any) => void;
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

  const onUpdateOrderStatus = externalUpdateStatus ?? (async (orderId: string, status: OrderStatus, payload?: any) => {
    // Optimistic UI update
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    // API call
    try {
      if (status === OrderStatus.ACCEPTED) {
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/accept', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/accept`, method: 'POST' });
      } else if (status === OrderStatus.PREPARING) {
        localStorage.setItem(`order_preparing_${orderId}`, 'true');
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/prepare', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/prepare`, method: 'POST' });
      } else if (status === OrderStatus.CANCELLED_BY_RESTAURANT) {
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/reject', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/reject`, method: 'POST' });
      } else if (status === OrderStatus.READY_FOR_PICKUP) {
        localStorage.removeItem(`order_preparing_${orderId}`);
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/ready', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/ready`, method: 'POST' });
      } else if (status === OrderStatus.CANCELLED) {
        await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/cancel', payload, { params: { restaurantId: selectedOutletId, orderId } });
        if (onAddApiLog) onAddApiLog({ id: `update_${orderId}`, label: `POST /api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/cancel`, method: 'POST' });
      }
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      if (showError) showError(error.response?.data?.message || 'Failed to update order status');
      // Revert optimistic update on failure could be implemented here
    }
  });

  const fetchOrders = useCallback(async () => {
    if (!selectedOutletId) return [];
    const res = await restaurantApi.fulfillment.get('/api/v1/restaurants/:restaurantId/fulfillment/orders/active', { params: { restaurantId: selectedOutletId } });
    if (res.data) {
      const activeOrdersData = fromContract<unknown[]>(res);
      const mapped = activeOrdersData.map((o: any) => {
        const s = o.status?.toUpperCase() || '';
        let parsedItems = o.items || [];
        if (o.itemsJson) {
            // malformed itemsJson falls back to o.items rather than failing the row
        try { parsedItems = JSON.parse(o.itemsJson); } catch { /* keep fallback */ }
        }
        const calculatedTotal = parsedItems.reduce((acc: number, item: any) => acc + (item.item?.price || item.price || 0) * (item.quantity || 1), 0);
        
        return { 
          ...o, 
          id: o.orderId || o.id, 
          status: s, 
          items: parsedItems,
          total: o.total || o.totalAmount || calculatedTotal,
          subtotal: o.subtotal || calculatedTotal,
          customerName: o.customerName || 'Customer'
        };
      });
      return mapped;
    }
    return [];
  }, [selectedOutletId]);

  usePolling<any[]>({
    fetchFn: fetchOrders,
    intervalMs: 5000,
    enabled: !!selectedOutletId,
    onData: (mapped: any[]) => {
      setInternalOrders(prev => {
        return mapped.map((newOrder: any) => {
          const oldOrder = prev.find(p => p.id === newOrder.id);
          const isLocallyPreparing = localStorage.getItem(`order_preparing_${newOrder.id}`) === 'true';
          if (isLocallyPreparing && newOrder.status === OrderStatus.ACCEPTED) {
            return { ...newOrder, status: OrderStatus.PREPARING };
          }
          return newOrder;
        });
      });
    },
    onError: (err) => console.error("Failed to poll orders", err)
  });

  return {
    internalOrders,
    setInternalOrders,
    activeOrders,
    onUpdateOrderStatus
  };
}
