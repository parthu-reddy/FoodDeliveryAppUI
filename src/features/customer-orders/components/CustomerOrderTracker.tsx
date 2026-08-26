import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock, Timer, X, XCircle } from 'lucide-react';
import React from 'react';
// Use React.lazy for map
const OrderTrackingMap = React.lazy(() => import("@features/maps-tracking/components/OrderTrackingMap"));

import { Order } from '@/types';
import { customerApi } from '@/lib/zodiosClients';
import { asUntyped } from '@/lib/untypedResponse';

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
            <select
              className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-500 dark:text-slate-300 border-none outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-semibold hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
              value={currentTrackingOrder.id}
              onChange={(e) => {
                const order = activeOrders.find((o) => o.id === e.target.value);
                if (order) setTrackingOrder(order);
              }}
            >
              {activeOrders.filter(o => isActiveOrder(o)).map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.id} - {o.status}
                </option>
              ))}
            </select>
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
                    ? 'Your order could not be completed and will be refunded.'
                    : currentTrackingOrder.deliveryStatus === DeliveryStatus.FAILED
                    ? 'We are looking for a nearby delivery partner. Thank you for your patience.'
                    : 'Estimated delivery: 15-20 mins'}
                </p>
              </div>
              <div className={`p-2.5 rounded-2xl ${isFailedOrder(currentTrackingOrder) ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL || isFailedOrder(currentTrackingOrder) ? <Clock className="w-5 h-5 text-red-500" /> : <Timer className="w-5 h-5" />}
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
                  className="flex-1 py-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-200 dark:hover:bg-red-500/20 transition-all text-sm"
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
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all text-sm shadow-xl shadow-red-500/20"
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
                  className="flex-1 py-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-200 dark:hover:bg-red-500/20 transition-all text-sm"
                >
                  Cancel Order
                </button>
              </div>
            )}

            {currentTrackingOrder.estimatedCompletionTime && !isFailedOrder(currentTrackingOrder) && (
              <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-indigo-500/20 dark:border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between mb-4">
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
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-mono text-xl font-black px-4 py-2 rounded-xl tracking-wider shadow-md">
                  {(currentTrackingOrder as {otp?: string, distanceKm?: number}).otp}
                </div>
              </div>
            )}

            {/* Step checklist */}
            {isFailedOrder(currentTrackingOrder) ? (
              <div className="bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 mt-4 mx-2">
                <XCircle className="w-10 h-10 text-rose-500 mb-1" />
                <h3 className="font-black text-rose-600 dark:text-rose-400">Order Cancelled</h3>
                {(!currentTrackingOrder.paymentStatus || ['CREATED', 'PENDING', 'INITIATED', 'FAILED'].includes(currentTrackingOrder.paymentStatus)) && (
                   <p className="text-xs font-semibold text-rose-500/80">This order was cancelled.</p>
                )}
                
                {/* Refund Timeline & ETA */}
                {['REFUND_PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED', 'REFUND_FAILED'].includes(currentTrackingOrder.paymentStatus || '') && (
                  <div className="w-full mt-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 text-left flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Refund Status
                    </h4>
                    
                    <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 text-left space-y-4">
                      {/* Step 1: Initiated */}
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Refund Initiated</p>
                        <p className="text-[10px] text-slate-500">
                          ${(currentTrackingOrder.refundedAmount || currentTrackingOrder.totalAmount || (currentTrackingOrder as {total?: number}).total || 0).toFixed(2)}
                        </p>
                      </div>

                      {/* Step 2: Processing / Completed */}
                      <div className="relative">
                        {currentTrackingOrder.paymentStatus === 'REFUND_PENDING' && (
                          <>
                            <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white dark:ring-slate-900 animate-pulse" />
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Processing with Bank</p>
                            <p className="text-[10px] font-medium text-amber-600/80 dark:text-amber-400/80 mt-1">
                              ETA: 3-5 business days
                            </p>
                          </>
                        )}
                        {(currentTrackingOrder.paymentStatus === 'REFUNDED' || currentTrackingOrder.paymentStatus === 'PARTIALLY_REFUNDED') && (
                          <>
                            <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Refund Successful</p>
                            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                              Credited to original payment method
                            </p>
                          </>
                        )}
                        {currentTrackingOrder.paymentStatus === 'REFUND_FAILED' && (
                          <>
                            <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-white dark:ring-slate-900" />
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Refund Failed</p>
                            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1">
                              Please contact support for assistance
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                            isDone ? 'bg-emerald-500' : 'bg-rose-500/10 dark:bg-rose-500/20'
                          }`} />
                        )}
                        
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border text-[10px] font-bold z-10 transition-colors ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
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

            {!isFailedOrder(currentTrackingOrder) && currentTrackingOrder.paymentStatus === 'PARTIALLY_REFUNDED' && (
              <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-between mt-4 mx-2 border border-emerald-500/20">
                <span>Partial Refund Issued</span>
                <span>₹{(currentTrackingOrder.refundedAmount || 0).toFixed(2)}</span>
              </div>
            )}
          </div>
          
          {/* Active Order Details */}
          <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl mt-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6] mb-4">Order Details</h3>
            {currentTrackingOrder.restaurantName && (
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
                From: {currentTrackingOrder.restaurantName}
              </div>
            )}
            <div className="space-y-3">
              {currentTrackingOrder.items && currentTrackingOrder.items.map((item: unknown, idx: number) => {
                const i = asUntyped<unknown>(item) as { item?: { id?: string; name?: string; price?: number }; quantity?: number; name?: string; price?: number };
                return (
                <div key={idx} className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span>{i.quantity || 1}x {i.item?.name || i.name || 'Item'}</span>
                  <span>₹{((i.item?.price || i.price || 0) * (i.quantity || 1)).toFixed(2)}</span>
                </div>
              )})}
            </div>
            
            <div className="pt-4 mt-4 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                <span>Items Total</span>
                <span>₹{currentTrackingOrder.itemTotal !== undefined ? currentTrackingOrder.itemTotal.toFixed(2) : (currentTrackingOrder.items ? currentTrackingOrder.items.reduce((sum: number, item: unknown) => { const i = asUntyped<unknown>(item) as { item?: { price?: number }, price?: number, quantity?: number }; return sum + ((i.item?.price || i.price || 0) * (i.quantity || 1))}, 0).toFixed(2) : '0.00')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                <span>Delivery Fee</span>
                <span>₹{currentTrackingOrder.deliveryFee !== undefined ? currentTrackingOrder.deliveryFee.toFixed(2) : '0.00'}</span>
              </div>
              {currentTrackingOrder.customerPlatformFee !== undefined && (
                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span>Platform Fee</span>
                  <span>₹{currentTrackingOrder.customerPlatformFee.toFixed(2)}</span>
                </div>
              )}
              {currentTrackingOrder.sgst !== undefined && (
                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span>SGST</span>
                  <span>₹{currentTrackingOrder.sgst.toFixed(2)}</span>
                </div>
              )}
              {currentTrackingOrder.cgst !== undefined && (
                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span>CGST</span>
                  <span>₹{currentTrackingOrder.cgst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Total Paid</span>
                <span>₹{(currentTrackingOrder.totalAmount || (currentTrackingOrder as {total?: number}).total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-6 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-6">
          <div className="text-center pb-4 border-b border-rose-500/10 dark:border-slate-800">
            <div className="inline-flex w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 items-center justify-center mb-3">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-black mb-1 capitalize">{getFriendlyStatusMessage(currentTrackingOrder.status, currentTrackingOrder.deliveryStatus)}</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">#{currentTrackingOrder.id.substring(0, 8)}</p>
            
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
            <h3 className="font-semibold text-lg text-slate-900 dark:text-[#f0ede6]">{currentTrackingOrder.restaurantName}</h3>
            <div className="space-y-3">
              {currentTrackingOrder.items && currentTrackingOrder.items.map((item: unknown, idx: number) => {
                const i = asUntyped<unknown>(item) as { item?: { id?: string; name?: string; price?: number }; quantity?: number; name?: string; price?: number };
                return (
                <div key={idx} className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span>{i.quantity || 1}x {i.item?.name || i.name || 'Item'}</span>
                  <span>₹{((i.item?.price || i.price || 0) * (i.quantity || 1)).toFixed(2)}</span>
                </div>
              )})}
            </div>
            
            <div className="pt-4 border-t border-dashed border-rose-500/20 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                <span>Items Total</span>
                <span>₹{currentTrackingOrder.itemTotal !== undefined ? currentTrackingOrder.itemTotal.toFixed(2) : (currentTrackingOrder.items ? currentTrackingOrder.items.reduce((sum: number, item: unknown) => { const i = asUntyped<unknown>(item) as { item?: { price?: number }, price?: number, quantity?: number }; return sum + ((i.item?.price || i.price || 0) * (i.quantity || 1)) }, 0).toFixed(2) : '0.00')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                <span>Delivery Fee {(currentTrackingOrder as {otp?: string, distanceKm?: number}).distanceKm ? `(${(currentTrackingOrder as {otp?: string, distanceKm?: number}).distanceKm} km)` : ''}</span>
                <span>₹{currentTrackingOrder.deliveryFee !== undefined ? currentTrackingOrder.deliveryFee.toFixed(2) : '0.00'}</span>
              </div>
              {currentTrackingOrder.customerPlatformFee !== undefined && (
                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span>Platform Fee</span>
                  <span>₹{currentTrackingOrder.customerPlatformFee.toFixed(2)}</span>
                </div>
              )}
              {currentTrackingOrder.sgst !== undefined && (
                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span>SGST</span>
                  <span>₹{currentTrackingOrder.sgst.toFixed(2)}</span>
                </div>
              )}
              {currentTrackingOrder.cgst !== undefined && (
                <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span>CGST</span>
                  <span>₹{currentTrackingOrder.cgst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-rose-500/20 dark:border-slate-700">
                <span>{isFailedOrder(currentTrackingOrder) ? 'Total Refunded' : 'Total Paid'}</span>
                <span className={isFailedOrder(currentTrackingOrder) ? 'text-red-500' : ''}>₹{(currentTrackingOrder.totalAmount || (currentTrackingOrder as {total?: number}).total || 0).toFixed(2)}</span>
              </div>
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
    </motion.div>
  );
};
