import React, { useCallback, useState } from 'react';
import type { Order } from '@/types';
import { OrderStatus } from '@/types/backend-enums';
import { customerApi } from '@/lib/zodiosClients';
import { useConfirm } from '@shared/ui';

/**
 * The three things a customer can do to an order in flight: cancel it before the kitchen
 * answers, and accept or refuse a delay the kitchen asked for.
 *
 * Lifted out of `OrderTrackerLive`, where each lived inline in an onClick. Two of them failed
 * silently (`console.error` and nothing on screen), and cancel -- which cannot be undone --
 * fired on a single tap with no confirmation.
 */

interface Options {
  order: Order;
  onAddApiLog?: (log: unknown) => void;
  onUpdateOrder?: (id: string, status: string) => void;
  setInternalOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  showError: (msg: string) => void;
}

function messageOf(e: unknown, fallback: string) {
  const typed = e as { response?: { data?: { message?: string } } };
  return typed.response?.data?.message || fallback;
}

export function useLiveOrderActions({ order, onAddApiLog, onUpdateOrder, setInternalOrders, showError }: Options) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const setStatus = useCallback((status: OrderStatus) => {
    if (onUpdateOrder) onUpdateOrder(order.id, status);
    else setInternalOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
  }, [onUpdateOrder, order.id, setInternalOrders]);

  const cancel = useCallback(async () => {
    const ok = await confirm({
      title: 'Cancel this order?',
      description: `${order.restaurantName ?? 'The restaurant'} has not accepted it yet. This cannot be undone.`,
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep order',
      tone: 'danger',
    });
    if (!ok) return;
    onAddApiLog?.({ id: 'cancel_order', label: `POST /api/v1/orders/${order.id}/cancel`, method: 'POST' });
    const previous = order.status;
    setBusy(true);
    setStatus(OrderStatus.CANCELLED);
    try {
      await customerApi.order.post('/api/v1/orders/:orderId/cancel', undefined, { params: { orderId: order.id } });
    } catch (e: unknown) {
      console.error('Failed to cancel order', e);
      showError(messageOf(e, 'Could not cancel the order. It may already have been accepted.'));
      setStatus(previous);
    } finally {
      setBusy(false);
    }
  }, [confirm, onAddApiLog, order.id, order.restaurantName, order.status, setStatus, showError]);

  const answerDelay = useCallback(async (approved: boolean) => {
    if (!approved) {
      const ok = await confirm({
        title: 'Cancel instead of waiting?',
        description: 'The restaurant asked for more time. Cancelling ends the order; this cannot be undone.',
        confirmLabel: 'Cancel order',
        cancelLabel: 'Keep waiting',
        tone: 'danger',
      });
      if (!ok) return;
    }
    onAddApiLog?.({ id: approved ? 'order_approve_delay' : 'order_reject_delay', label: `POST /api/v1/orders/${order.id}/delay-approval`, method: 'POST' });
    setBusy(true);
    try {
      await customerApi.order.post(
        '/api/v1/orders/:orderId/delay-approval',
        // Only the answer. The minutes are the restaurant's (`order.requestedDelayMinutes`, shown
        // in the prompt); this screen used to send a fixed 15 that the server never read.
        { approved },
        { params: { orderId: order.id } },
      );
      setStatus(approved ? OrderStatus.ACCEPTED : OrderStatus.CANCELLED);
    } catch (e: unknown) {
      console.error('Failed to answer delay request', e);
      showError(messageOf(e, 'Could not send your answer to the restaurant. Try again.'));
    } finally {
      setBusy(false);
    }
  }, [confirm, onAddApiLog, order.id, setStatus, showError]);

  return { busy, cancel, answerDelay };
}
