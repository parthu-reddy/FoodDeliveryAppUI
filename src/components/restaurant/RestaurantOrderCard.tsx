import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Clock, User, MapPin, Bike, XCircle, Check, Send, 
  Flame, CheckCircle2, MessageSquare, RefreshCw
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { Button, Badge, Input, FormField } from '../ui';

// Utility
const getFriendlyDeliveryStatusMessage = (status: string | undefined): string => {
  if (!status) return "Searching...";
  switch (status.toUpperCase()) {
    case 'PENDING': return 'Searching...';
    case 'ASSIGNED': return 'On the way';
    case 'ARRIVED_AT_RESTAURANT': return 'At restaurant';
    case 'PICKED_UP': return 'Out for delivery';
    case 'ARRIVED_AT_CUSTOMER': return 'Arrived at customer';
    case 'DELIVERED': return 'Delivered';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
};

interface RestaurantOrderCardProps {
  order: Order;
  cardDelayStatus?: Record<string, { minutes: number, reason: string }>;
  
  // Status check for styling
  isNewPlaced?: boolean;
  isRequestedDelay?: boolean;
  isCooking?: boolean;
  isPrepared?: boolean;
  isBeingDelivered?: boolean;

  // Actions
  handleStatusTransition: (order: Order) => void;
  setSelectedChatOrder: (order: Order) => void;
  
  // Handlers for the form submissions
  handleCardCancelSubmit: (orderId: string, reason: string) => void;
  handleCardDelaySubmit: (orderId: string, minutes: string, reason: string) => void;
  handleCardPartialRefundSubmit: (orderId: string, amount: string, reason: string) => void;
}

export const RestaurantOrderCard: React.FC<RestaurantOrderCardProps> = ({
  order,
  cardDelayStatus = {},
  isNewPlaced,
  isRequestedDelay,
  isCooking,
  isPrepared,
  isBeingDelivered,
  handleStatusTransition,
  setSelectedChatOrder,
  handleCardCancelSubmit,
  handleCardDelaySubmit,
  handleCardPartialRefundSubmit
}) => {
  // Local state for modals to avoid global record bloat in parent
  const [activeModal, setActiveModal] = useState<'none' | 'cancel' | 'delay' | 'refund'>('none');
  
  // Form fields
  const [cancelReason, setCancelReason] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('10');
  const [delayReason, setDelayReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const submitCancel = () => {
    handleCardCancelSubmit(order.id, cancelReason);
    setActiveModal('none');
    setCancelReason('');
  };

  const submitDelay = () => {
    handleCardDelaySubmit(order.id, delayMinutes, delayReason);
    setActiveModal('none');
    setDelayReason('');
  };

  const submitRefund = () => {
    handleCardPartialRefundSubmit(order.id, refundAmount, refundReason);
    setActiveModal('none');
    setRefundAmount('');
    setRefundReason('');
  };

  const statusStyling = () => {
    if (order.status === OrderStatus.AWAITING_DELAY_APPROVAL) {
      return { ring: 'ring-red-500/20 border-red-500/30', bg: 'bg-red-500/[0.01]' };
    }
    if (order.status === OrderStatus.PREPARING as any) {
      return { ring: 'ring-orange-500/20 border-orange-500/30', bg: 'bg-orange-500/[0.01]' };
    }
    return { ring: 'ring-amber-500/10', bg: 'border-rose-500/20 dark:border-rose-500/30' };
  };
  const styles = statusStyling();

  return (
    <motion.div 
      layoutId={`card-${order.id}`}
      className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl shadow-sm space-y-3.5 relative overflow-hidden transition-all border ${styles.bg} ${styles.ring}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-mono font-bold text-orange-500">#{order.id.substring(0, 8)}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium block">{order.timestamp}</span>
        </div>
        <Badge 
          variant={order.status === OrderStatus.AWAITING_DELAY_APPROVAL ? 'danger' : 'primary'} 
          icon={order.status === OrderStatus.PREPARING as any ? <Flame className="w-3 h-3 text-orange-500 animate-bounce" /> : undefined}
          pulse={order.status === OrderStatus.AWAITING_DELAY_APPROVAL}
          className="shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]"
        >
          {order.status === OrderStatus.AWAITING_DELAY_APPROVAL ? 'ON HOLD' : 
            order.status === OrderStatus.PREPARING as any ? 'COOKING' :
            order.status === OrderStatus.ACCEPTED as any ? 'ACCEPTED' :
            order.status === OrderStatus.READY_FOR_PICKUP as any ? 'READY' :
            order.status === OrderStatus.HANDED_OVER as any ? 'DISPATCHED' :
            'PLACED'}
        </Badge>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-rose-500/20 dark:border-rose-500/30 overflow-hidden divide-y divide-rose-500/10 dark:divide-rose-500/20">
        <div className="p-2.5 space-y-1 text-[11px]">
          <div className="flex items-center justify-between gap-1">
            <p className="font-bold text-slate-700 dark:text-[#f0ede6] flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400 dark:text-slate-300" />
              <span className="truncate max-w-[120px]">{order.customerName}</span>
            </p>
            {order.estimatedCompletionTime && (
              <span className="flex items-center gap-1 text-[9px] text-amber-500 font-bold shrink-0">
                <Clock className="w-2.5 h-2.5" />
                {new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          {order.deliveryAddress && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-300">
              <MapPin className="w-3 h-3 text-rose-450 shrink-0" />
              <span className="truncate max-w-[170px]">{order.deliveryAddress}</span>
            </div>
          )}
        </div>

        <div className="p-2.5 bg-indigo-50/30 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-300 mb-1.5">
            <span className="font-semibold text-[9px] uppercase tracking-wider text-indigo-400/80">Courier</span>
            <span className="font-bold flex items-center gap-1 text-indigo-400 text-[9px] uppercase">
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
              {getFriendlyDeliveryStatusMessage(order.deliveryStatus)}
            </span>
          </div>
          {order.riderName ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-550 shrink-0">
                <Bike className="w-3 h-3" />
              </div>
              <p className="font-bold text-[11px] text-slate-750 dark:text-[#f0ede6] truncate">{order.riderName}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-0.5 text-slate-450">
              <RefreshCw className="w-3 h-3 text-slate-400 dark:text-slate-300 animate-spin shrink-0" />
              <span className="text-[9px]">Awaiting assignment...</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[9px] text-slate-400 dark:text-slate-300 font-extrabold uppercase font-mono">Dishes ({order.items.length})</span>
        <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin pl-1">
          {order.items.map((cartItem: any, idx: number) => (
            <div key={cartItem.item?.id || idx} className="flex justify-between text-[11px]">
              <span className="text-slate-600 dark:text-[#f0ede6] font-medium">
                <span className="font-mono text-orange-500 font-bold pr-1">{cartItem.quantity || 1}x</span> {cartItem.item?.name || cartItem.name || 'Item'}
              </span>
              <span className="text-slate-400 dark:text-slate-300 font-mono">${((cartItem.item?.price || cartItem.price || 0) * (cartItem.quantity || 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {cardDelayStatus[order.id] && (
        <div className="bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[10px] font-bold p-2 rounded-xl border border-amber-500/15 flex items-center gap-1.5 animate-pulse">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Revised ETA (+{cardDelayStatus[order.id].minutes} min) logged with API</span>
        </div>
      )}

      <div className="pt-2.5 border-t border-rose-500/20 dark:border-rose-500/30 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block">Order Value</span>
            <span className="text-xs font-bold text-slate-850 dark:text-[#f0ede6] font-mono">${order.total?.toFixed(2)}</span>
          </div>

          <div className="flex gap-2">
            {!isBeingDelivered && (
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-3.5 h-3.5" />}
                onClick={() => setActiveModal(activeModal === 'cancel' ? 'none' : 'cancel')}
              />
            )}

            {(isCooking || isPrepared || isRequestedDelay) && (
              <Button
                variant="primary"
                size="sm"
                icon={<DollarSign className="w-3.5 h-3.5" />}
                onClick={() => setActiveModal(activeModal === 'refund' ? 'none' : 'refund')}
              />
            )}

            {isNewPlaced && (
              <Button
                variant="warning"
                size="sm"
                className="flex-1"
                icon={<Check className="w-3 h-3 shrink-0" />}
                onClick={() => handleStatusTransition(order)}
              >
                Accept Order
              </Button>
            )}

            {(isCooking || isRequestedDelay) && (
              <>
                {order.status === OrderStatus.ACCEPTED as any ? (
                  <Button
                    variant="warning"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStatusTransition(order)}
                  >
                    Start Cook
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleStatusTransition(order)}
                  >
                    Mark Prepared
                  </Button>
                )}
              </>
            )}
            
            {(isPrepared || isBeingDelivered) && (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => handleStatusTransition(order)}
              >
                Handover to Courier
              </Button>
            )}

            {isNewPlaced && (
               <Button
                 variant="secondary"
                 size="sm"
                 icon={<Clock className="w-3.5 h-3.5" />}
                 onClick={() => setActiveModal(activeModal === 'delay' ? 'none' : 'delay')}
               />
            )}
            
            <Button
              variant="secondary"
              size="sm"
              icon={<MessageSquare className="w-3 h-3 text-blue-500" />}
              onClick={() => setSelectedChatOrder(order)}
            />
          </div>
        </div>

        {/* Drawers */}
        {activeModal === 'cancel' && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <FormField label="Reason for cancellation">
              <Input 
                type="text" 
                placeholder="e.g. Out of stock, Kitchen busy..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </FormField>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setActiveModal('none')}>
                Back
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={submitCancel}>
                Confirm Cancel
              </Button>
            </div>
          </div>
        )}

        {activeModal === 'refund' && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <FormField label="Refund Amount ($)">
              <Input 
                type="number" 
                placeholder="0.00"
                step="0.01"
                min="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </FormField>
            <FormField label="Reason for partial refund">
              <Input 
                type="text" 
                placeholder="e.g. Missing Item..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </FormField>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setActiveModal('none')}>
                Back
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={submitRefund}>
                Issue Refund
              </Button>
            </div>
          </div>
        )}
        
        <AnimatePresence>
          {activeModal === 'delay' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-rose-500/20 dark:border-rose-500/30 pt-2.5 mt-1 space-y-2.5"
            >
              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Delay Duration</label>
                <div className="grid grid-cols-4 gap-1">
                  {['5', '10', '15', '20'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDelayMinutes(m)}
                      className={`py-1 text-[10px] font-mono font-bold rounded-lg border cursor-pointer transition-all ${
                        delayMinutes === m
                          ? 'bg-amber-500 border-transparent text-white'
                          : 'bg-slate-50 dark:bg-slate-955 border-rose-500/20 dark:border-rose-500/30 text-slate-400 dark:text-slate-300'
                      }`}
                    >
                      +{m} Min
                    </button>
                  ))}
                </div>
              </div>

              <FormField label="Reason for delay">
                <Input 
                  type="text"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="e.g. High custom baking orders"
                />
              </FormField>

              <Button
                variant="primary"
                size="sm"
                className="w-full mt-2"
                icon={<Send className="w-3 h-3 text-rose-450" />}
                onClick={submitDelay}
              >
                Submit Delay
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};
