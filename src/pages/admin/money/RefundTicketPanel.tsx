import { parseApiError } from '@/lib/parseApiError';
import { getUserProfile } from '@/lib/tokenStore';
import { customerApi } from "@/lib/zodiosClients";
import { useToast } from "@/contexts/ToastContext";
import { formatINR, roundRupees } from '@shared/money';
import { Button, Input, Select, Spinner, Surface, Textarea, useConfirm } from '@shared/ui';
import { IndianRupee, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { z } from "zod";
import { SupportTicket } from "@/api/generated/schemas/customer/common";

type Ticket = z.infer<typeof SupportTicket>;

interface RefundTicketPanelProps {
  ticket: Ticket;
  onClose: () => void;
  /** The queue re-reads itself once a ticket closes. */
  onResolved: () => void;
}

/**
 * One refund ticket, with the resolution form and the audit trail that replaces it once the
 * ticket is closed.
 *
 * Split out of RefundQueue, which held the queue, the table and this in one 333-line file.
 * The resolution state lives here because nothing outside this panel reads it, and because
 * a fresh panel per ticket is what clears the form between tickets -- the page used to reset
 * four fields by hand at the click site, and forgetting one silently carried a fault
 * attribution from one refund to the next.
 */
export function RefundTicketPanel({ ticket, onClose, onResolved }: RefundTicketPanelProps) {
  const { showError, showSuccess } = useToast();
  const confirm = useConfirm();
  const [resolving, setResolving] = useState(false);
  const [approved, setApproved] = useState(true);
  const [notes, setNotes] = useState("");
  const [faultType, setFaultType] = useState("UNKNOWN");
  const [overrideAmount, setOverrideAmount] = useState<string>("");

  const handleResolve = async () => {
    const adminId = getUserProfile()?.id;
    if (!adminId) {
      showError('Your session does not identify you; sign in again before resolving a refund.');
      return;
    }

    // Both outcomes are final and both are about money: approving moves it, rejecting
    // refuses it. The ticket closes either way.
    // Admin.dc.html: the destructive confirm names the amount and the entry it lands on, so
    // the admin approves a figure, not "a refund". It used to name neither.
    const amountText = overrideAmount
      ? formatINR(roundRupees(Number(overrideAmount)))
      : ticket.refundAmount ? formatINR(ticket.refundAmount) : 'the full refundable amount';
    const orderRef = ticket.orderId ? ` on order #${String(ticket.orderId).slice(0, 8).toUpperCase()}` : '';
    const ok = await confirm({
      title: approved ? `Approve a refund of ${amountText}?` : 'Reject this refund?',
      description: approved
        ? `${amountText} will be refunded${orderRef} and posted to the ledger as a refund entry; `
          + 'the ticket will close. Refunds cannot be reversed from this screen.'
        : `The customer will be told their refund${orderRef} was declined and the ticket will close.`,
      confirmLabel: approved ? 'Approve refund' : 'Reject refund',
      tone: 'danger',
    });
    if (!ok) return;

    setResolving(true);
    try {
       await customerApi.adminRefund.resolveTicket({
          approved,
          notes,
          faultType,
          // Rupees, matching ResolveRequest.overrideAmount (a BigDecimal compared against the
          // rupee-denominated quote). Multiplying by 100 here sent ₹1.50 as 150 -- a hundredfold
          // over-refund whenever the inflated figure still fell under the quote.
          overrideAmount: overrideAmount ? roundRupees(Number(overrideAmount)) : undefined
       }, {
          params: { ticketId: selectedTicket.id! },
          // The real administrator, not a placeholder: this id is stamped into the ticket's
          // resolvedBy and into the refund's initiatedById -- it is the audit record of who
          // authorised the money movement.
          headers: { 'X-User-Id': adminId }
       });
       showSuccess(`Ticket ${selectedTicket.id?.substring(0,8)} resolved successfully`);
       onClose();
       onResolved();
    } catch (e: unknown) {
       console.error(e);
       showError(parseApiError(e, 'Failed to resolve ticket').message);
    } finally {
       setResolving(false);
    }
  };

  const selectedTicket = ticket;

  return (
    <Surface
      elevation={2}
      radius="none"
      // Admin is desktop-first: below lg the rail takes the screen, because a
      // 384px panel beside a table on a tablet leaves neither of them usable.
      className="w-full lg:w-96 border-l flex flex-col h-full shrink-0"
    >
         <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" /> Ticket Details
            </h3>
            <button onClick={onClose} aria-label="Close ticket details" className="text-slate-400 hover:text-slate-600">×</button>
         </div>
         <div className="flex-1 overflow-y-auto p-4">
             <div className="mb-6 space-y-4">
                 <div>
                     <label className="text-xs text-slate-500 font-bold block mb-1">Customer Reason</label>
                     <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 leading-relaxed">
                         {selectedTicket.reason}
                     </p>
                 </div>
                 {selectedTicket.restaurantComments && (
                     <div>
                         <label className="text-xs text-slate-500 font-bold block mb-1">Restaurant Comments</label>
                         <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900/50">
                             {selectedTicket.restaurantComments}
                         </p>
                     </div>
                 )}
                 <div>
                     <label className="text-xs text-slate-500 font-bold block mb-1">Requested Amount</label>
                     <p className="text-lg font-black text-slate-900 dark:text-white">
                         {selectedTicket.refundAmount ? formatINR(selectedTicket.refundAmount) : 'Full Refund Requested'}
                     </p>
                 </div>
             </div>

             {['OPEN', 'IN_REVIEW'].includes(selectedTicket.status || '') ? (
                 <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                     <h4 className="font-bold mb-4 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                         Resolution Action
                     </h4>
                     
                     <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-2" role="group" aria-label="Resolution">
                             <button
                                 type="button"
                                 aria-pressed={approved}
                                 onClick={() => setApproved(true)}
                                 className="p-2 rounded-lg text-sm font-bold transition cursor-pointer"
                                 style={{
                                     border: '2px solid',
                                     // approve is a success, not a warning; both states were
                                     // light-only hexes and vanished on the dark scheme
                                     borderColor: approved ? 'var(--color-success)' : 'var(--color-paper-line)',
                                     background: approved ? 'var(--color-success-bg)' : 'transparent',
                                     color: approved ? 'var(--color-success)' : 'var(--color-ink-2)',
                                 }}
                             >
                                 Approve
                             </button>
                             <button
                                 type="button"
                                 aria-pressed={!approved}
                                 onClick={() => setApproved(false)}
                                 className="p-2 rounded-lg text-sm font-bold transition cursor-pointer"
                                 style={{
                                     border: '2px solid',
                                     borderColor: !approved ? 'var(--color-danger)' : 'var(--color-paper-line)',
                                     background: !approved ? 'var(--color-danger-bg)' : 'transparent',
                                     color: !approved ? 'var(--color-danger)' : 'var(--color-ink-2)',
                                 }}
                             >
                                 Reject
                             </button>
                         </div>

                         {approved && (
                             <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Fault Attribution</label>
                                    <Select
                                        aria-label="Fault Attribution"
                                        value={faultType}
                                        onChange={setFaultType}
                                        options={[
                                          { value: 'UNKNOWN', label: 'Unknown / Not Investigated' },
                                          { value: 'PLATFORM_FAULT', label: 'Platform Fault (We pay)' },
                                          { value: 'RESTAURANT_FAULT', label: 'Restaurant Fault (Chargeback)' },
                                          { value: 'RIDER_FAULT', label: 'Rider Fault (Deduct)' },
                                          { value: 'CUSTOMER_FAULT', label: 'Customer Fault (Goodwill)' },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Override Amount (Quote Cap)</label>
                                    <div className="relative">
                                        <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                        <Input
                                            type="number"
                                            aria-label="Override amount"
                                            className="pl-9 pr-3"
                                            placeholder="Leave blank for requested amount"
                                            value={overrideAmount}
                                            onChange={e => setOverrideAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                             </>
                         )}

                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Resolution Notes</label>
                             <Textarea
                                 aria-label="Resolution notes"
                                 rows={3}
                                 placeholder="Internal notes for audit trail..."
                                 value={notes}
                                 onChange={e => setNotes(e.target.value)}
                             />
                         </div>

                         <Button 
                             variant={approved ? "primary" : "danger"} 
                             className="w-full"
                             onClick={handleResolve}
                             disabled={resolving}
                         >
                             {resolving ? <Spinner size="sm" /> : (approved ? 'Approve Refund' : 'Reject Refund')}
                         </Button>
                     </div>
                 </div>
             ) : (
                 <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
                     <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                         <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Resolution Audit</div>
                         <div className="space-y-2 text-sm">
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Action:</span>
                                 <span className="font-medium">{selectedTicket.status}</span>
                             </div>
                             {selectedTicket.resolvedAt && (
                                 <div className="flex justify-between">
                                     <span className="text-slate-500">Date:</span>
                                     <span>{new Date(selectedTicket.resolvedAt).toLocaleString()}</span>
                                 </div>
                             )}
                             {selectedTicket.resolutionNotes && (
                                 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                     <span className="text-slate-500 block mb-1">Notes:</span>
                                     <p className="italic text-slate-700 dark:text-slate-300">"{selectedTicket.resolutionNotes}"</p>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
             )}
         </div>
      </Surface>
  );
}
