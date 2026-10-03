import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi } from "@/lib/zodiosClients";
import { Spinner, StatusPill, Surface, type StatusTone } from '@shared/ui';
import { IndianRupee, Store, Bike, Activity, CreditCard } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatINR } from '@shared/money';

import { schemas } from "@/api/generated/schemas/customer/admin_money_controller";
import { z } from "zod";
import { formatDateTime } from '@/shared/time';

type AdminOrderMoney = z.infer<typeof schemas.AdminOrderMoney>;

const displayAmount = (amount: number | null | undefined) =>
  typeof amount === 'number' && Number.isFinite(amount) ? formatINR(amount) : 'Unavailable';
const displayDeduction = (amount: number | null | undefined) =>
  typeof amount === 'number' && Number.isFinite(amount) ? `-${formatINR(amount)}` : 'Unavailable';

/**
 * What the ledger actually holds for one payee on this order: credits minus debits. The payout cards
 * show the order's quoted split, which a cancelled or refunded order never (fully) earns; this is the
 * money that was booked. Null when nothing was posted, undefined when a line has no amount.
 */
const postedNet = (lines: AdminOrderMoney['ledgerLines'], ownerType: string): number | null | undefined => {
  const mine = (lines ?? []).filter(line => line.ownerType === ownerType);
  if (mine.length === 0) return null;
  if (mine.some(line => typeof line.amount !== 'number' || !Number.isFinite(line.amount))) return undefined;
  return mine.reduce((sum, line) => sum + (line.direction === 'CREDIT' ? 1 : -1) * (line.amount as number), 0);
};
const displayPosted = (net: number | null | undefined) => (net === null ? 'Not posted' : displayAmount(net));

const PAYMENT_TONE: Record<string, StatusTone> = {
  SUCCESS: 'success', PARTIALLY_REFUNDED: 'warning', REFUNDED: 'info', REFUND_PENDING: 'warning',
  REFUND_FAILED: 'danger', FAILED: 'danger', INITIATED: 'neutral',
};
const REFUND_TONE: Record<string, StatusTone> = {
  COMPLETED: 'success', PROCESSING: 'warning', REQUESTED: 'warning', FAILED: 'danger', CANCELLED: 'neutral',
};

