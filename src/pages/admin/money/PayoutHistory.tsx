import * as ledgerCommon from "@/api/generated/schemas/ledger/common";
import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { ledgerApi } from "@/lib/zodiosClients";
import { Button, Input, Select, Spinner, StatusPill, Surface } from '@shared/ui';
import { Search, Download, History } from 'lucide-react';
import { useState } from 'react';
import { formatINR } from '@shared/money';

import { z } from "zod";
import { payoutStatus } from '@features/ledger/model/payoutStatus';
import { formatDateTime } from '@/shared/time';

// The list endpoint returns PayoutDto (status is a plain string), not the Payout entity shape.
type Payout = z.infer<typeof ledgerCommon.PayoutDto>;

export default function PayoutHistory({ onSelectPayout }: { onSelectPayout: (payoutId: string) => void }) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { showError } = useToast();

  const [searchPayeeId, setSearchPayeeId] = useState("");
  const [searchPayeeType, setSearchPayeeType] = useState("RESTAURANT");

  const fetchPayouts = async (pageNum: number) => {
    if (!searchPayeeId) {
       showError("Please enter a Payee ID to search");
       return;
    }
    setLoading(true);
    try {
      const res = await ledgerApi.payout.get('/api/v1/internal/admin/payouts', { 
          queries: { 
              payeeType: searchPayeeType,
              payeeId: searchPayeeId,
              page: pageNum, 
              size: 20 
          } 
      });
      setPayouts(res.content || []);
      setTotalPages(res.totalPages || 1);
      setPage(pageNum);
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to fetch payouts').message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const { label, tone } = payoutStatus(status);
    return <StatusPill label={label} tone={tone} />;
  };

  const handleExport = () => {
     const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Payee,Type,Amount,Status,Created At\n"
        + payouts.map(p => `${p.id},${p.payeeDisplayName || p.payeeId},${p.payeeType},${p.amount},${p.status},${p.createdAt ?? ''}`).join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `payouts_export_${searchPayeeId}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-[#f0ede6] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <History className="w-6 h-6 text-rose-500" /> Payout History
        </h2>
        {payouts.length > 0 && (
            <Button variant="secondary" onClick={handleExport}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        )}
      </div>

      <Surface elevation={2} radius="xl" className="p-4 mb-6 flex items-end gap-4">
          <div className="flex-1 max-w-xs">
              <label className="block text-xs font-bold text-slate-500 mb-1">Payee ID (UUID)</label>
              <Input value={searchPayeeId} onChange={e => setSearchPayeeId(e.target.value)} placeholder="Enter UUID..." />
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Payee Type</label>
              <Select
                  aria-label="Payee Type"
                  className="w-40"
                  value={searchPayeeType}
                  onChange={setSearchPayeeType}
                  options={[
                    { value: 'RESTAURANT', label: 'Restaurant' },
                    { value: 'DRIVER', label: 'Driver' },
                  ]}
              />
          </div>
          <Button variant="primary" onClick={() => fetchPayouts(0)} disabled={loading || !searchPayeeId}>
              {loading ? <Spinner size="sm" /> : <Search className="w-4 h-4 mr-2" />}
              Search
          </Button>
      </Surface>

      <div className="flex-1 overflow-y-auto">
        {loading && payouts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <div className="flex justify-center items-center gap-3">
              <Spinner size="md" />
              Loading payout history...
            </div>
          </div>
        ) : payouts.length === 0 ? (
          <Surface elevation={2} radius="xl" className="p-12 text-center">
            <Search className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Search Payouts</h3>
            <p className="text-slate-500">Enter a payee ID above to view their payout history.</p>
          </Surface>
        ) : (
          <Surface elevation={2} radius="xl" className="overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-slate-200 dark:border-slate-700/50">
                      <th className="p-4 text-sm font-semibold text-slate-500">Payout ID</th>
                      <th className="p-4 text-sm font-semibold text-slate-500">Payee</th>
                      <th className="p-4 text-sm font-semibold text-slate-500 text-right">Amount</th>
                      <th className="p-4 text-sm font-semibold text-slate-500">Status</th>
                      <th className="p-4 text-sm font-semibold text-slate-500">Created</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                   {payouts.map((payout) => (
                      <tr 
                         key={payout.id} 
                         className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                         onClick={() => onSelectPayout(payout.id!)}
                      >
                         <td className="p-4">
                            <span className="font-mono text-sm text-slate-600 dark:text-slate-400" title={payout.id}>{payout.id?.substring(0, 8)}...</span>
                         </td>
                         <td className="p-4">
                            <div className="flex flex-col">
                               <span className="font-medium text-slate-900 dark:text-white">{payout.payeeDisplayName || 'Unknown'}</span>
                               <span className="text-xs text-slate-500">{payout.payeeType}</span>
                            </div>
                         </td>
                         <td className="p-4 text-right font-medium text-slate-900 dark:text-white">
                            {formatINR(payout.amount ?? 0)}
                         </td>
                         <td className="p-4">
                            {getStatusBadge(payout.status)}
                         </td>
                         <td className="p-4 text-sm text-slate-500">
                            {formatDateTime(payout.createdAt)}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             
             {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                   <Button variant="ghost" disabled={page === 0} onClick={() => fetchPayouts(page - 1)}>Previous</Button>
                   <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
                   <Button variant="ghost" disabled={page === totalPages - 1} onClick={() => fetchPayouts(page + 1)}>Next</Button>
                </div>
             )}
          </Surface>
        )}
      </div>
    </div>
  );
}
