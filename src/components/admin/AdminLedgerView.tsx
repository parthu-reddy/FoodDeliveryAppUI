import React, { useState, useEffect } from 'react';
import { apiGet } from '../../lib/apiClient';
import { Search, ChevronLeft, ChevronRight, Filter, ArrowRight, Copy, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Select, Badge } from '../ui';

export default function AdminLedgerView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  // Filters
  const [transactionId, setTransactionId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [ownerType, setOwnerType] = useState('');
  const [category, setCategory] = useState('');
  const [direction, setDirection] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '20');
      if (transactionId) params.append('transactionId', transactionId.trim());
      if (ownerId) params.append('ownerId', ownerId.trim());
      if (ownerType) params.append('ownerType', ownerType);
      if (category) params.append('category', category);
      if (direction) params.append('direction', direction);

      const res = await apiGet(`/api/v1/ledger/admin/transactions?${params.toString()}`);
      if (res) {
        const pageData = res.data || res;
        setEntries(pageData.content || []);
        setTotalPages(pageData.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to fetch ledger transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [page]); // Re-fetch when page changes

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerId && !ownerType) {
      showError("Please select an Owner Type when searching by Owner ID");
      return;
    }
    if (ownerType && !ownerId) {
      showError("Please enter an Owner ID when filtering by Owner Type");
      return;
    }
    setPage(0);
    fetchEntries();
  };

  const clearFilters = () => {
    setTransactionId('');
    setOwnerId('');
    setOwnerType('');
    setCategory('');
    setDirection('');
    setPage(0);
    setTimeout(() => {
      fetchEntries();
    }, 0);
  };

  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxnId(text);
    setTimeout(() => setCopiedTxnId(null), 2000);
  };

  // Directly use entries from the backend as they are now grouped transactions
  const groupedTransactions = entries;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-[#f0ede6] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black">Ledger Entries</h2>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            placeholder="Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
          <Input
            placeholder="Owner ID"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          />
          <Select
            value={ownerType}
            onChange={(val) => setOwnerType(val)}
            placeholder="All Owner Types"
            options={[
              { value: 'CUSTOMER', label: 'CUSTOMER' },
              { value: 'RESTAURANT', label: 'RESTAURANT' },
              { value: 'DRIVER', label: 'DRIVER' },
              { value: 'PLATFORM', label: 'PLATFORM' }
            ]}
          />
          <Select
            value={category}
            onChange={(val) => setCategory(val)}
            placeholder="All Categories"
            options={[
              { value: 'FOOD_COST', label: 'FOOD COST' },
              { value: 'DELIVERY_FEE', label: 'DELIVERY FEE' },
              { value: 'PLATFORM_FEE', label: 'PLATFORM FEE' },
              { value: 'TAX', label: 'TAX' },
              { value: 'REFUND', label: 'REFUND' },
              { value: 'DRIVER_EARNING', label: 'DRIVER EARNING' },
              { value: 'SETTLEMENT', label: 'SETTLEMENT' }
            ]}
          />
          <Select
            value={direction}
            onChange={(val) => setDirection(val)}
            placeholder="All Directions"
            options={[
              { value: 'CREDIT', label: 'CREDIT' },
              { value: 'DEBIT', label: 'DEBIT' }
            ]}
          />
        </div>
        <div className="mt-4 flex gap-3">
          <Button type="submit" className="flex-1" icon={<Search className="w-5 h-5" />}>
            Apply Filters
          </Button>
          <Button type="button" variant="secondary" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </form>

      {/* Table */}
      <div className="flex-1 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Transaction Details</th>
                <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider">From Account</th>
                <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider">To Account</th>
                <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading transactions...
                    </div>
                  </td>
                </tr>
              ) : groupedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium bg-slate-50/50 dark:bg-slate-900/50">
                    No ledger transactions found.
                  </td>
                </tr>
              ) : (
                groupedTransactions.map(tx => (
                  <tr key={tx.transactionId} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group">
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(tx.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant="neutral">
                          {tx.category.replace(/_/g, ' ')}
                        </Badge>
                        <div className="flex items-center gap-1.5 group/copy cursor-pointer" onClick={() => handleCopy(tx.transactionId)}>
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title={tx.transactionId}>
                            {tx.transactionId.substring(0, 8)}...{tx.transactionId.substring(tx.transactionId.length - 4)}
                          </span>
                          {copiedTxnId === tx.transactionId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {tx.fromAccountId ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"></span>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{tx.fromAccountId}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">External / Unknown</span>
                      )}
                    </td>
                    <td className="p-4 align-middle relative">
                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 hidden md:block">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      {tx.toAccountId ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{tx.toAccountId}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">External / Unknown</span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                        ${tx.amount != null ? tx.amount.toFixed(2) : '0.00'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <Button 
              variant="outline"
              disabled={page === 0 || loading}
              onClick={() => setPage(p => p - 1)}
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-medium text-sm text-slate-500">
                Page {page + 1} of {totalPages === 0 ? 1 : totalPages}
            </span>
            <Button 
              variant="outline"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage(p => p + 1)}
            >
                <ChevronRight className="w-5 h-5" />
            </Button>
        </div>
      </div>
    </div>
  );
}
