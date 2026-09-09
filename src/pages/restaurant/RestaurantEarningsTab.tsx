import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi } from "@/lib/zodiosClients";
import { Button, Spinner } from '@shared/ui';
import { formatINR } from '@shared/money';
import { Download, IndianRupee, Activity, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { usePolling } from "@/hooks/usePolling";

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

  const downloadCSV = () => {
     if (!statementPage?.content) return;
     const lines = statementPage.content;
     let csv = 'Date,Category,Description,Direction,Amount,Settled\n';
     lines.forEach((line) => {
         const date = new Date(String(line.createdAt || '')).toLocaleString();
         const amtStr = formatINR(line.amount || 0);
         csv += `"${date}","${line.category}","${line.description}","${line.direction}","${amtStr}","${line.settled}"\n`;
     });
     
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `statement_${restaurantId}_page${page}.csv`;
     a.click();
  };

  if (loadingSummary && !summary) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  const statCards = [
    { label: "Net Earnings", value: summary?.netEarnings || 0, icon: <IndianRupee className="w-5 h-5 text-emerald-500" /> },
    { label: "Pending Balance", value: summary?.pendingBalance || 0, icon: <Activity className="w-5 h-5 text-amber-500" /> },
    { label: "Clawbacks", value: summary?.clawbacks || 0, icon: <XCircle className="w-5 h-5 text-red-500" /> }
  ];

  const totalPages = statementPage?.totalPages || 1;
  const content = statementPage?.content || [];

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{card.label}</p>
              <h3 className="text-2xl font-bold">{formatINR(card.value)}</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full">
              {card.icon}
            </div>
          </div>
        ))}
      </div>
      
      {/* Payout Details */}
      {summary?.lastPayout && (
          <div className="bg-white dark:bg-[#0f111a] border border-emerald-500/20 rounded-xl p-5 shadow-sm">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Last Payout</h3>
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatINR(summary.lastPayout.amount || 0)}</p>
                   <p className="text-xs text-slate-500">Completed on {new Date(String(summary.lastPayout.createdAt || '')).toLocaleDateString()}</p>
                </div>
                {summary.lastPayout.status === 'COMPLETED' ? 
                   <CheckCircle className="text-emerald-500 w-6 h-6" /> : 
                   <Activity className="text-amber-500 w-6 h-6" />
                }
             </div>
          </div>
      )}

      {/* Statement Table */}
      <div className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" /> Account Statement
          </h3>
          <Button variant="outline" size="sm" onClick={downloadCSV} className="flex items-center gap-2">
             <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
        
        {loadingStatement && !statementPage ? (
            <div className="p-10 flex justify-center"><Spinner /></div>
        ) : content.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No transactions found.</div>
        ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                     <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center">Settled</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {content.map((line, idx: number) => (
                         <tr key={String(line.transactionId || idx)}>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(String(line.createdAt || '')).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                               {String(line.description || '-')}
                               {line.direction === 'DEBIT' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1 rounded uppercase">Debit</span>}
                               {line.direction === 'CREDIT' && <span className="ml-2 text-xs bg-emerald-100 text-emerald-600 px-1 rounded uppercase">Credit</span>}
                            </td>
                            <td className="px-4 py-3">
                               <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{String(line.category || '-')}</span>
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${line.direction === 'CREDIT' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                               {(() => { const amtStr = formatINR(line.amount || 0); return `${line.direction === 'DEBIT' ? '-' : '+'}${amtStr}`; })()}
                            </td>
                            <td className="px-4 py-3 text-center">
                               {line.settled ? 
                                 <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : 
                                 <Activity className="w-4 h-4 text-amber-500 mx-auto" />
                               }
                            </td>
                         </tr>
                     ))}
                  </tbody>
               </table>
               
               {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                     <Button variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
                     <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
                     <Button variant="ghost" disabled={page === totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
               )}
            </div>
        )}
      </div>
    </div>
  );
}
