import type { RefundView } from '@/types';
import type { OrderRefundResult } from '../model/useOrderRefunds';
import { formatINR } from '@shared/money';
import { formatDate } from '@/shared/time';

/** Refund state is independent of the order's delivery/cancellation status. */
export function OrderRefundState({ refunds, error, isLoading, retry }: { refunds: RefundView[] } & Partial<Omit<OrderRefundResult, 'refunds'>>) {
  if (!refunds.length && !error && !isLoading) return null;
  return <div className="mt-3 space-y-1 text-left" data-testid="refund-state">
    {isLoading && <p role="status" className="text-xs text-ink-2">Loading refund details…</p>}
    {error && <div role="alert" className="text-xs space-y-1">
      <p>{error}</p>
      {refunds.length > 0 && <p>Showing the last refund status received.</p>}
      <button type="button" onClick={retry} className="font-semibold underline">Retry refund details</button>
    </div>}
    {refunds.map((refund, index) => {
      const completed = refund.status === 'COMPLETED';
      const pending = refund.status === 'REQUESTED' || refund.status === 'PROCESSING';
      const destination = refund.destination === 'STORE_CREDIT' ? 'your wallet as store credit'
        : refund.destination === 'ORIGINAL_METHOD' ? 'your original payment method' : null;
      const amount = typeof refund.amount === 'number' && Number.isFinite(refund.amount) && refund.amount >= 0
        ? formatINR(refund.amount) : 'Amount unavailable';
      const message = refund.destination === 'NONE' ? 'Nothing was charged, so there is nothing to return'
        : completed && destination ? `Returned to ${destination}`
        : pending && destination ? `Refund pending to ${destination}`
        : refund.status === 'FAILED' ? 'Refund failed; money has not been returned'
        : refund.status === 'CANCELLED' ? 'Refund cancelled; money has not been returned'
        : 'Refund details unavailable';
      return <div key={refund.id ?? index} className="text-xs bg-slate-500/5 border border-slate-500/20 rounded-xl p-3 space-y-0.5">
        <div className="flex justify-between font-semibold"><span>Refund {amount}</span><span>{refund.status ?? 'Status unavailable'}</span></div>
        <p className="text-slate-400 dark:text-slate-300">{message}{pending && refund.expectedBy ? ` — expected by ${formatDate(refund.expectedBy)}` : ''}</p>
      </div>;
    })}
  </div>;
}
