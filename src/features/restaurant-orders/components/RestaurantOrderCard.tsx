import { Order } from '@/types';
import { RestaurantOrderActions } from '@features/restaurant-orders/components/RestaurantOrderActions';
import { RestaurantOrderDrawers } from '@features/restaurant-orders/components/RestaurantOrderDrawers';
import { useCallContext } from '@/contexts/CallContext';
import { StatusPill, surfaceStyle } from '@shared/ui';
import { motion } from 'motion/react';
import { Bike, Clock, User, PhoneCall } from 'lucide-react';
import React, { useState } from 'react';
import { formatINR } from '@shared/money';
import { getFriendlyDeliveryStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { orderStatusView } from '@features/customer-orders/model/orderStatus';
import { acceptDeadline } from '../model/acceptDeadline';
import { AcceptClock } from './AcceptClock';

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

 const view = orderStatusView(order.status, order.deliveryStatus);
 const deadline = isNewPlaced ? acceptDeadline(order) : null;
 // The kitchen ticket (Restaurant.dc.html): cooking orders are dark and set in 20 px type,
 // readable from across a counter on a propped-up tablet. `dark` on the card scopes the
 // .dark token block to this subtree, so paper/ink invert without a hardcoded colour.
 const ticket = !!isCooking;
 const items = (order.items ?? []) as { quantity: number, name?: string, price?: number, item?: { id?: string, name: string, price?: number } }[];
 const who = order.customerName || 'Customer';

 return (
 <motion.div
  style={surfaceStyle({ variant: 'solid', elevation: isNewPlaced ? 2 : 1, radius: 'lg' })}
  className={`p-4 space-y-3.5 relative overflow-hidden ${ticket ? 'dark' : ''}`}
  data-testid="restaurant-order-card" data-order-id={order.id} data-status={order.status}
 >
 <div className="flex justify-between items-start gap-3">
 <div className="min-w-0">
 <span className={`block font-mono font-bold text-ink ${ticket ? 'text-2xl' : 'text-sm'}`}>#{order.id.substring(0, 8).toUpperCase()}</span>
 <span className="text-[11px] font-medium text-ink-2">
 {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
 {order.estimatedCompletionTime ? ` · ready by ${new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
 </span>
 </div>
 <StatusPill label={view.label} tone={view.tone} live={view.live} />
 </div>

 {deadline && (
 <div className="flex items-center gap-4">
 <AcceptClock deadline={deadline} />
 <div className="min-w-0 space-y-1">
 <p className="text-[15px] font-extrabold text-ink">{items.reduce((n, i) => n + (i.quantity || 1), 0)} items · {formatINR(order.totalAmount ?? 0)}</p>
 <p className="text-xs font-medium text-ink-2 truncate">{who}{order.paymentMethod ? ` · pays by ${order.paymentMethod.toLowerCase()}` : ''}</p>
 </div>
 </div>
 )}

 <ul className={ticket ? 'space-y-1.5' : 'space-y-1'} aria-label="Dishes">
 {items.map((cartItem, idx) => (
 <li key={cartItem.item?.id || idx} className={`flex justify-between gap-3 ${ticket ? 'text-[20px] leading-snug font-bold' : 'text-[13px]'}`}>
 <span className="text-ink">
 <span className="font-mono pr-1.5">{cartItem.quantity || 1}×</span>{cartItem.item?.name || cartItem.name || 'Item'}
 </span>
 {!ticket && <span className="font-mono text-ink-2">{formatINR((cartItem.item?.price || cartItem.price || 0) * (cartItem.quantity || 1))}</span>}
 </li>
 ))}
 </ul>

 <div className="flex items-center justify-between gap-2 pt-2 border-t border-paper-line text-xs">
 <span className="flex items-center gap-1.5 min-w-0 text-ink-2">
 <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
 <span className="truncate font-semibold text-ink">{who}</span>
 </span>
 {order.customerId && (
 <button type="button" onClick={() => startCall(order.customerId!, order.id)} aria-label={`Call ${who}`} className="p-1.5 rounded-full text-ink-2">
 <PhoneCall className="w-4 h-4" />
 </button>
 )}
 <span className="flex items-center gap-1.5 min-w-0 text-ink-2">
 <Bike className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
 {order.deliveryExecutiveId ? (
 <span className="truncate font-semibold text-ink">{order.deliveryExecutiveName || 'Rider assigned'}</span>
 ) : (
 <span className="truncate">{getFriendlyDeliveryStatusMessage(order.deliveryStatus)}</span>
 )}
 </span>
 {order.deliveryExecutiveId && (
 <button type="button" onClick={() => startCall(order.deliveryExecutiveId!, order.id)} aria-label={`Call ${order.deliveryExecutiveName || 'the rider'}`} className="p-1.5 rounded-full text-ink-2">
 <PhoneCall className="w-4 h-4" />
 </button>
 )}
 </div>

 {cardDelayStatus[order.id] && (
 <div className="text-xs font-bold p-2 rounded-xl flex items-center gap-1.5" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
 <Clock className="w-3.5 h-3.5 shrink-0" />
 <span>Asked the customer for {cardDelayStatus[order.id].minutes} more minutes</span>
 </div>
 )}

   <RestaurantOrderActions
     order={order}
     activeModal={activeModal}
     isCooking={isCooking}
     isNewPlaced={isNewPlaced}
     isRefundRequest={isRefundRequest}
     isSubmitting={isSubmitting}
     setIsSubmitting={setIsSubmitting}
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
