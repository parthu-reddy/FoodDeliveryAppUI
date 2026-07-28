import React, { useState, useEffect } from 'react';
import { apiGet } from '../lib/apiClient';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useToast } from '../context/ToastContext';

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
      if (transactionId) params.append('transactionId', transactionId);
      if (ownerId) params.append('ownerId', ownerId);
      if (ownerType) params.append('ownerType', ownerType);
      if (category) params.append('category', category);
      if (direction) params.append('direction', direction);

      const res = await apiGet(`/api/v1/ledger/admin/entries?${params.toString()}`);
      if (res) {
        const pageData = res.data || res;
        setEntries(pageData.content || []);
        setTotalPages(pageData.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to fetch ledger entries');
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
          <input
            type="text"
            placeholder="Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-medium placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Owner ID"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-medium placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={ownerType}
            onChange={(e) => setOwnerType(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Owner Types</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="RESTAURANT">RESTAURANT</option>
            <option value="DRIVER">DRIVER</option>
            <option value="PLATFORM">PLATFORM</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="FOOD_COST">FOOD COST</option>
            <option value="DELIVERY_FEE">DELIVERY FEE</option>
            <option value="PLATFORM_FEE">PLATFORM FEE</option>
            <option value="TAX">TAX</option>
            <option value="REFUND">REFUND</option>
            <option value="DRIVER_EARNING">DRIVER EARNING</option>
            <option value="SETTLEMENT">SETTLEMENT</option>
          </select>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Directions</option>
            <option value="CREDIT">CREDIT</option>
            <option value="DEBIT">DEBIT</option>
          </select>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2">
            <Search className="w-5 h-5" /> Apply Filters
          </button>
          <button type="button" onClick={clearFilters} className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-6 rounded-xl transition-all">
            Clear
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="flex-1 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Transaction ID</th>
                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Account ID</th>
                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Category</th>
                <th className="p-4 font-bold text-slate-500 uppercase text-xs text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Loading entries...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No ledger entries found.</td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id} className="border-t border-slate-200 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-sm text-slate-500">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-mono text-xs">{entry.transactionId}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{entry.accountId}</td>
                    <td className="p-4 text-sm font-bold">{entry.category}</td>
                    <td className="p-4 text-right">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${entry.direction === 'CREDIT' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                        {entry.direction === 'CREDIT' ? '+' : '-'}${entry.amount.toFixed(2)}
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
            <button 
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || loading}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-all hover:shadow-md"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-sm text-slate-500">
                Page {page + 1} of {totalPages === 0 ? 1 : totalPages}
            </span>
            <button 
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-all hover:shadow-md"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
}
