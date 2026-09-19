import { Clock, PhoneCall, Timer } from 'lucide-react';
import React from 'react';
import type { Order } from '@/types';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { customerApi } from '@/lib/zodiosClients';
import { formatINR } from '@shared/money';
import { Surface } from '@shared/ui';
import { terminalHeadline } from '@features/customer-orders/model/orderStatus';
import { OrderTrackerSteps } from './OrderTrackerSteps';

/**
 * An order that is still happening: where it is, who has it, and what is left to do.
 *
 * Split from `CustomerOrderTracker`, which held this and the settled view — two mutually
 * exclusive 300- and 150-line branches — in one 563-line component.
 */

interface OrderTrackerLiveProps {
  currentTrackingOrder: Order;
  isFailedOrder: (order: Order) => boolean;
  startCall: (userId: string, name: string) => void;
  onAddApiLog?: (log: unknown) => void;
  onUpdateOrder?: (id: string, status: string) => void;
  setInternalOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setTrackingOrder: (order: Order | null) => void;
  showError: (msg: string) => void;
}

export function OrderTrackerLive({
  currentTrackingOrder, isFailedOrder, startCall,
  onAddApiLog, onUpdateOrder, setInternalOrders, showError, setTrackingOrder,
}: OrderTrackerLiveProps) {
  return (
    <>
  {/* Active Status Display Card */}
  <Surface radius="xl" elevation={2} className="p-5 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h4 className="font-bold text-lg">
          {currentTrackingOrder.status === OrderStatus.PENDING_ACCEPTANCE && 'Waiting for Restaurant...'}
          {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL && 'Restaurant Requested Delay'}
          {currentTrackingOrder.status === OrderStatus.ACCEPTED && 'Order Confirmed!'}
          {currentTrackingOrder.status === OrderStatus.PREPARING && 'Kitchen is Cooking...'}
          {currentTrackingOrder.status === OrderStatus.READY_FOR_PICKUP && 'Order is Ready!'}
          {currentTrackingOrder.status === OrderStatus.HANDED_OVER && currentTrackingOrder.deliveryStatus === DeliveryStatus.AT_RESTAURANT && 'Rider is Waiting at Restaurant...'}
          {currentTrackingOrder.status === OrderStatus.HANDED_OVER && currentTrackingOrder.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY && 'Rider is on the Way!'}
          {currentTrackingOrder.status === OrderStatus.HANDED_OVER && !currentTrackingOrder.deliveryStatus && 'Picked Up by Rider!'}
          {currentTrackingOrder.deliveryStatus === DeliveryStatus.FAILED && 'Order Delayed - Finding a Driver...'}
          {currentTrackingOrder.deliveryStatus !== DeliveryStatus.FAILED && isFailedOrder(currentTrackingOrder) && 'Order Failed / Cancelled'}
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-300">
          {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL 
            ? 'Restaurant needs more time to prepare your order. Please wait...'
            : isFailedOrder(currentTrackingOrder)
            // Who ended it, not just that it ended. Before Phase 3 a dispatch failure and a
            // restaurant cancellation were the same status and the customer got the same
            // sentence for both; only one of them is the restaurant's doing.
            ? (terminalHeadline(currentTrackingOrder.status) ?? 'Your order could not be completed and will be refunded.')
            : currentTrackingOrder.deliveryStatus === DeliveryStatus.FAILED
            ? 'We are looking for a nearby delivery partner. Thank you for your patience.'
            : 'Estimated delivery: 15-20 mins'}
        </p>
      </div>
      <div className={`p-2.5 rounded-2xl ${isFailedOrder(currentTrackingOrder) ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
        {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL || isFailedOrder(currentTrackingOrder) ? <Clock className="w-5 h-5 text-rose-500" /> : <Timer className="w-5 h-5" />}
      </div>
    </div>

    {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL && (
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={async () => {
            if (onAddApiLog) {
              onAddApiLog({ id: 'order_approve_delay', label: `POST /api/v1/orders/${currentTrackingOrder.id}/delay-approval`, method: 'POST' });
            }
            
            try {
              await customerApi.order.post('/api/v1/orders/:orderId/delay-approval', {
                approved: true,
                expectedDelayMinutes: 15
              }, { params: { orderId: currentTrackingOrder.id } });
              if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, OrderStatus.ACCEPTED);
              setInternalOrders(prev => prev.map(o => o.id === currentTrackingOrder.id ? { ...o, status: OrderStatus.ACCEPTED } : o));
            } catch (e: unknown) {
              console.error("Failed to approve delay", e);
            }
          }}
          className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
        >
          Approve Delay
        </button>
        <button
          onClick={async () => {
            if (onAddApiLog) {
              onAddApiLog({ id: 'order_reject_delay', label: `POST /api/v1/orders/${currentTrackingOrder.id}/delay-approval`, method: 'POST' });
            }
            
            try {
              await customerApi.order.post('/api/v1/orders/:orderId/delay-approval', {
                approved: false
              }, { params: { orderId: currentTrackingOrder.id } });
              if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, OrderStatus.CANCELLED);
              setInternalOrders(prev => prev.map(o => o.id === currentTrackingOrder.id ? { ...o, status: OrderStatus.CANCELLED } : o));
            } catch (e: unknown) {
              console.error("Failed to reject delay", e);
            }
          }}
          className="flex-1 py-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-200 dark:hover:bg-rose-500/20 transition text-sm"
        >
          Cancel Order
        </button>
      </div>
    )}
    
    {isFailedOrder(currentTrackingOrder) && (
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => {
            // Dismiss from local UI state
            setInternalOrders(prev => prev.filter(o => o.id !== currentTrackingOrder.id));
            setTrackingOrder(null);
          }}
          className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition text-sm"
        >
          Dismiss
        </button>
      </div>
    )}
    
    {(currentTrackingOrder.status === OrderStatus.PENDING_ACCEPTANCE || currentTrackingOrder.status === OrderStatus.CREATED) && (
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={async () => {
            if (onAddApiLog) {
              onAddApiLog({ id: 'cancel_order', label: `POST /api/v1/orders/${currentTrackingOrder.id}/cancel`, method: 'POST' });
            }
            const oldStatus = currentTrackingOrder.status;
            // Optimistic update
            if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, OrderStatus.CANCELLED);
            else {
              setInternalOrders(prev => prev.map(o => o.id === currentTrackingOrder.id ? { ...o, status: OrderStatus.CANCELLED } : o));
            }
            try {
              await customerApi.order.post('/api/v1/orders/:orderId/cancel', undefined, { params: { orderId: currentTrackingOrder.id } });
            } catch (e: unknown) {
              console.error("Failed to cancel order", e);
              const typedErr = e as { response?: { data?: { message?: string } } };
              showError(typedErr.response?.data?.message || "Failed to cancel order");
              // Revert optimistic update
              if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, oldStatus);
              else {
                setInternalOrders(prev => prev.map(o => o.id === currentTrackingOrder.id ? { ...o, status: oldStatus } : o));
              }
            }
          }}
          className="flex-1 py-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-200 dark:hover:bg-rose-500/20 transition text-sm"
        >
          Cancel Order
        </button>
      </div>
    )}

    {currentTrackingOrder.estimatedCompletionTime && !isFailedOrder(currentTrackingOrder) && (
      <Surface radius="lg" elevation={0} className="p-4 flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono tracking-wider">Estimated Time of Arrival</span>
          <span className="text-sm font-semibold">Arriving at {new Date(currentTrackingOrder.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </Surface>
    )}

    {currentTrackingOrder.status !== OrderStatus.AWAITING_DELAY_APPROVAL && !isFailedOrder(currentTrackingOrder) && (
      <Surface radius="lg" elevation={0} className="p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono tracking-wider">Secure Delivery Verification</span>
          <span className="text-sm font-semibold">Share OTP with Rider at delivery</span>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-500 text-white font-mono text-xl font-black px-4 py-2 rounded-xl tracking-wider">
          {(currentTrackingOrder as {otp?: string, distanceKm?: number}).otp}
        </div>
      </Surface>
    )}

    {/* Step checklist */}
            <OrderTrackerSteps
              currentTrackingOrder={currentTrackingOrder}
              isFailedOrder={isFailedOrder}
            />

  </Surface>
  
  {/* Active Order Details */}
  <Surface radius="xl" elevation={0} className="p-6 mt-6">
    <h3 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6] mb-4">Order Details</h3>
    {currentTrackingOrder.restaurantName && (
      <div className="flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
        <span>From: {currentTrackingOrder.restaurantName}</span>
        {currentTrackingOrder.restaurantId && (
          <button 
            onClick={() => startCall(currentTrackingOrder.restaurantId!, currentTrackingOrder.id)}
            className="p-1.5 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 transition-colors"
            title={`Call ${currentTrackingOrder.restaurantName}`}
          >
            <PhoneCall className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
    {currentTrackingOrder.deliveryExecutiveId && (
      <div className="flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
        <span>Rider Assigned</span>
        <button 
          onClick={() => startCall(currentTrackingOrder.deliveryExecutiveId!, currentTrackingOrder.id)}
          className="p-1.5 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 transition-colors"
          title={`Call Rider`}
        >
          <PhoneCall className="w-4 h-4" />
        </button>
      </div>
    )}
    <div className="space-y-3">
      {currentTrackingOrder.items && currentTrackingOrder.items.map((item: unknown, idx: number) => {
        const i = item as { item?: { id?: string; name?: string; price?: number }; quantity?: number; name?: string; price?: number };
        return (
        <div key={idx} className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
          <span>{i.quantity || 1}x {i.item?.name || i.name || 'Item'}</span>
          <span>{formatINR((i.item?.price || i.price || 0) * (i.quantity || 1))}</span>
        </div>
      )})}
    </div>
    
    <div className="pt-4 mt-4 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-2">
      <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
        <span>Items Total</span>
        <span>{formatINR(currentTrackingOrder.itemTotal ?? 0)}</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
        <span>Delivery Fee</span>
        <span>{currentTrackingOrder.deliveryFee !== undefined ? formatINR(currentTrackingOrder.deliveryFee) : formatINR(0)}</span>
      </div>
      {currentTrackingOrder.customerPlatformFee !== undefined && (
        <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
          <span>Platform Fee</span>
          <span>{formatINR(currentTrackingOrder.customerPlatformFee)}</span>
        </div>
      )}
      {currentTrackingOrder.sgst !== undefined && (
        <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
          <span>SGST</span>
          <span>{formatINR(currentTrackingOrder.sgst)}</span>
        </div>
      )}
      {currentTrackingOrder.cgst !== undefined && (
        <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
          <span>CGST</span>
          <span>{formatINR(currentTrackingOrder.cgst)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
        <span>Total Paid</span>
        <span>{formatINR(currentTrackingOrder.totalAmount ?? 0)}</span>
      </div>
      {currentTrackingOrder.paymentMethod && (
        <div className="flex justify-end pt-1">
          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded font-medium border border-slate-200 dark:border-slate-700">
            Paid via {currentTrackingOrder.paymentMethod}
          </span>
        </div>
      )}
    </div>
  </Surface>
    </>
  );
}
