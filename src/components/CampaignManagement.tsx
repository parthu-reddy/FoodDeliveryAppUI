import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/apiClient';
import { Plus, Play, Pause, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { AdPerformanceDashboard, CampaignPerformance } from './AdPerformanceDashboard';
import { TransactionHistoryTable, WalletTransaction } from './TransactionHistoryTable';

interface Campaign {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  totalBudget: number;
  startDate: string;
  endDate: string;
}

export default function CampaignManagement({ restaurantId }: { restaurantId: string }) {
  const { showError, showSuccess } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('100');
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  
  const [performanceData, setPerformanceData] = useState<CampaignPerformance[]>([]);
  const [perfLoading, setPerfLoading] = useState(false);

  // Create Form State
  const [name, setName] = useState('');
  const [dailyBudget, setDailyBudget] = useState('50');
  const [totalBudget, setTotalBudget] = useState('500');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [bidAmount, setBidAmount] = useState('1.5');
  const [radiusKm, setRadiusKm] = useState('5.0');

  useEffect(() => {
    if (restaurantId) {
      loadCampaigns();
      loadWalletData();
      loadPerformanceData();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      loadTransactions(txPage);
    }
  }, [txPage, restaurantId]);

  const loadWalletData = async () => {
    if (!restaurantId) return;
    setTxLoading(true);
    try {
      const balanceRes = await apiGet(`/api/v1/wallets/ADVERTISER/${restaurantId}`);
      if (balanceRes.data) setWalletBalance(balanceRes.data.balance);
    } catch (e) {
      console.error(e);
      showError('Failed to fetch wallet balance');
    } finally {
      setTxLoading(false);
    }
  };

  const loadTransactions = async (page: number) => {
    setTxLoading(true);
    try {
      const res = await apiGet(`/api/v1/wallets/ADVERTISER/${restaurantId}/transactions?page=${page}&size=5`);
      if (res.data) {
        setTransactions(res.data.content || []);
        setTxTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      console.warn("Could not load transactions", err);
    } finally {
      setTxLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    if (!restaurantId) return;
    setPerfLoading(true);
    try {
      const res = await apiGet(`/api/v1/advertisers/${restaurantId}/campaigns/performance`);
      if (res.data) setPerformanceData(res.data);
    } catch (e) {
      console.error(e);
      showError('Failed to load performance data');
    } finally {
      setPerfLoading(false);
    }
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/v1/advertisers/${restaurantId}/campaigns`);
      if (res.data && res.data.content) {
        setCampaigns(res.data.content);
      } else if (Array.isArray(res.data)) {
        setCampaigns(res.data);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost(`/api/v1/advertisers/${restaurantId}/campaigns`, {
        advertiserId: restaurantId,
        name,
        dailyBudget: parseFloat(dailyBudget),
        totalBudget: parseFloat(totalBudget),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        targetingRules: {
          radiusKm: parseFloat(radiusKm),
          bidAmount: parseFloat(bidAmount)
        }
      });
      showSuccess('Campaign created successfully');
      setShowCreateModal(false);
      loadCampaigns();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await apiPost(`/api/v1/advertisers/${restaurantId}/campaigns/${id}/pause`);
      showSuccess('Campaign paused');
      loadCampaigns();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to pause campaign');
    }
  };

  return (
    <div className="p-5 space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">Ad Wallet Balance</span>
            <div className="flex items-center gap-3">
              <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">${walletBalance.toFixed(2)}</span>
              <button onClick={() => setShowTopupModal(true)} className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors">
                Top Up
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">Active Campaigns</span>
            <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">{campaigns.filter(c => c.status === 'ACTIVE').length}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Ad Campaigns</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="text-center p-10 text-slate-500">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center p-10 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-dashed border-rose-500/30">
          <p className="text-slate-500 dark:text-slate-400">No campaigns found. Create your first ad campaign!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white/50 dark:bg-slate-900/40 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-[#f0ede6] text-sm">{campaign.name}</h4>
                  <div className="flex gap-2 text-[10px] font-mono mt-1 text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(campaign.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                  campaign.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'
                }`}>
                  {campaign.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-[10px] text-slate-400">Daily Budget</div>
                  <div className="font-bold text-slate-800 dark:text-[#f0ede6]">${campaign.dailyBudget}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-[10px] text-slate-400">Total Budget</div>
                  <div className="font-bold text-slate-800 dark:text-[#f0ede6]">${campaign.totalBudget}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                {campaign.status === 'ACTIVE' && (
                  <button onClick={() => handlePause(campaign.id)} className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="Pause Campaign">
                    <Pause className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Dashboard */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <AdPerformanceDashboard performanceData={performanceData} isLoading={perfLoading} />
      </div>

      {/* Wallet Transactions */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6] mb-4">Ad Spending History</h3>
        <TransactionHistoryTable 
          transactions={transactions}
          isLoading={txLoading}
          page={txPage}
          totalPages={txTotalPages}
          onPageChange={setTxPage}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-xl mb-4 text-slate-900 dark:text-[#f0ede6]">New Ad Campaign</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Campaign Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500" placeholder="e.g. Summer Special Boost" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Daily Budget ($)</label>
                  <input required type="number" step="0.01" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Total Budget ($)</label>
                  <input required type="number" step="0.01" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Start Date</label>
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-[#f0ede6]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">End Date</label>
                  <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-[#f0ede6]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Bid per Impression ($)</label>
                  <input required type="number" step="0.01" value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Targeting Radius (km)</label>
                  <input required type="number" step="0.1" value={radiusKm} onChange={e => setRadiusKm(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors">Launch Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-xl mb-4 text-slate-900 dark:text-[#f0ede6]">Top Up Wallet</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Amount ($)</label>
                <input required type="number" step="1" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 mt-2">
                <button type="button" onClick={() => setShowTopupModal(false)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="button" onClick={async () => {
                  try {
                    await apiPost(`/api/v1/advertisers/${restaurantId}/campaigns/wallet/topup`, { amount: parseFloat(topupAmount) });
                    showSuccess('Top-up order created! (Webhook will process payment)');
                    setShowTopupModal(false);
                    // Reload wallet data after a short delay for webhook
                    setTimeout(loadWalletData, 2000);
                  } catch (err: any) {
                    showError(err.response?.data?.message || 'Failed to top up wallet');
                  }
                }} className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors">Pay Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
