import { Surface } from '@shared/ui';
import { customerApi } from "@/lib/zodiosClients";
import { Spinner } from '@shared/ui';
import { formatINR } from '@shared/money';
import { IndianRupee, Activity, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { usePolling } from "@/hooks/usePolling";
import { LedgerStatementPanel } from '@features/ledger/components/LedgerStatementPanel';

export default function RiderEarnings() {
  const [page, setPage] = useState(0);

  const { data: summary, isLoading: loadingSummary } = usePolling({
    fetchFn: async () => {
      return await customerApi.driverMoney.fetchSummary_1({
          queries: { period: 'month' }
      });
    },
    intervalMs: 30000,
    enabled: true,
  });

  const { data: statementPage, isLoading: loadingStatement } = usePolling({
    fetchFn: async () => {
      return await customerApi.driverMoney.fetchStatement_1({
          queries: { page, size: 20 }
      });
    },
    intervalMs: 15000,
    enabled: !!summary,
  });


  if (loadingSummary && !summary) {
    return <div className="flex h-screen items-center justify-center"><Spinner /></div>;
  }

  const statCards = [
    { label: "Net Earnings", value: summary?.net || 0, icon: <IndianRupee className="w-5 h-5 text-amber-500" /> },
    { label: "Pending Balance", value: summary?.pendingBalance || 0, icon: <Activity className="w-5 h-5 text-rose-500" /> }
  ];

  const totalPages = statementPage?.totalPages || 1;
  const content = statementPage?.content || [];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Earnings</h1>
      
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statCards.map((card, i) => (
          <Surface radius="md" elevation={1} className="p-5 flex items-center justify-between" key={i}>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{card.label}</p>
              <h3 className="text-2xl font-bold">{formatINR(card.value)}</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full">
              {card.icon}
            </div>
          </Surface>
        ))}
      </div>
      
      {/* Last Payout */}
      {summary?.lastPayout && (
          <Surface radius="md" elevation={1} className="p-5">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Last Payout</h3>
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatINR(summary.lastPayout.amount || 0)}</p>
                   <p className="text-xs text-slate-500">Completed on {new Date(String(summary.lastPayout.createdAt || '')).toLocaleDateString()}</p>
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
        csvName="rider_statement"
      />
    </div>
  );
}
