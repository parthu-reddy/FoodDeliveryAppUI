import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Clock, Star, Timer, X, XCircle, PhoneCall } from 'lucide-react';
import React, { useState } from 'react';
import { RateOrderModal } from '@features/reviews';
import { formatINR } from '@shared/money';
// Use React.lazy for map
const OrderTrackingMap = React.lazy(() => import("@features/maps-tracking/components/OrderTrackingMap"));
import { useCallContext } from '@/contexts/CallContext';

import { Order } from '@/types';
import { customerApi } from '@/lib/zodiosClients';
import { terminalHeadline } from '@features/customer-orders/model/orderStatus';
import { useOrderRefunds } from '@features/customer-orders/model/useOrderRefunds';
import { Select } from '@shared/ui';

interface CustomerOrderTrackerProps {
  currentTrackingOrder: Order;
  setTrackingOrder: (order: Order | null) => void;
  isActiveOrder: (order: Order) => boolean;
  activeOrders: Order[];
  isFailedOrder: (order: Order) => boolean;
  onAddApiLog?: (log: unknown) => void;
  onUpdateOrder?: (id: string, status: string) => void;
  setInternalOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  showError: (msg: string) => void;
  getFriendlyStatusMessage: (status: string, deliveryStatus?: string) => string;
}

export const CustomerOrderTracker: React.FC<CustomerOrderTrackerProps> = ({
  currentTrackingOrder,
  setTrackingOrder,
  isActiveOrder,
  activeOrders,
  isFailedOrder,
  onAddApiLog,
  onUpdateOrder,
  setInternalOrders,
  showError,
  getFriendlyStatusMessage,
}) => {
  const { startCall } = useCallContext();
  const refunds = useOrderRefunds(currentTrackingOrder?.id, isFailedOrder(currentTrackingOrder));
  const [orderIdToRate, setOrderIdToRate] = useState<string | null>(null);
  return (
    <motion.div
      key="tracking"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-5 space-y-5"
    >
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setTrackingOrder(null)}
          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:text-[#f0ede6] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg flex items-center gap-2">
          {isActiveOrder(currentTrackingOrder) ? 'Order Tracking' : 'Order Details'}
          {activeOrders.filter(o => isActiveOrder(o)).length > 1 ? (
            <Select
              selectSize="sm"
              aria-label="Which order to track"
              className="w-56"
              value={currentTrackingOrder.id}
              onChange={(id: string) => {
                const order = activeOrders.find((o) => o.id === id);
                if (order) setTrackingOrder(order);
              }}
              options={activeOrders
                .filter((o) => isActiveOrder(o))
                .map((o) => ({ value: o.id, label: `#${o.id} - ${o.status}` }))}
            />
          ) : (
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300">#{currentTrackingOrder.id}</span>
          )}
        </h3>
      </div>

      {isActiveOrder(currentTrackingOrder) && !isFailedOrder(currentTrackingOrder) ? (
        <>
          {/* Immersive Delivery map (Vector path simulation) */}
          <div className="relative w-full h-44 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl overflow-hidden shadow-inner">
            <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">Loading map...</div>}>
              <OrderTrackingMap order={currentTrackingOrder} enableLiveTracking={true} />
            </React.Suspense>
          </div>

          {/* Active Status Display Card */}
          <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-4">
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
                  className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition text-sm shadow-xl shadow-rose-500/20"
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
              <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono tracking-wider">Estimated Time of Arrival</span>
                  <span className="text-sm font-semibold">Arriving at {new Date(currentTrackingOrder.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}

            {currentTrackingOrder.status !== OrderStatus.AWAITING_DELAY_APPROVAL && !isFailedOrder(currentTrackingOrder) && (
              <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono tracking-wider">Secure Delivery Verification</span>
                  <span className="text-sm font-semibold">Share OTP with Rider at delivery</span>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-amber-500 text-white font-mono text-xl font-black px-4 py-2 rounded-xl tracking-wider shadow-md">
                  {(currentTrackingOrder as {otp?: string, distanceKm?: number}).otp}
                </div>
              </div>
            )}

            {/* Step checklist */}
            {isFailedOrder(currentTrackingOrder) ? (
              <div className="bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 mt-4 mx-2">
                <XCircle className="w-10 h-10 text-rose-500 mb-1" />
                <h3 className="font-black text-rose-600 dark:text-rose-400">Order Cancelled</h3>

              </div>
            ) : (
              <div className="space-y-0 pt-4 px-2">
                {(() => {
                  const UI_STEPS = [
                    { status: OrderStatus.PENDING_ACCEPTANCE, label: 'Order Received' },
                    { status: OrderStatus.ACCEPTED, label: 'Accepted by Kitchen' },
                    { status: OrderStatus.PREPARING, label: 'Cooking & Packaging' },
                    { status: OrderStatus.HANDED_OVER, label: 'Picked up by Delivery Executive' },
                    { status: DeliveryStatus.DELIVERED, label: 'Handed Over & Verified' }
                  ];

                  return UI_STEPS.map((step, idx, arr) => {
                    const stepStatusIndex = UI_STEPS.findIndex(s => s.status === step.status);
                    const currentStatusIndex = UI_STEPS.findIndex(s => s.status === (currentTrackingOrder.deliveryStatus === DeliveryStatus.DELIVERED ? DeliveryStatus.DELIVERED : currentTrackingOrder.status));
                    const isDone = currentStatusIndex > stepStatusIndex || (currentStatusIndex === stepStatusIndex && step.status !== DeliveryStatus.DELIVERED);
                    const isCurrent = currentStatusIndex === stepStatusIndex || (step.status === OrderStatus.PREPARING && [OrderStatus.READY_FOR_PICKUP, OrderStatus.HANDED_OVER].includes(currentTrackingOrder.status as OrderStatus));
                    const isLast = idx === arr.length - 1;
                
                    return (
                      <div key={idx} className="flex items-start gap-4 relative">
                        {/* Vertical line connector */}
                        {!isLast && (
                          <div className={`absolute left-3 top-6 bottom-[-6px] w-[2px] -ml-[1px] ${
                            isDone ? 'bg-amber-500' : 'bg-rose-500/10 dark:bg-rose-500/20'
                          }`} />
                        )}
                        
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border text-[10px] font-bold z-10 transition-colors ${
                          isDone 
                            ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                            : isCurrent
                              ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)] ring-4 ring-amber-500/20'
                              : 'bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border-rose-500/30 dark:border-rose-500/30 text-slate-400 dark:text-slate-500'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        
                        <div className={`pb-6 ${isLast ? 'pb-2' : ''}`}>
                          <span className={`text-sm tracking-wide ${
                            isDone 
                              ? 'font-extrabold text-slate-800 dark:text-[#f0ede6]' 
                              : isCurrent 
                                ? 'font-black text-amber-500'
                                : 'font-semibold text-slate-400 dark:text-slate-500'
                          }`}>
                            {step.label}
                          </span>
                          {isCurrent && currentTrackingOrder.deliveryStatus !== DeliveryStatus.DELIVERED && (
                            <p className="text-[11px] text-amber-500/80 mt-0.5 font-bold uppercase tracking-wider">
                              {currentTrackingOrder.status === OrderStatus.READY_FOR_PICKUP 
                                ? 'Waiting for Driver...' 
                                : 'Currently in progress...'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

          </div>
          
          {/* Active Order Details */}
          <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl mt-6">
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
          </div>
        </>
      ) : (
        <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-6 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-6">
          <div className="text-center pb-4 border-b border-rose-500/10 dark:border-slate-800">
            <div className="inline-flex w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 items-center justify-center mb-3">
              <X className="w-6 h-6 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black mb-1 capitalize">{getFriendlyStatusMessage(currentTrackingOrder.status, currentTrackingOrder.deliveryStatus)}</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">#{currentTrackingOrder.id.substring(0, 8)}</p>

            {/* Who ended it, and why. Phase 3 made a dispatch failure a different status from a
                restaurant cancellation because they mean different things to the customer; this is
                the only place that difference reaches them. */}
            {terminalHeadline(currentTrackingOrder.status) && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300" data-testid="terminal-headline">
                {terminalHeadline(currentTrackingOrder.status)}
              </p>
            )}
            {currentTrackingOrder.cancellationReason && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic" data-testid="cancellation-reason">
                {currentTrackingOrder.cancellationReason}
              </p>
            )}
            {/* The moment the food has actually arrived is when someone has an opinion worth
                capturing. Offered once, here, and otherwise left to order history -- a prompt that
                follows the customer around is nagging, not a feature. */}
            {currentTrackingOrder.deliveryStatus === DeliveryStatus.DELIVERED && (
              <button
                type="button"
                onClick={() => setOrderIdToRate(currentTrackingOrder.id as string)}
                data-testid="rate-order-prompt"
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                <Star className="w-4 h-4" />
                How was it? Rate this order
              </button>
            )}

            {refunds.length > 0 && (
              <div className="mt-3 space-y-1 text-left" data-testid="refund-state">
                {refunds.map(refund => (
                  <div key={refund.id} className="text-xs bg-slate-500/5 border border-slate-500/20 rounded-xl p-3 space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span>Refund {formatINR(refund.amount ?? 0)}</span>
                      <span>{refund.status}</span>
                    </div>
                    <p className="text-slate-400 dark:text-slate-300">
                      {refund.destination === 'STORE_CREDIT'
                        ? 'Returned as store credit in your wallet'
                        : refund.destination === 'NONE'
                        ? 'Nothing was charged, so there is nothing to return'
                        : 'Returned to your original payment method'}
                      {refund.expectedBy ? ` — expected by ${new Date(refund.expectedBy).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Invoice Details */}
            <div className="mt-4 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {currentTrackingOrder.restaurantName && (
                <div className="flex justify-between">
                  <span>Restaurant</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{currentTrackingOrder.restaurantName}</span>
                </div>
              )}
              {currentTrackingOrder.createdAt && (
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(currentTrackingOrder.createdAt).toLocaleString()}</span>
                </div>
              )}
              {currentTrackingOrder.deliveryAddress && (
                <div className="flex justify-between mt-2 pt-2 border-t border-rose-500/10 dark:border-slate-700/50">
                  <span>Delivery To</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right max-w-[200px] leading-tight truncate">{currentTrackingOrder.deliveryAddress}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-[#f0ede6]">{currentTrackingOrder.restaurantName}</h3>
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
            
            <div className="pt-4 border-t border-dashed border-rose-500/20 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                <span>Items Total</span>
                <span>{formatINR(currentTrackingOrder.itemTotal ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                <span>Delivery Fee {(currentTrackingOrder as {otp?: string, distanceKm?: number}).distanceKm ? `(${(currentTrackingOrder as {otp?: string, distanceKm?: number}).distanceKm} km)` : ''}</span>
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
              <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-rose-500/20 dark:border-slate-700">
                <span>{isFailedOrder(currentTrackingOrder) ? 'Total Refunded' : 'Total Paid'}</span>
                <span className={isFailedOrder(currentTrackingOrder) ? 'text-rose-500' : ''}>{formatINR(currentTrackingOrder.totalAmount || 0)}</span>
              </div>
              {currentTrackingOrder.paymentMethod && (
                <div className="flex justify-end pt-1 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded font-medium border border-slate-200 dark:border-slate-700 inline-block mb-1">
                      {isFailedOrder(currentTrackingOrder) ? 'Refunded to ' : 'Paid via '}{currentTrackingOrder.paymentMethod}
                    </span>
                    {isFailedOrder(currentTrackingOrder) && (
                      <span className="text-[10px] text-slate-400">Refunds may take 3-5 business days to reflect in your account.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick action / note */}
      <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-center">
        <p className="text-xs text-amber-500 leading-relaxed">
          👉 <strong>How to complete?</strong> You can switch roles from the top menu, navigate to the <strong>Restaurant View</strong> to accept/cook, then to the <strong>Delivery Partner View</strong> to navigate and insert the OTP!
        </p>
      </div>

      {orderIdToRate && (
        <RateOrderModal
          isOpen={!!orderIdToRate}
          onClose={() => setOrderIdToRate(null)}
          orderId={orderIdToRate}
        />
      )}
    </motion.div>
  );
};
