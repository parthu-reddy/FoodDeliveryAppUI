import { Surface } from '@shared/ui';
import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi } from "@/lib/zodiosClients";
import { Spinner } from '@shared/ui';
import { formatINR } from '@shared/money';
import { IndianRupee, Activity, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { usePolling } from "@/hooks/usePolling";
import { LedgerStatementPanel } from '@features/ledger/components/LedgerStatementPanel';
import { formatDate } from '@/shared/time';

interface RestaurantEarningsTabProps {
  restaurantId: string;
}

export default function RestaurantEarningsTab({ restaurantId }: RestaurantEarningsTabProps) {
  const { showError } = useToast();
  const [page, setPage] = useState(0);

  const { data: summary, isLoading: loadingSummary } = usePolling({
    fetchFn: async () => {
      return await customerApi.restaurantMoney.fetchSummary({
          params: { outletId: restaurantId }
      });
    },
    intervalMs: 30000,
    enabled: !!restaurantId,
    // Both polls ignored onError, so a failed fetch left the outlet reading an empty earnings
    // screen with no indication anything had gone wrong.
    onError: (e) => showError(parseApiError(e, 'Failed to load earnings summary').message)
  });

  const { data: statementPage, isLoading: loadingStatement } = usePolling({
    fetchFn: async () => {
      return await customerApi.restaurantMoney.fetchStatement({
          params: { outletId: restaurantId },
          queries: { page, size: 20 }
      });
    },
    intervalMs: 15000,
    enabled: !!restaurantId,
    onError: (e) => showError(parseApiError(e, 'Failed to load the earnings statement').message)
  });


  if (loadingSummary && !summary) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  const statCards = [
    { label: "Net Earnings", value: summary?.netEarnings ?? null, icon: <IndianRupee className="w-5 h-5 text-amber-500" />, caption: "This month" },
    { label: "Pending Balance", value: summary?.pendingBalance ?? null, icon: <Activity className="w-5 h-5 text-amber-500" /> },
    { label: "Clawbacks", value: summary?.clawbacks ?? null, icon: <XCircle className="w-5 h-5 text-rose-500" /> }
  ];

  const totalPages = statementPage?.totalPages || 1;
  const content = statementPage?.content || [];

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <Surface radius="md" elevation={1} className="p-5 flex items-center justify-between" key={i}>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{card.label}</p>
              {/* null is "the ledger could not say", not zero: the server leaves it absent rather than invent one. */}
              <h3 className="text-2xl font-bold">{card.value === null ? <span aria-label="Not available">—</span> : formatINR(card.value)}</h3>
              {card.caption && <p className="text-xs text-slate-400 mt-1">{card.caption}</p>}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full">
              {card.icon}
            </div>
          </Surface>
        ))}
      </div>
      
      {/* Payout Details */}
      {summary?.lastPayout && (
          <Surface radius="md" elevation={1} className="p-5">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Last Payout</h3>
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatINR(summary.lastPayout.amount || 0)}</p>
                   <p className="text-xs text-slate-500">Completed on {typeof summary.lastPayout.createdAt === 'string' ? formatDate(summary.lastPayout.createdAt) : ''}</p>
                </div>
                {summary.lastPayout.status === 'COMPLETED' ? 
                   <CheckCircle className="text-amber-500 w-6 h-6" /> : 
                   <Activity className="text-amber-500 w-6 h-6" />
                }
             </div>
          </Surface>
      )}

      <LedgerStatementPanel
        lines={content}
        loading={loadingStatement}
        page={page}
        totalPages={totalPages}
        onPage={setPage}
        csvName="statement"
      />
    </div>
  );
}
