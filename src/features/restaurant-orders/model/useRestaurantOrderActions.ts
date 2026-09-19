import { useCallback } from 'react';
import { restaurantApi } from '@/lib/zodiosClients';
import { Order, OrderStatus } from '@/types';
import { formatINR } from '@shared/money';
import { z } from 'zod';

/** A delay the customer is asked to accept. Mirrors the dashboard's original schema. */
const delaySchema = z.object({
  additionalPrepTime: z.number().int().positive().max(120, 'Delay cannot exceed 120 minutes'),
  delayReason: z.string().max(255, 'Reason must be under 255 characters').optional(),
});

/**
 * What a restaurant does to an order once it has arrived: advance it, cancel it, refund part
 * of it, or ask the customer to accept a delay.
 *
 * Lifted verbatim from a 845-line `RestaurantDashboard`. Three of these four move money or
 * end an order, and they sat in the middle of a render function between the tab state and the
 * outlet toggle.
 */

interface UseRestaurantOrderActionsOptions {
  selectedOutletId: string;
  internalOrders: Order[];
  setCardDelayStatus: React.Dispatch<React.SetStateAction<Record<string, { minutes: number; reason: string }>>>;
  externalUpdateStatus?: (orderId: string, status: OrderStatus, payload?: { reason?: string }) => void;
  onAddApiLog?: (log: unknown) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, payload?: { reason?: string }) => void | Promise<void>;
  setInternalOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export function useRestaurantOrderActions({
  selectedOutletId,
  internalOrders,
  setCardDelayStatus,
  externalUpdateStatus,
  onAddApiLog,
  onUpdateOrderStatus,
  setInternalOrders,
  showError,
  showSuccess,
}: UseRestaurantOrderActionsOptions) {
const handleStatusTransition = useCallback((order: Order) => {
  if (order.status === OrderStatus.PENDING_ACCEPTANCE || order.status === OrderStatus.AWAITING_DELAY_APPROVAL || order.status === OrderStatus.CREATED) {
    onUpdateOrderStatus(order.id, OrderStatus.ACCEPTED);
  } else if (order.status === OrderStatus.ACCEPTED) {
    onUpdateOrderStatus(order.id, OrderStatus.PREPARING);
  } else if (order.status === OrderStatus.PREPARING) {
    onUpdateOrderStatus(order.id, OrderStatus.READY_FOR_PICKUP);
  }
}, [onUpdateOrderStatus]);

const handleCardCancelSubmit = async (orderId: string, reason: string) => {
  const orderStatus = internalOrders.find(o => o.id === orderId)?.status;
  const targetStatus = (orderStatus === OrderStatus.PENDING_ACCEPTANCE || orderStatus === OrderStatus.AWAITING_DELAY_APPROVAL || orderStatus === OrderStatus.CREATED) 
    ? OrderStatus.CANCELLED_BY_RESTAURANT 
    : OrderStatus.CANCELLED;
  
  try {
    // cleared locally in card component
    await onUpdateOrderStatus(orderId, targetStatus, { reason });
  } catch (e: unknown) {
    console.error('Failed to cancel order', e);
    const typedErr = e as { response?: { data?: { message?: string } }, message?: string };
    showError('Failed to cancel order: ' + (typedErr.response?.data?.message || typedErr.message || 'Unknown error'));
  }
};

const handleCardPartialRefundSubmit = async (orderId: string, amountStr: string, reason: string) => {
  const amount = amountStr ? parseFloat(amountStr) : 0;
  
  if (isNaN(amount) || amount <= 0) {
    showError('Please enter a valid positive refund amount');
    return;
  }
  
  // Phase 6: Ensure amount is converted to paise integer
  const paiseAmount = Math.round(amount * 100);

  try {
    // cleared locally in card component
    await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/refund/partial', {
            partialAmount: paiseAmount.toString(),
            reason: reason
          } as never, { params: { restaurantId: selectedOutletId, orderId } });
    showSuccess(`Partial refund of ${formatINR(paiseAmount)} initiated successfully`);
    // Let polling refresh the order, or manually trigger refresh if available.
  } catch (e: unknown) {
    console.error('Failed to initiate partial refund', e);
    const typedErr = e as { response?: { data?: { message?: string } }, message?: string };
    showError('Failed to refund: ' + (typedErr.response?.data?.message || typedErr.message || 'Unknown error'));
  }
};


const handleCardDelaySubmit = async (orderId: string, minutesStr: string, reason: string) => {
  const minutes = parseInt(minutesStr || '15', 10);


  const endpoint = `/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/accept`;
  const body = {
    additionalPrepTime: minutes,
    delayReason: reason
  };

  const validation = delaySchema.safeParse(body);
  if (!validation.success) {
    showError(validation.error.issues[0].message);
    return;
  }

  try {
    // cleared locally in card component
    setCardDelayStatus(prev => ({
      ...prev,
      [orderId]: { minutes, reason }
    }));
    
    if (minutes > 10) {
      // Optimistic update
      setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.AWAITING_DELAY_APPROVAL } : o));
      if (externalUpdateStatus) externalUpdateStatus(orderId, OrderStatus.AWAITING_DELAY_APPROVAL);
    } else {
      // Accept right away if <= 10 mins
      setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.ACCEPTED } : o));
      if (externalUpdateStatus) externalUpdateStatus(orderId, OrderStatus.ACCEPTED);
    }

    await restaurantApi.fulfillment.post('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/accept', body, { params: { restaurantId: selectedOutletId, orderId } });
    
    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint,
        payload: body,
        status: 200,
        timestamp: new Date().toISOString()
      });
    }
  } catch (e: unknown) {
    console.error('Failed to submit delay request', e);
    const typedErr = e as { response?: { data?: { message?: string } }, message?: string };
    showError('Failed to submit delay request: ' + (typedErr.response?.data?.message || typedErr.message || 'Unknown error'));
  }
  
  // handled locally in card
};
  return {
    handleStatusTransition,
    handleCardCancelSubmit,
    handleCardPartialRefundSubmit,
    handleCardDelaySubmit,
  };
}
