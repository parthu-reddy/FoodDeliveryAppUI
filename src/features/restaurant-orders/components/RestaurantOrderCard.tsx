import { Order, OrderStatus } from '@/types';
import { RestaurantOrderDetailsModal } from '@features/restaurant-orders/components/RestaurantOrderDetailsModal';
import { Badge, Button, FormField, Input } from '@shared/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bike,
    Check,
    CheckCircle2,
    Clock,
    Flame,
    KeyRound,
    MapPin,
    MessageSquare,
    Receipt,
    RefreshCw,
    Send,
    User,
    XCircle
} from 'lucide-react';
import React, { useState } from 'react';

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
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  
  React.useEffect(() => {
    setIsSubmitting(false);
  }, [order.status]);

  
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
    if (order.status === OrderStatus.PREPARING) {
      return { ring: 'ring-orange-500/20 border-orange-500/30', bg: 'bg-orange-500/[0.01]' };
    }
    return { ring: 'ring-amber-500/10', bg: 'border-rose-500/20 dark:border-rose-500/30' };
  };
  const styles = statusStyling();

  return (
    <motion.div 
      layoutId={`card-₹{order.id}`}
      className={`glass-card p-4 space-y-3.5 relative overflow-hidden transition-all ${styles.bg} ${styles.ring}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-mono font-bold text-orange-500">#{order.id.substring(0, 8)}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium block">{order.timestamp}</span>
        </div>
        <Badge 
          variant={order.status === OrderStatus.AWAITING_DELAY_APPROVAL ? 'danger' : 'primary'} 
          icon={order.status === OrderStatus.PREPARING ? <Flame className="w-3 h-3 text-orange-500 animate-bounce" /> : undefined}
          pulse={order.status === OrderStatus.AWAITING_DELAY_APPROVAL}
          className="shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]"
        >
          {order.status === OrderStatus.AWAITING_DELAY_APPROVAL ? 'ON HOLD' : 
            order.status === OrderStatus.PREPARING ? 'COOKING' :
            order.status === OrderStatus.ACCEPTED ? 'ACCEPTED' :
            order.status === OrderStatus.READY_FOR_PICKUP ? 'READY' :
            order.status === OrderStatus.HANDED_OVER ? 'DISPATCHED' :
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
              <span className="text-slate-400 dark:text-slate-300 font-mono">₹{((cartItem.item?.price || cartItem.price || 0) * (cartItem.quantity || 1)).toFixed(2)}</span>
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block">Order Value</span>
            <span className="text-xs font-bold text-slate-850 dark:text-[#f0ede6] font-mono">₹{order.total?.toFixed(2) || '0.00'}</span>
          </div>
          {order.foodCost !== undefined && (
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block">Food Cost</span>
              <span className="text-xs font-bold text-slate-850 dark:text-[#f0ede6] font-mono">₹{order.foodCost.toFixed(2)}</span>
            </div>
          )}
          {order.restaurantPlatformFee !== undefined && order.restaurantPlatformFee > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block">Platform Fee</span>
              <span className="text-xs font-bold text-rose-500 font-mono">-₹{order.restaurantPlatformFee.toFixed(2)}</span>
            </div>
          )}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block">Your Payout</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{order.restaurantPayout !== undefined ? order.restaurantPayout.toFixed(2) : (order.total || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2">
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
            
            <Button
              variant="secondary"
              size="sm"
              icon={<Receipt className="w-3.5 h-3.5 text-emerald-500" />}
              onClick={() => setShowDetails(true)}
            />
          </div>
        </div>

        <div className="flex gap-1.5 pt-1.5">
            {!isBeingDelivered && (
              <Button
                variant="danger"
                size="sm"
                className="flex-1 shadow-none bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20"
                icon={<XCircle className="w-3.5 h-3.5" />}
                onClick={() => setActiveModal(activeModal === 'cancel' ? 'none' : 'cancel')}
              >
                Cancel
              </Button>
            )}

            {isNewPlaced && (
              <Button
                variant="warning"
                size="sm"
                className="flex-[2] shadow-sm"
                disabled={isSubmitting}
                icon={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                onClick={() => {
                  setIsSubmitting(true);
                  handleStatusTransition(order);
                }}
              >
                {isSubmitting ? 'Accepting...' : 'Accept Order'}
              </Button>
            )}

            {(isCooking || isRequestedDelay) && (
              <>
                {order.status === OrderStatus.ACCEPTED ? (
                  <Button
                    variant="warning"
                    size="sm"
                    className="flex-[2] shadow-sm"
                    disabled={isSubmitting}
                    icon={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" /> : undefined}
                    onClick={() => {
                      setIsSubmitting(true);
                      handleStatusTransition(order);
                    }}
                  >
                    {isSubmitting ? 'Starting...' : 'Start Cook'}
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    className="flex-[2] shadow-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    disabled={isSubmitting}
                    icon={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setIsSubmitting(true);
                      handleStatusTransition(order);
                    }}
                  >
                    {isSubmitting ? 'Marking...' : 'Mark Prepared'}
                  </Button>
                )}
              </>
            )}
            
            {(isPrepared || isBeingDelivered) && (
              <Button
                variant="primary"
                size="sm"
                className="flex-[2] shadow-sm"
                icon={!showOtp ? <KeyRound className="w-3.5 h-3.5" /> : undefined}
                onClick={() => {
                  setShowOtp(true);
                  setTimeout(() => setShowOtp(false), 6000);
                }}
              >
                {showOtp ? (
                  <span className="font-mono tracking-widest text-base">
                    {order.pickupOtp || 'N/A'}
                  </span>
                ) : (
                  'Show Handover OTP'
                )}
              </Button>
            )}
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
            <FormField label="Refund Amount (₹)">
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

      <RestaurantOrderDetailsModal
        order={order}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </motion.div>
  );
};
