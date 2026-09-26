import { Send } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import type { Order } from '@/types';
import { Button, FormField, Input, useMotionPresets } from '@shared/ui';
import { RestaurantOrderDetailsModal } from '@features/restaurant-orders/components/RestaurantOrderDetailsModal';

/**
 * The three things a restaurant can do to an order that need a reason first — cancel it,
 * refund part of it, ask the customer to accept a delay — plus the details view.
 *
 * All four were at the bottom of a 474-line order card. Each of the three either ends an
 * order or moves money, which is why each asks for a reason before it commits.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any> & { order: Order };

export function RestaurantOrderDrawers(props: Props) {
  const presets = useMotionPresets();
  const {
    activeModal, setActiveModal, order, showDetails, setShowDetails,
    cancelReason, setCancelReason, submitCancel,
    refundAmount, setRefundAmount, refundReason, setRefundReason, submitRefund,
    delayMinutes, setDelayMinutes, delayReason, setDelayReason, submitDelay,
  } = props;
  return (
    <>
{/* Drawers */}
{activeModal === 'cancel' && (
<div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-2 duration-200">
{/* Required (REST-ACCEPT-11): this ends the customer's order, and their cancelled screen
    shows this reason. It could be sent blank. */}
<FormField label="Reason for cancellation" required hint="The customer sees this.">
<Input 
type="text" 
required
placeholder="e.g. Out of stock, Kitchen busy..."
value={cancelReason}
onChange={(e) => setCancelReason(e.target.value)}
/>
</FormField>
<div className="flex gap-2 pt-1">
<Button variant="secondary" size="sm" className="flex-1" onClick={() => setActiveModal('none')}>
Back
</Button>
<Button variant="danger" size="sm" className="flex-1" onClick={submitCancel} disabled={!cancelReason?.trim()}>
Confirm Cancel
</Button>
</div>
</div>
)}

{activeModal === 'refund' && (
<div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2 duration-200">
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
{...presets.riseSm}
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
className={`py-1 text-[10px] font-mono font-bold rounded-lg border cursor-pointer transition ${
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

<RestaurantOrderDetailsModal
order={order}
isOpen={showDetails}
onClose={() => setShowDetails(false)}
/>
    </>
  );
}
