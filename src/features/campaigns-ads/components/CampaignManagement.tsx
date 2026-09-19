import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from "@/lib/parseApiError";
import { campaignApi, walletApi } from "@/lib/zodiosClients";
import { AdPerformanceDashboard, CampaignPerformance } from "@features/campaigns-ads/components/AdPerformanceDashboard";
import { CampaignCard } from "@features/campaigns-ads/components/CampaignCard";
import type { Campaign } from "@features/campaigns-ads/model/campaign";
import { CreateCampaignModal } from "@features/campaigns-ads/components/CreateCampaignModal";
import { useAdvertiserWallet } from "@features/campaigns-ads/model/useAdvertiserWallet";
import { Button, FormField, Input, Modal, TransactionHistoryTable, Surface } from "@shared/ui";
import { PaymentModal, type PaymentMethodType } from "@shared/ui/PaymentModal";
import { DollarSign, Plus, TrendingUp, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatINR, roundRupees } from '@shared/money';

export default function CampaignManagement({ advertiserId }: { advertiserId: string }) {
  const { showError, showSuccess } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [topupAmount, setTopupAmount] = useState('100');
  const pollRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);
  
  const {
    walletBalance, transactions, txPage, setTxPage, txTotalPages, txLoading, loadWalletData,
  } = useAdvertiserWallet(advertiserId);
  
  const [performanceData, setPerformanceData] = useState<CampaignPerformance[]>([]);
  const [perfLoading, setPerfLoading] = useState(false);


  useEffect(() => {
    if (advertiserId) {
       
      // eslint-disable-next-line react-hooks/immutability
      loadCampaigns();
       
       
      // eslint-disable-next-line react-hooks/immutability
      loadPerformanceData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advertiserId]);

   



  const loadPerformanceData = async () => {
    if (!advertiserId) return;
    setPerfLoading(true);
    try {
      // @ts-expect-error auto-migration type suppression
      const res = await campaignApi.campaign.get('/api/v1/advertisers/:advertiserId/campaigns/performance', { params: { advertiserId: advertiserId }, queries: { pageable: {} } as Record<string, unknown> });
      setPerformanceData(res.data?.content ?? []);
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
      const res = await campaignApi.campaign.get('/api/v1/advertisers/:advertiserId/campaigns', { params: { advertiserId: advertiserId }, queries: { pageable: {} } as Record<string, unknown> });
      setCampaigns(res.data?.content ?? []);
    } catch (err: unknown) {
      showError(parseApiError(err, 'Failed to load campaigns').message);
    } finally {
      setLoading(false);
    }
  };


  const handlePause = async (id: string) => {
    try {
      await campaignApi.campaign.post('/api/v1/advertisers/:advertiserId/campaigns/:id/pause', undefined, { params: { advertiserId: advertiserId, id } });
      showSuccess('Campaign paused');
      loadCampaigns();
    } catch (err: unknown) {
      showError(parseApiError(err, 'Failed to pause campaign').message);
    }
  };

  const processTopupPayment = async (method: PaymentMethodType) => {
    setPaymentStatus('processing');
    try {
      // One key per attempt. The service dedups on it, so a retry of the same click reaches the
      // same top-up row instead of charging the advertiser twice. The header is required; the call
      // below used to omit it behind a @ts-expect-error and was rejected before it reached a gateway.
      const idempotencyKey = crypto.randomUUID();
      // Through CampaignService, which checks the signed-in user actually owns this advertiser
      // before proxying to WalletService. The old call went straight at WalletService's
      // /api/v1/internal/... path: the gateway routes no such thing, and the endpoint behind it
      // requires the SERVICE role, so the top-up could not have reached a gateway either way.
      //
      // Rupees. TopupWalletRequest.amount is a BigDecimal the service reads as amountInInr, so the
      // old `* 100` asked the payment gateway to charge a hundred times what the advertiser typed.
      const topupRes = await campaignApi.campaign.post(
        '/api/v1/advertisers/:advertiserId/campaigns/wallet/topup',
        { amount: roundRupees(topupAmount), paymentMethod: method },
        { params: { advertiserId: advertiserId }, headers: { "Idempotency-Key": idempotencyKey } }
      );

      const topupId = topupRes.data?.topupId;
      if (!topupId) {
        throw new Error('The top-up was accepted but returned no id to track it by.');
      }
      
      // Poll topup status
      let attempts = 0;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const res = await walletApi.payeeWallet.get('/api/v1/money/advertiser/:entityType/:entityId/topups/:topupId', {
            params: { entityType: 'ADVERTISER', entityId: advertiserId, topupId }
          });
          // Settled means SUCCESS. The old condition was `res || attempts > 10`, which reported
          // success on the first reply whatever it said -- including PENDING and FAILED -- and
          // again on timeout, so a declined card still showed as a completed top-up.
          const status = (res as { status?: string } | undefined)?.status;
          if (status === 'SUCCESS') {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaymentStatus('success');
            setTimeout(() => {
              setIsPaymentModalOpen(false);
              setPaymentStatus('idle');
              setTopupAmount('100');
              loadWalletData();
            }, 2000);
          } else if (status === 'FAILED') {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaymentStatus('idle');
            showError('The payment did not go through.');
          } else if (attempts > 10) {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaymentStatus('idle');
            showError('The top-up is still pending. Your balance will update once it settles.');
          }
        } catch (_e) {
          if (attempts > 10 && pollRef.current) clearInterval(pollRef.current);
        }
      }, 1000);
      
    } catch (err: unknown) {
      if (pollRef.current) clearInterval(pollRef.current);
      setPaymentStatus('idle');
      showError(parseApiError(err, 'Payment initiation failed').message);
    }
  };

  const paymentLeftContent = (
    <Surface elevation={2} radius="lg" className="p-6 h-full flex flex-col justify-center items-center text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
        <Wallet className="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">Add Funds to Wallet</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Current Balance: <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(walletBalance)}</span>
        </p>
      </div>
    </Surface>
  );

  return (
    <div className="p-5 space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        <Surface radius="lg" elevation={1} className="p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-650 dark:text-amber-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">Ad Wallet Balance</span>
            <div className="flex items-center gap-3">
              <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">{formatINR(walletBalance)}</span>
              <Button variant="success" size="xs" onClick={() => setShowAmountModal(true)}>
                Top Up
              </Button>
            </div>
          </div>
        </Surface>

        <Surface radius="lg" elevation={1} className="p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">Active Campaigns</span>
            <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">{campaigns.filter(c => c.status === 'ACTIVE').length}</span>
          </div>
        </Surface>
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
        <Surface radius="lg" elevation={0} className="text-center p-10 border-dashed">
          <p className="text-slate-500 dark:text-slate-400">No campaigns found. Create your first ad campaign!</p>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} onPause={handlePause} />
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

      <CreateCampaignModal
        advertiserId={advertiserId}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadCampaigns}
      />

      <Modal open={showAmountModal} onClose={() => setShowAmountModal(false)} title="Top Up Wallet" size="sm">
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
        amount={Math.round(parseFloat(topupAmount || '0') * 100)}
        leftPanelContent={paymentLeftContent}
        title="Wallet Top Up"
        successTitle="Top Up Successful!"
        successSubtitle="Your funds have been added to your wallet."
        processingTitle="Processing Payment..."
        processingSubtitle="Securely connecting to payment gateway"
        buttonText={(method, amt) => `Add ${formatINR(amt)} to Wallet`}
      />
    </div>
  );
}
