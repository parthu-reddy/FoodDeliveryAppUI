import { useState, useCallback, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from '../../lib/zodiosClients';
import { usePolling } from '../../hooks/usePolling';

interface UseRestaurantOrdersOptions {
  selectedOutletId: string;
  onAddApiLog?: (log: any) => void;
  showError?: (msg: string) => void;
  externalOrders?: Order[];
  externalUpdateStatus?: (orderId: string, status: OrderStatus, payload?: any) => void;
}

export function useRestaurantOrders({
  selectedOutletId,
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
      let endpoint = '';
      if (status === OrderStatus.ACCEPTED) endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/accept`;
      else if (status === OrderStatus.PREPARING) {
        endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/prepare`;
        localStorage.setItem(`order_preparing_${orderId}`, 'true');
      }
      else if (status === OrderStatus.CANCELLED_BY_RESTAURANT) endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/reject`;
      else if (status === OrderStatus.READY_FOR_PICKUP) {
        endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/ready`;
        localStorage.removeItem(`order_preparing_${orderId}`);
      }
      else if (status === OrderStatus.CANCELLED) endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/cancel`;

      if (endpoint) {
        await (customerApi.post as any)(endpoint, payload);
        if (onAddApiLog) {
          onAddApiLog({ id: `update_${orderId}`, label: `POST ${endpoint}`, method: 'POST' });
        }
      }
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      if (showError) showError(error.response?.data?.message || 'Failed to update order status');
      // Revert optimistic update on failure could be implemented here
    }
  });

  const fetchOrders = useCallback(async () => {
    if (!selectedOutletId) return [];
    const res = await (restaurantApi.get as any)(`/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/active`);
    if (res.data) {
      const activeOrdersData = res.data.data || res.data;
      const mapped = activeOrdersData.map((o: any) => {
        let s = o.status?.toUpperCase() || '';
        let parsedItems = o.items || [];
        if (o.itemsJson) {
            try { parsedItems = JSON.parse(o.itemsJson); } catch (e) {}
        }
        let calculatedTotal = parsedItems.reduce((acc: number, item: any) => acc + (item.item?.price || item.price || 0) * (item.quantity || 1), 0);
        
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
