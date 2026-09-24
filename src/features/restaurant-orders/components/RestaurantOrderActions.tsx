import React from 'react';
import { Badge, Button } from '@shared/ui';
import { Check, CheckCircle2, Clock, KeyRound, MessageSquare, Receipt, XCircle } from 'lucide-react';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';
import { promisedPrepMinutes } from '../model/acceptDeadline';
import { formatINR } from '@shared/money';

/**
 * The money, the pickup OTP, and whatever the restaurant can do to this order right now.
 *
 * Which actions appear depends on where the order is: a new one can be accepted or rejected,
 * a cooking one can be marked ready or delayed, a delivered one can be refunded. That is why
 * they live together — the set is one decision, not five independent buttons.
 */

/**
 * Typed, deliberately.
 *
 * This was `Record<string, any> & { order: Order }`, which made every prop optional and of
 * type `any`. `RestaurantOrderCard` never passed `setIsSubmitting`, so it was `undefined`
 * here, and `onClick={() => { setIsSubmitting(true); handleStatusTransition(order); }}` threw
 * `TypeError: setIsSubmitting is not a function` on its FIRST line -- before the transition
 * ever ran. Accept Order, Start Cooking and Mark Ready were all dead, silently: the throw
 * happens inside a React event handler, so nothing reached the user but a button that did
 * nothing. Confirmed live on 2026-09-19 against a real PENDING_ACCEPTANCE order.
 *
 * The `any` bag is what hid it. With these types, omitting a prop is a compile error.
 */
type ModalKind = 'none' | 'cancel' | 'delay' | 'refund';

interface Props {
  order: Order;
  isCooking?: boolean;
  isNewPlaced?: boolean;
  isRefundRequest?: boolean;
  isPrepared?: boolean;
  isBeingDelivered?: boolean;
  isSubmitting: boolean;
  showOtp: boolean;
  activeModal: ModalKind;
  setShowOtp: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDetails: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveModal: React.Dispatch<React.SetStateAction<ModalKind>>;
  setSelectedChatOrder: (order: Order) => void;
  handleStatusTransition: (order: Order) => void;
}

export function RestaurantOrderActions(props: Props) {
  const {
    order, isCooking, isNewPlaced, isRefundRequest, isSubmitting, showOtp, activeModal,
    setShowOtp, setActiveModal, setSelectedChatOrder, handleStatusTransition,
    setShowDetails, setIsSubmitting, isPrepared, isBeingDelivered,
  } = props;
  const payout = order.earnings?.netPayout ?? (order as { restaurantPayout?: number }).restaurantPayout;
  return (
<div className="pt-2.5 border-t border-paper-line flex flex-col gap-2">
{/* `flex-wrap`: at six columns this row could not fit on one line and the icon buttons
    overflowed the card. Wrapping is the correct behaviour for a row that cannot fit. */}
<div className="flex items-center justify-between gap-3 flex-wrap">
<div className="flex flex-wrap gap-x-4 gap-y-2 flex-1 min-w-0">
<div className="space-y-0.5">
<span className="text-[9px] text-ink-2 uppercase font-mono block truncate">Order value</span>
<span className="text-xs font-bold text-ink font-mono">{formatINR(order.totalAmount || 0)}</span>
</div>
<div className="space-y-0.5">
<span className="text-[9px] text-ink-2 uppercase font-mono block truncate">Your payout</span>
{/* The restaurant API sends `restaurantPayout`; this read only `earnings.netPayout`, a
    field it never sets, so every card showed "---". */}
<span className="text-xs font-bold text-success font-mono">
{payout != null ? formatINR(payout) : '—'}
</span>
</div>
</div>

<div className="flex gap-2 flex-wrap">
{isNewPlaced && (
<Button variant="secondary" size="sm" aria-label="Ask the customer for more time" title="Ask for more time"
icon={<Clock className="w-3.5 h-3.5" />}
onClick={() => setActiveModal(activeModal === 'delay' ? 'none' : 'delay')} />
)}
<Button variant="secondary" size="sm" aria-label="Message the customer" title="Message"
icon={<MessageSquare className="w-3.5 h-3.5" />}
onClick={() => setSelectedChatOrder(order)} />
<Button variant="secondary" size="sm" aria-label="Order details" title="Order details"
icon={<Receipt className="w-3.5 h-3.5" />}
onClick={() => setShowDetails(true)} />
</div>
</div>

{isRefundRequest && (
<Badge variant="danger">Refund requested — review in details</Badge>
)}

<div className="flex gap-2 pt-1">
{/* Primary action is the filled one. On an incoming order that is Accept; Reject used to be
    the loud red button and Accept a faint outline beside it. */}
{!isBeingDelivered && (
<Button
variant="secondary"
size={isNewPlaced ? 'md' : 'sm'}
className={isNewPlaced ? 'flex-1' : ''}
icon={isNewPlaced ? undefined : <XCircle className="w-3.5 h-3.5" />}
onClick={() => setActiveModal(activeModal === 'cancel' ? 'none' : 'cancel')}
>
{isNewPlaced ? 'Reject' : 'Cancel'}
</Button>
)}

{isNewPlaced && (
<Button
variant="primary"
className="flex-[2]"
disabled={isSubmitting}
loading={isSubmitting}
icon={<Check className="w-4 h-4 shrink-0" />}
onClick={() => { setIsSubmitting(true); handleStatusTransition(order); }}
>
{isSubmitting ? 'Accepting…' : <>Accept <span className="font-mono font-medium opacity-90">· {promisedPrepMinutes(order as { prepTime?: number; additionalPrepTime?: number })} min</span></>}
</Button>
)}

{isCooking && (
<Button
variant={order.status === OrderStatus.ACCEPTED ? 'primary' : 'success'}
className="flex-1"
disabled={isSubmitting}
loading={isSubmitting}
icon={order.status === OrderStatus.ACCEPTED ? undefined : <CheckCircle2 className="w-4 h-4" />}
onClick={() => { setIsSubmitting(true); handleStatusTransition(order); }}
>
{order.status === OrderStatus.ACCEPTED ? (isSubmitting ? 'Starting…' : 'Start cooking') : (isSubmitting ? 'Marking…' : 'Mark ready')}
</Button>
)}

{(isPrepared || isBeingDelivered) && (
<Button
variant="primary"
className="flex-1"
icon={!showOtp ? <KeyRound className="w-3.5 h-3.5" /> : undefined}
onClick={() => { setShowOtp(true); setTimeout(() => setShowOtp(false), 6000); }}
>
{showOtp ? <span className="font-mono tracking-widest text-base">{order.pickupOtp || 'N/A'}</span> : 'Show pickup code'}
</Button>
)}
</div>
</div>
  );
}
