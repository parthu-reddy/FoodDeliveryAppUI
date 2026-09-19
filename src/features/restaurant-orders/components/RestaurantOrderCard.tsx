import { Order, OrderStatus } from '@/types';
import { RestaurantOrderActions } from '@features/restaurant-orders/components/RestaurantOrderActions';
import { RestaurantOrderDrawers } from '@features/restaurant-orders/components/RestaurantOrderDrawers';
import { useCallContext } from '@/contexts/CallContext';
import { Badge, Spinner, surfaceStyle } from '@shared/ui';
import { motion } from 'motion/react';
import {
 Bike,
 Clock,
 Flame,
 User,
 PhoneCall
} from 'lucide-react';
import React, { useState } from 'react';
import { formatINR } from '@shared/money';
import { getFriendlyDeliveryStatusMessage } from '@features/customer-orders/model/statusMessaging';

// Utility

interface RestaurantOrderCardProps {
 order: Order;
 cardDelayStatus?: Record<string, { minutes: number, reason: string }>;
 
 // Status check for styling
 isNewPlaced?: boolean;
 isRequestedDelay?: boolean;
 isCooking?: boolean;
 isPrepared?: boolean;
 isBeingDelivered?: boolean;
 isRefundRequest?: boolean;

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
 // Passed by RestaurantOrderQueue but not read here; renamed to satisfy the unused-args rule
 // rather than dropped, so the caller keeps compiling.
 isRequestedDelay: _isRequestedDelay,
 isCooking,
 isPrepared,
 isBeingDelivered,
 isRefundRequest,
 handleStatusTransition,
 setSelectedChatOrder,
 handleCardCancelSubmit,
 handleCardDelaySubmit,
 handleCardPartialRefundSubmit
}) => {
 const { startCall } = useCallContext();
 // Local state for modals to avoid global record bloat in parent
 const [activeModal, setActiveModal] = useState<'none' | 'cancel' | 'delay' | 'refund'>('none');
 const [showDetails, setShowDetails] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [showOtp, setShowOtp] = useState(false);
 
 React.useEffect(() => {
 // eslint-disable-next-line react-hooks/set-state-in-effect
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
 return { ring: 'ring-rose-500/20 border-rose-500/30', bg: 'bg-rose-500/[0.01]' };
 }
 if (order.status === OrderStatus.PREPARING) {
 return { ring: 'ring-amber-500/20 border-amber-500/30', bg: 'bg-amber-500/[0.01]' };
 }
 return { ring: 'ring-amber-500/10', bg: 'border-rose-500/20 dark:border-rose-500/30' };
 };
 const styles = statusStyling();

 return (
 <motion.div 
  style={surfaceStyle({ variant: 'glass-chrome', elevation: 3, radius: 'lg' })}
          className={`p-4 space-y-3.5 relative overflow-hidden transition ${styles.bg} ${styles.ring}`}
 >
 <div className="flex justify-between items-start">
 <div>
 <span className="text-xs font-mono font-bold text-amber-500">#{order.id.substring(0, 8)}</span>
 <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium block">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Badge 
 variant={order.status === OrderStatus.AWAITING_DELAY_APPROVAL ? 'danger' : 'primary'} 
 icon={order.status === OrderStatus.PREPARING ? <Flame className="w-3 h-3 text-amber-500 animate-bounce" /> : undefined}
 pulse={order.status === OrderStatus.AWAITING_DELAY_APPROVAL}
 >
 {order.status === OrderStatus.AWAITING_DELAY_APPROVAL ? 'ON HOLD' : 
 order.status === OrderStatus.PREPARING ? 'COOKING' :
 order.status === OrderStatus.ACCEPTED ? 'ACCEPTED' :
 order.status === OrderStatus.READY_FOR_PICKUP ? 'READY' :
 order.status === OrderStatus.HANDED_OVER ? 'DISPATCHED' :
 'PLACED'}
 </Badge>
 </div>
 </div>

 <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-rose-500/20 dark:border-rose-500/30 overflow-hidden divide-y divide-rose-500/10 dark:divide-rose-500/20">
 <div className="p-2.5 space-y-1 text-[11px]">
 <div className="flex items-center justify-between gap-1">
 <div className="flex items-center gap-2">
 <p className="font-bold text-slate-700 dark:text-[#f0ede6] flex items-center gap-1">
 <User className="w-3 h-3 text-slate-400 dark:text-slate-300" />
 <span className="truncate max-w-[120px]">Customer #{order.customerId?.substring(0, 8) || order.id?.substring(0, 8)}</span>
 </p>
 {order.customerId && (
 <button
 type="button"
 onClick={() => startCall(order.customerId!, order.id)}
 className="p-1 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 transition-colors"
 title="Call Customer"
 >
 <PhoneCall className="w-3 h-3" />
 </button>
 )}
 </div>
 {order.estimatedCompletionTime && (
 <span className="flex items-center gap-1 text-[9px] text-amber-500 font-bold shrink-0">
 <Clock className="w-2.5 h-2.5" />
 {new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 )}
 </div>
 </div>

 <div className="p-2.5 bg-rose-50/30 dark:bg-rose-950/20">
 <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-300 mb-1.5">
 <span className="font-semibold text-[9px] uppercase tracking-wider text-rose-400/80">Courier</span>
 <span className="font-bold flex items-center gap-1 text-rose-400 text-[9px] uppercase">
 <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />
 {getFriendlyDeliveryStatusMessage(order.deliveryStatus)}
 </span>
 </div>
 {order.deliveryExecutiveId ? (
 <div className="flex items-center justify-between w-full">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-550 shrink-0">
 <Bike className="w-3 h-3" />
 </div>
 <p className="font-bold text-[11px] text-slate-750 dark:text-[#f0ede6] truncate">Rider #{order.deliveryExecutiveId.substring(0, 4)}</p>
 </div>
 {order.deliveryExecutiveId && (
 <button
 type="button"
 onClick={() => startCall(order.deliveryExecutiveId!, order.id)}
 className="p-1 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 transition-colors"
 title={`Call Rider`}
 >
 <PhoneCall className="w-3 h-3" />
 </button>
 )}
 </div>
 ) : (
 <div className="flex items-center gap-2 py-0.5 text-slate-450">
 <Spinner size="xs" label="" />
 <span className="text-[9px]">Awaiting assignment...</span>
 </div>
 )}
 </div>
 </div>

 <div className="space-y-1">
 <span className="text-[9px] text-slate-400 dark:text-slate-300 font-extrabold uppercase font-mono">Dishes ({order.items?.length || 0})</span>
 <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin pl-1">
 { }
 {order.items?.map((cartItem: { quantity: number, name?: string, price?: number, item?: { id?: string, name: string, price?: number } }, idx: number) => (
 <div key={cartItem.item?.id || idx} className="flex justify-between text-[11px]">
 <span className="text-slate-600 dark:text-[#f0ede6] font-medium">
 <span className="font-mono text-amber-500 font-bold pr-1">{cartItem.quantity || 1}x</span> {cartItem.item?.name || cartItem.name || 'Item'}
 </span>
 <span className="text-slate-400 dark:text-slate-300 font-mono">{formatINR((cartItem.item?.price || cartItem.price || 0) * (cartItem.quantity || 1))}</span>
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

   <RestaurantOrderActions
     order={order}
     activeModal={activeModal}
     isCooking={isCooking}
     isNewPlaced={isNewPlaced}
     isRefundRequest={isRefundRequest}
     isSubmitting={isSubmitting}
     showOtp={showOtp}
     setShowOtp={setShowOtp}
     setActiveModal={setActiveModal}
     setShowDetails={setShowDetails}
     isPrepared={isPrepared}
     isBeingDelivered={isBeingDelivered}
     setSelectedChatOrder={setSelectedChatOrder}
     handleStatusTransition={handleStatusTransition}
   />
   <RestaurantOrderDrawers
     activeModal={activeModal}
     setActiveModal={setActiveModal}
     setShowDetails={setShowDetails}
     isPrepared={isPrepared}
     isBeingDelivered={isBeingDelivered}
     order={order}
     showDetails={showDetails}
     cancelReason={cancelReason}
     setCancelReason={setCancelReason}
     submitCancel={submitCancel}
     refundAmount={refundAmount}
     setRefundAmount={setRefundAmount}
     refundReason={refundReason}
     setRefundReason={setRefundReason}
     submitRefund={submitRefund}
     delayMinutes={delayMinutes}
     setDelayMinutes={setDelayMinutes}
     delayReason={delayReason}
     setDelayReason={setDelayReason}
     submitDelay={submitDelay}
   />
 </motion.div>
 );
};