export default function AdminOrderMoney({ orderId }: { orderId: string }) {
  const [data, setData] = useState<AdminOrderMoney | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  // Declared before the effect and memoised: as a plain function defined below, it was read before
  // its declaration and could not be an effect dependency, so the effect silently captured whatever
  // closure existed on first render.
  const fetchMoneyData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.adminMoney.getOrderMoney({
          params: { orderId }
      });
      setData(res);
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to fetch order money breakdown').message);
    } finally {
      setLoading(false);
    }
  }, [orderId, showError]);

  useEffect(() => {
    // A fetch on mount sets its loading flag synchronously; see PayoutQueue for the same note.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMoneyData();
  }, [fetchMoneyData]);

  if (loading) {
     return <div className="p-12 text-center text-slate-500 font-medium flex items-center justify-center gap-3">
        <Spinner size="md" /> Loading money breakdown...
     </div>;
  }

  if (!data) {
     return <div className="p-8 text-center text-slate-500">Failed to load breakdown.</div>;
  }

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Customer Summary */}
           <Surface elevation={2} radius="xl" className="p-6 bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30">
               <h3 className="font-bold flex items-center gap-2 mb-4 text-rose-700 dark:text-rose-400">
                   <IndianRupee className="w-5 h-5" /> Customer Paid
               </h3>
               <div className="space-y-2 text-sm mb-4 border-b border-rose-100 dark:border-rose-900/30 pb-4">
                   <div className="flex justify-between">
                       <span className="text-slate-500">Food Cost</span>
                       <span>{displayAmount(data.foodCost)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Delivery Fee</span>
                       <span>{displayAmount(data.deliveryFee)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Platform Fee</span>
                       <span>{displayAmount(data.customerPlatformFee)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Taxes (SGST/CGST)</span>
                       <span>{displayAmount(typeof data.sgst === 'number' && typeof data.cgst === 'number' ? data.sgst + data.cgst : undefined)}</span>
                   </div>
               </div>
               <div className="flex justify-between font-black text-lg">
                   <span>Total</span>
                   <span>{displayAmount(data.totalAmount)}</span>
               </div>
           </Surface>

           {/* Restaurant Summary */}
           <Surface elevation={2} radius="xl" className="p-6 bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
               <h3 className="font-bold flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-400">
                   <Store className="w-5 h-5" /> Restaurant Payout
               </h3>
               <div className="space-y-2 text-sm mb-4 border-b border-amber-100 dark:border-amber-900/30 pb-4">
                   <div className="flex justify-between">
                       <span className="text-slate-500">Food Cost</span>
                       <span>{displayAmount(data.foodCost)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Platform Fee Deduction</span>
                       <span className="text-rose-500">{displayDeduction(data.restaurantPlatformFee)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Delivery Contribution</span>
                       <span className="text-rose-500">{displayDeduction(data.restaurantDeliveryContribution)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Platform Bonus Deduction</span>
                       <span className="text-rose-500">{displayDeduction(data.platformBonus)}</span>
                   </div>
               </div>
               <div className="flex justify-between font-black text-lg">
                   <span>Net Payout</span>
                   <span className="text-amber-600">{displayAmount(data.restaurantPayout)}</span>
               </div>
               <div className="flex justify-between text-sm mt-2" data-testid="restaurant-posted">
                   <span className="text-slate-500">Posted to ledger</span>
                   <span>{displayPosted(postedNet(data.ledgerLines, 'RESTAURANT_PAYABLE'))}</span>
               </div>
           </Surface>

           {/* Rider Summary */}
           <Surface elevation={2} radius="xl" className="p-6 bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
               <h3 className="font-bold flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-400">
                   <Bike className="w-5 h-5" /> Rider Payout
               </h3>
               <div className="space-y-2 text-sm mb-4 border-b border-amber-100 dark:border-amber-900/30 pb-4">
                   <div className="flex justify-between">
                       <span className="text-slate-500">Base Payout (Gross)</span>
                       <span>{displayAmount(data.driverGrossPayout)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Delivery Taxes (SGST/CGST)</span>
                       <span className="text-rose-500">{displayDeduction(data.driverTaxes)}</span>
                   </div>
                   {!!data.platformBonus && (
                       <div className="flex justify-between">
                           <span className="text-slate-500">Platform Bonus</span>
                           <span className="text-amber-500">+{formatINR(data.platformBonus)}</span>
                       </div>
                   )}
               </div>
               <div className="flex justify-between font-black text-lg">
                   <span>Net Payout</span>
                   <span className="text-amber-600">{displayAmount(data.driverNetPayout)}</span>
               </div>
               <div className="flex justify-between text-sm mt-2" data-testid="rider-posted">
                   <span className="text-slate-500">Posted to ledger</span>
                   <span>{displayPosted(postedNet(data.ledgerLines, 'DRIVER_PAYABLE'))}</span>
               </div>
           </Surface>
       </div>

       {/* What happened to the customer's money after it was taken. */}
       <Surface elevation={2} radius="xl" className="p-6 mt-8" data-testid="order-payment">
           <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
               <CreditCard className="w-4 h-4" /> Payment and Refunds
           </h3>
           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-4">
               <span><span className="text-slate-500">Method </span>{data.paymentMethod ?? 'Unavailable'}</span>
               <span><span className="text-slate-500">Gateway </span>{data.gatewayName ?? 'Unavailable'}</span>
               <span className="flex items-center gap-2"><span className="text-slate-500">Payment</span>
                   {data.paymentStatus
                       ? <StatusPill tone={PAYMENT_TONE[data.paymentStatus] ?? 'neutral'} label={data.paymentStatus} />
                       : 'Unavailable'}
               </span>
           </div>
           {data.refunds && data.refunds.length > 0 ? (
               <table className="w-full text-left text-sm" aria-label="Refunds">
                   <thead>
                       <tr className="border-b border-slate-200 dark:border-slate-800">
                           <th className="p-2 font-semibold text-slate-500">Refund</th>
                           <th className="p-2 font-semibold text-slate-500 text-right">Amount</th>
                           <th className="p-2 font-semibold text-slate-500">Status</th>
                           <th className="p-2 font-semibold text-slate-500">Destination</th>
                           <th className="p-2 font-semibold text-slate-500">Fault</th>
                           <th className="p-2 font-semibold text-slate-500">Completed / reason</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {data.refunds.map((refund, index) => (
                           <tr key={refund.id ?? index} data-testid="order-refund" data-refund-id={refund.id} data-status={refund.status}>
                               <td className="p-2 font-mono text-xs" title={refund.id}>{refund.id?.substring(0, 8) ?? 'Unavailable'}</td>
                               <td className="p-2 text-right font-medium">{displayAmount(refund.amount)}</td>
                               <td className="p-2">
                                   {refund.status ? <StatusPill tone={REFUND_TONE[refund.status] ?? 'neutral'} label={refund.status} /> : 'Unavailable'}
                               </td>
                               <td className="p-2">{refund.destination ?? 'Unavailable'}</td>
                               <td className="p-2">{refund.faultType ?? 'Unavailable'}</td>
                               <td className="p-2 text-xs">
                                   {refund.completedAt ? formatDateTime(refund.completedAt) : (refund.failureReason ?? 'Not completed')}
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           ) : (
               <p className="text-sm text-slate-500">No refunds.</p>
           )}
       </Surface>

       {/* Ledger Lines */}
       <Surface elevation={2} radius="xl" className="overflow-hidden mt-8">
           <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                   <Activity className="w-4 h-4" /> Ledger Trace
               </h3>
               <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded font-mono text-slate-600 dark:text-slate-400">
                   {data.ledgerLines?.length || 0} entries
               </span>
           </div>
           {data.ledgerLines && data.ledgerLines.length > 0 ? (
               <table className="w-full text-left text-sm">
                   <thead>
                       <tr className="bg-white dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-800">
                           <th className="p-3 font-semibold text-slate-500">Transaction</th>
                           <th className="p-3 font-semibold text-slate-500">Account</th>
                           <th className="p-3 font-semibold text-slate-500">Category</th>
                           <th className="p-3 font-semibold text-slate-500 text-right">Amount</th>
                           <th className="p-3 font-semibold text-slate-500">Date</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f111a]">
                       {data.ledgerLines.map((line, index) => (
                           <tr key={`${line.transactionId}-${line.accountId}-${line.category}-${line.direction}-${index}`}>
                               <td className="p-3 font-mono text-xs text-slate-400" title={line.transactionId}>{line.transactionId?.substring(0,8) ?? 'Unavailable'}</td>
                               <td className="p-3">
                                   <div className="font-medium text-slate-700 dark:text-slate-300">{String(line.ownerType)}</div>
                                   <div className="text-xs text-slate-500 font-mono">{String(line.ownerId).substring(0,8)}...</div>
                               </td>
                               <td className="p-3">
                                   <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{line.category}</span>
                               </td>
                               <td className={`p-3 text-right font-medium ${line.direction === 'CREDIT' ? 'text-amber-500' : 'text-rose-500'}`}>
                                   {typeof line.amount === 'number' && Number.isFinite(line.amount) ? `${line.direction === 'CREDIT' ? '+' : '-'}${formatINR(line.amount)}` : 'Unavailable'}
                               </td>
                               <td className="p-3 text-xs text-slate-500">
                                   {formatDateTime(line.createdAt)}
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           ) : (
               <div className="p-8 text-center text-slate-500">No ledger entries found for this order.</div>
           )}
       </Surface>
    </div>
  );
}
