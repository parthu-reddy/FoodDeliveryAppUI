import React, { useState, useEffect } from 'react';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi, campaignApi } from '../../lib/zodiosClients';
import { Plus, Play, Pause, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { AdPerformanceDashboard, CampaignPerformance } from './AdPerformanceDashboard';
import { TransactionHistoryTable, WalletTransaction } from '../shared/TransactionHistoryTable';
import { Button, Modal, FormField, Input, Badge } from '../ui';

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
      const balanceRes = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId', { params: { entityType: 'ADVERTISER', entityId: restaurantId } });
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
      const res = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId/transactions', { params: { entityType: 'ADVERTISER', entityId: restaurantId }, queries: { page } });
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
      const res = await campaignApi.campaign.get('/api/v1/advertisers/:advertiserId/campaigns/performance', { params: { advertiserId: restaurantId } });
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
      const res = await campaignApi.campaign.get('/api/v1/advertisers/:advertiserId/campaigns', { params: { advertiserId: restaurantId } });
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
      await campaignApi.campaign.post('/api/v1/advertisers/:advertiserId/campaigns', {
              advertiserId: restaurantId,
              name,
              dailyBudget: parseFloat(dailyBudget),
              lifetimeBudget: parseFloat(totalBudget),
              maxBid: parseFloat(bidAmount),
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString()
            }, { params: { advertiserId: restaurantId } });
      showSuccess('Campaign created successfully');
      setShowCreateModal(false);
      loadCampaigns();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await campaignApi.campaign.post('/api/v1/advertisers/:advertiserId/campaigns/:id/pause', undefined, { params: { advertiserId: restaurantId, id } });
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
              <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">₹{walletBalance.toFixed(2)}</span>
              <Button variant="success" size="xs" onClick={() => setShowTopupModal(true)}>
                Top Up
              </Button>
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
        <Button variant="warning" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          New Campaign
        </Button>
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
                <Badge variant={campaign.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {campaign.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-[10px] text-slate-400">Daily Budget</div>
                  <div className="font-bold text-slate-800 dark:text-[#f0ede6]">₹{campaign.dailyBudget}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-[10px] text-slate-400">Total Budget</div>
                  <div className="font-bold text-slate-800 dark:text-[#f0ede6]">₹{campaign.totalBudget}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                {campaign.status === 'ACTIVE' && (
                  <Button variant="ghost" size="icon" onClick={() => handlePause(campaign.id)} title="Pause Campaign">
                    <Pause className="w-4 h-4" />
                  </Button>
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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Ad Campaign" size="md">
        <div className="p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField label="Campaign Name" required>
              <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Special Boost" required />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Daily Budget (₹)" required>
                <Input type="number" step="0.01" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} required />
              </FormField>
              <FormField label="Total Budget (₹)" required>
                <Input type="number" step="0.01" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} required />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" required>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </FormField>
              <FormField label="End Date" required>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bid per Impression (₹)" required>
                <Input type="number" step="0.01" value={bidAmount} onChange={e => setBidAmount(e.target.value)} required />
              </FormField>
              <FormField label="Targeting Radius (km)" required>
                <Input type="number" step="0.1" value={radiusKm} onChange={e => setRadiusKm(e.target.value)} required />
              </FormField>
            </div>

            <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 mt-2">
              <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="warning" type="submit">Launch Campaign</Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={showTopupModal} onClose={() => setShowTopupModal(false)} title="Top Up Wallet" size="sm">
        <div className="p-6">
          <div className="space-y-4">
            <FormField label="Amount (₹)" required>
              <Input type="number" step="1" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} required />
            </FormField>
            <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 mt-2">
              <Button variant="ghost" type="button" onClick={() => setShowTopupModal(false)}>Cancel</Button>
              <Button variant="success" type="button" onClick={async () => {
                try {
                  await campaignApi.campaign.post('/api/v1/advertisers/:advertiserId/campaigns/wallet/topup', { amount: parseFloat(topupAmount) }, { params: { advertiserId: restaurantId } });
                  showSuccess('Top-up order created! (Webhook will process payment)');
                  setShowTopupModal(false);
                  // Reload wallet data after a short delay for webhook
                  setTimeout(loadWalletData, 2000);
                } catch (err: any) {
                  showError(err.response?.data?.message || 'Failed to top up wallet');
                }
              }}>Pay Now</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
