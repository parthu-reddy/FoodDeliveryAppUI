import React from 'react';
import { Badge, Button, Spinner } from '@shared/ui';
import { Check, CheckCircle2, Clock, KeyRound, MessageSquare, Receipt, XCircle } from 'lucide-react';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';
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
  return (
<div className="pt-2.5 border-t border-rose-500/20 dark:border-rose-500/30 flex flex-col gap-2">
{/* `flex-wrap` and no `shrink-0` on the icon group below.
    At six columns this row could not fit: the payout block took `flex-1` while the icon
    buttons were `shrink-0`, so the buttons refused to shrink and overflowed the card --
    the icons rendered on top of the payout text and "Accept Order" was clipped at the card
    edge. Wrapping is the correct behaviour for a row that cannot fit on one line. */}
<div className="flex items-center justify-between gap-3 flex-wrap">
<div className="flex flex-wrap gap-x-4 gap-y-2 flex-1 min-w-0">
<div className="space-y-1">
<span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block truncate">Order Value</span>
<span className="text-xs font-bold text-slate-850 dark:text-[#f0ede6] font-mono">{formatINR(order.totalAmount || 0)}</span>
</div>
<div className="space-y-1">
<span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block truncate">Your Payout</span>
<span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
{order.earnings?.netPayout != null ? formatINR(order.earnings.netPayout) : '---'}
</span>
</div>
</div>

<div className="flex gap-2 flex-wrap">
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
icon={<Receipt className="w-3.5 h-3.5 text-amber-500" />}
onClick={() => setShowDetails(true)}
/>
</div>
</div>

<div className="flex gap-1.5 pt-1.5">
{!isBeingDelivered && (
<Button
variant="danger"
size="sm"
className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20"
icon={<XCircle className="w-3.5 h-3.5" />}
onClick={() => setActiveModal(activeModal === 'cancel' ? 'none' : 'cancel')}
>
Cancel
</Button>
)}

{isRefundRequest && (
<Badge variant="danger" className="animate-pulse">
Action Required: Refund
</Badge>
)}

{isNewPlaced && (
<Button
variant="warning"
size="sm"
className="flex-[2]"
disabled={isSubmitting}
icon={isSubmitting ? <Spinner size="xs" label="" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
onClick={() => {
setIsSubmitting(true);
handleStatusTransition(order);
}}
>
{isSubmitting ? 'Accepting...' : 'Accept Order'}
</Button>
)}

{isCooking && (
<>
{order.status === OrderStatus.ACCEPTED ? (
<Button
variant="warning"
size="sm"
className="flex-[2]"
disabled={isSubmitting}
icon={isSubmitting ? <Spinner size="xs" label="" /> : undefined}
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
className="flex-[2] bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border-amber-500/30"
disabled={isSubmitting}
icon={isSubmitting ? <Spinner size="xs" label="" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
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
className="flex-[2]"
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
</div>
  );
}
