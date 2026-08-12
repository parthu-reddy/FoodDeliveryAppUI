import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { Search, Shield, User, Store, Bike, CheckCircle, Clock } from 'lucide-react';
import { Button, Spinner } from '../ui';

export default function AdminPayoutsView() {
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/v1/ledger/payouts/pending');
      const data = res?.data || res || [];
      setPendingPayouts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showError('Failed to fetch pending payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleSettle = async (ownerId: string, ownerType: string, amount: number) => {
    setSettling(ownerId);
    try {
      await apiPost('/api/v1/ledger/payouts/settle', {
        ownerId,
        ownerType,
        amount
      });
      showSuccess(`Payout of $${amount.toFixed(2)} for ${ownerType} settled successfully`);
      fetchPayouts();
    } catch (e) {
      console.error(e);
      showError('Failed to settle payout');
    } finally {
      setSettling(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-[#f0ede6] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-500" /> Pending Payouts
        </h2>
        <Button 
          variant="outline"
          onClick={fetchPayouts}
        >
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <div className="flex justify-center items-center gap-3">
              <Spinner size="md" />
              Loading pending payouts...
            </div>
          </div>
        ) : pendingPayouts.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
            <p className="text-slate-500">There are no pending payouts to settle at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPayouts.map((account) => (
              <div key={account.ownerId} className="glass-panel p-6 flex flex-col">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    account.ownerType === 'RESTAURANT' ? 'bg-orange-500 shadow-orange-500/30' : 'bg-indigo-500 shadow-indigo-500/30'
                  }`}>
                    {account.ownerType === 'RESTAURANT' ? <Store className="w-6 h-6 text-white" /> : <Bike className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{account.ownerType}</p>
                    <p className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate" title={account.ownerId}>{account.ownerId.substring(0, 12)}...</p>
                  </div>
                </div>
                
                <div className="mb-6 flex-1">
                  <p className="text-sm text-slate-500 mb-1">Unsettled Balance</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                    <span className="text-2xl text-slate-400">$</span>
                    {account.balance.toFixed(2)}
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={() => handleSettle(account.ownerId, account.ownerType, account.balance)}
                  disabled={settling === account.ownerId}
                  className="w-full !py-4 text-lg !bg-emerald-500 hover:!bg-emerald-600 shadow-lg shadow-emerald-500/30"
                >
                  {settling === account.ownerId ? (
                    <><Spinner size="sm" /> Settling...</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" /> Settle Payout</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
