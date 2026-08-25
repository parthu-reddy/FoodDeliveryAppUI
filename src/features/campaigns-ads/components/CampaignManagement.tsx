import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from "@/lib/parseApiError";
import { campaignApi, walletApi } from "@/lib/zodiosClients";
import { AdPerformanceDashboard, CampaignPerformance } from "@features/campaigns-ads/components/AdPerformanceDashboard";
import { Badge, Button, FormField, Input, Modal, TransactionHistoryTable, WalletTransaction } from "@shared/ui";
import { PaymentModal, type PaymentMethodType } from "@shared/ui/PaymentModal";
import { Calendar, DollarSign, Pause, Plus, TrendingUp, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { fromContract } from '../../../lib/untypedResponse';

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
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
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
       
      // eslint-disable-next-line react-hooks/immutability
      loadCampaigns();
       
      // eslint-disable-next-line react-hooks/immutability
      loadWalletData();
       
      // eslint-disable-next-line react-hooks/immutability
      loadPerformanceData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

   
  useEffect(() => {
    if (restaurantId) {
      // eslint-disable-next-line react-hooks/immutability
      loadTransactions(txPage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txPage, restaurantId]);

  const loadWalletData = async () => {
    if (!restaurantId) return;
    setTxLoading(true);
    try {
      const balanceRes = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId', { params: { entityType: 'ADVERTISER', entityId: restaurantId } });
      if (balanceRes) setWalletBalance(balanceRes.balance ?? 0);
    } catch (e: unknown) {
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
      setTransactions(fromContract<WalletTransaction[]>(res.content ?? []));
      setTxTotalPages(res.totalPages ?? 1);
    } catch (err: unknown) {
      console.warn("Could not load transactions", err);
    } finally {
      setTxLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    if (!restaurantId) return;
    setPerfLoading(true);
    try {
      // @ts-expect-error auto-migration type suppression
      const res = await campaignApi.campaign.get('/api/v1/advertisers/:advertiserId/campaigns/performance', { params: { advertiserId: restaurantId }, queries: { pageable: {} } as Record<string, unknown> });
      setPerformanceData(fromContract<CampaignPerformance[]>(res));
    } catch (e: unknown) {
      console.error(e);
      showError('Failed to load performance data');
    } finally {
      setPerfLoading(false);
    }
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      // @ts-expect-error auto-migration type suppression
      const res = await campaignApi.campaign.get('/api/v1/advertisers/:advertiserId/campaigns', { params: { advertiserId: restaurantId }, queries: { pageable: {} } as Record<string, unknown> });
      setCampaigns(fromContract<Campaign[]>(res.content ?? []));
    } catch (err: unknown) {
      showError(parseApiError(err, 'Failed to load campaigns').message);
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
            }, { params: { advertiserId: restaurantId }, queries: { pageable: {} } as Record<string, unknown> });
      showSuccess('Campaign created successfully');
      setShowCreateModal(false);
      loadCampaigns();
    } catch (err: unknown) {
      showError(parseApiError(err, 'Failed to create campaign').message);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await campaignApi.campaign.post('/api/v1/advertisers/:advertiserId/campaigns/:id/pause', undefined, { params: { advertiserId: restaurantId, id } });
      showSuccess('Campaign paused');
      loadCampaigns();
    } catch (err: unknown) {
      showError(parseApiError(err, 'Failed to pause campaign').message);
    }
  };

  const processTopupPayment = async (method: PaymentMethodType) => {
    setPaymentStatus('processing');
    try {
      // Map frontend payment method to gateway name
      let gateway = 'RAZORPAY'; // default
      if (method === 'UPI' || method === 'CARD') gateway = 'VYAPAR';
      
      await campaignApi.campaign.post(
        '/api/v1/advertisers/:advertiserId/campaigns/wallet/topup', 
        // @ts-expect-error auto-migration type suppression
        { amount: parseFloat(topupAmount), gatewayName: gateway } as Record<string, unknown>, 
        { params: { advertiserId: restaurantId }, queries: { pageable: {} } as Record<string, unknown> }
      );
      
      setPaymentStatus('success');
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setPaymentStatus('idle');
        setTopupAmount('100');
        // Reload wallet data after a short delay for webhook
        setTimeout(loadWalletData, 1000);
      }, 2000);
      
    } catch (err: unknown) {
      setPaymentStatus('idle');
      showError(parseApiError(err, 'Payment initiation failed').message);
    }
  };

  const paymentLeftContent = (
    <div className="glass-card p-6 h-full flex flex-col justify-center items-center text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
        <Wallet className="w-8 h-8 text-emerald-500" />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">Add Funds to Wallet</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Current Balance: <span className="font-bold text-slate-700 dark:text-slate-300">₹{walletBalance.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );

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
              <Button variant="success" size="xs" onClick={() => setShowAmountModal(true)}>
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

      <Modal isOpen={showAmountModal} onClose={() => setShowAmountModal(false)} title="Top Up Wallet" size="sm">
        <div className="p-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            setShowAmountModal(false);
            setIsPaymentModalOpen(true);
          }} className="space-y-4">
            <FormField label="Amount to Add (₹)" required>
              <Input 
                type="number" 
                step="1" 
                min="10" 
                value={topupAmount} 
                onChange={e => setTopupAmount(e.target.value)} 
                required 
              />
            </FormField>
            <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 mt-2">
              <Button variant="ghost" type="button" onClick={() => setShowAmountModal(false)}>Cancel</Button>
              <Button variant="success" type="submit">Proceed to Payment</Button>
            </div>
          </form>
        </div>
      </Modal>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        status={paymentStatus}
        onProcessPayment={processTopupPayment}
        availableMethods={['CARD', 'UPI']}
        amount={parseFloat(topupAmount || '0')}
        leftPanelContent={paymentLeftContent}
        title="Wallet Top Up"
        successTitle="Top Up Successful!"
        successSubtitle="Your funds have been added to your wallet."
        processingTitle="Processing Payment..."
        processingSubtitle="Securely connecting to payment gateway"
        buttonText={(method, amt) => `Add ₹${amt.toFixed(2)} to Wallet`}
      />
    </div>
  );
}
