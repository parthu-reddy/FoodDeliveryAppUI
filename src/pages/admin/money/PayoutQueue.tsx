import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { ledgerApi } from "@/lib/zodiosClients";
import { Button, Spinner, Select, Surface } from '@shared/ui';
import { Bike, CheckCircle, Clock, Store, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { formatINR } from '@shared/money';

import { PendingPayoutResponse as PendingPayoutResponseSchema } from "@/api/generated/schemas/ledger/common";
import { z } from "zod";
import { formatDate, tryParseInstant } from '@/shared/time';

type PendingPayoutResponse = z.infer<typeof PendingPayoutResponseSchema>;

export default function PayoutQueue({ onSelectRow }: { onSelectRow: (payout: PendingPayoutResponse) => void }) {
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayoutResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterBank, setFilterBank] = useState('ALL');
  const [sortField, setSortField] = useState('amount');
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const { showError } = useToast();

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await ledgerApi.payout.get('/api/v1/internal/admin/payouts/pending');
      setPendingPayouts(res || []);
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to fetch pending payouts').message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // A fetch on mount sets its loading flag synchronously, which this rule cannot express;
    // same suppression as AdminLedgerView and the restaurant order components.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayouts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAndSorted = useMemo(() => {
    let res = pendingPayouts;
    if (filterType !== 'ALL') res = res.filter(p => p.payeeType === filterType);
    if (filterBank !== 'ALL') {
      if (filterBank === 'VERIFIED') res = res.filter(p => p.beneficiaryStatus?.verified === true);
      if (filterBank === 'UNVERIFIED') res = res.filter(p => p.beneficiaryStatus?.verified === false);
      if (filterBank === 'MISSING') res = res.filter(p => !p.beneficiaryStatus);
    }
    return [...res].sort((a, b) => {
      if (sortField === 'amount') return (b.unsettledAmount ?? 0) - (a.unsettledAmount ?? 0);
      return (tryParseInstant(a.unsettledSince) ?? 0) - (tryParseInstant(b.unsettledSince) ?? 0);
    });
  }, [pendingPayouts, filterType, filterBank, sortField]);

  const pagedData = filteredAndSorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredAndSorted.length / pageSize);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-[#f0ede6] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-500" /> Pending Payouts Queue
        </h2>
        <div className="flex gap-4 items-center">
            <Select 
              value={filterType} 
              onChange={(val: string) => { setFilterType(val); setPage(0); }}
              options={[
                { value: 'ALL', label: 'All Types' },
                { value: 'RESTAURANT', label: 'Restaurant' },
                { value: 'DRIVER', label: 'Driver' },
              ]}
              className="w-32"
            />
            <Select 
              value={filterBank} 
              onChange={(val: string) => { setFilterBank(val); setPage(0); }}
              options={[
                { value: 'ALL', label: 'All Bank Status' },
                { value: 'VERIFIED', label: 'Verified' },
                { value: 'UNVERIFIED', label: 'Unverified' },
                { value: 'MISSING', label: 'Missing Info' },
              ]}
              className="w-40"
            />
            <Select 
              value={sortField} 
              onChange={(val: string) => { setSortField(val); setPage(0); }}
              options={[
                { value: 'amount', label: 'Amount (High)' },
                { value: 'date', label: 'Oldest First' },
              ]}
              className="w-32"
            />
            <Button variant="outline" onClick={fetchPayouts}>Refresh</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <div className="flex justify-center items-center gap-3">
              <Spinner size="md" />
              Loading pending payouts...
            </div>
          </div>
        ) : pagedData.length === 0 ? (
          <Surface elevation={2} radius="xl" className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
            <p className="text-slate-500">There are no pending payouts matching your filters.</p>
          </Surface>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedData.map((account) => (
              <Surface elevation={2} radius="xl" 
                key={account.payeeId} 
                className="p-6 flex flex-col cursor-pointer hover:border-rose-500 transition-colors"
                onClick={() => onSelectRow(account)}
              >
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
 account.payeeType === 'RESTAURANT' ? 'bg-amber-500 ' : 'bg-rose-500 '
 }`}>
                    {account.payeeType === 'RESTAURANT' ? <Store className="w-6 h-6 text-white" /> : <Bike className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{account.payeeType}</p>
                        {account.beneficiaryStatus?.verified !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
 account.beneficiaryStatus.verified ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
 }`}>
                                {account.beneficiaryStatus.verified ? 'VERIFIED' : 'UNVERIFIED'}
                            </span>
                        )}
                    </div>
                    {/* nameResolved, not displayName: the API always sends a name, but an unresolved
                        one is a stand-in built from the id and must never read as a real outlet. */}
                    {account.nameResolved ? (
                        <p className="font-bold text-slate-900 dark:text-white truncate" title={account.displayName}>{account.displayName}</p>
                    ) : (
                        <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <p className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate" title={account.payeeId}>{account.payeeId?.substring(0, 12)}...</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Unresolved</span>
                        </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-6 flex-1">
                  <p className="text-sm text-slate-500 mb-1">Unsettled Balance</p>
                  <div className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-1">
                    {formatINR(account.unsettledAmount ?? 0)}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{account.lineCount} lines since {account.unsettledSince ? formatDate(account.unsettledSince) : 'N/A'}</p>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
           <span className="text-sm text-slate-500">Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredAndSorted.length)} of {filteredAndSorted.length}</span>
           <div className="flex gap-2">
             <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
               <ChevronLeft className="w-4 h-4" />
             </Button>
             <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
               <ChevronRight className="w-4 h-4" />
             </Button>
           </div>
        </div>
      )}
    </div>
  );
}
