/* eslint-disable react-hooks/set-state-in-effect */
import { walletApi } from '@/lib/zodiosClients';
import { useToast } from '@/contexts/ToastContext';
import type { WalletTransaction } from '@shared/ui';
import { useEffect, useState } from 'react';

/**
 * The advertiser's ad wallet: balance and statement, with paging.
 *
 * Split out of CampaignManagement, which carried the campaign list, the performance table,
 * the create form, two modals and this in one 435-line file. A top-up needs the balance to
 * re-read afterwards, so the refresh is returned rather than hidden.
 */
export function useAdvertiserWallet(advertiserId: string) {
  const { showError } = useToast();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const loadWalletData = async () => {
    if (!advertiserId) return;
    setTxLoading(true);
    try {
      const balanceRes = await walletApi.payeeWallet.get('/api/v1/money/advertiser/:entityType/:entityId', { params: { entityType: 'ADVERTISER', entityId: advertiserId } });
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
      const res = await walletApi.payeeWallet.get('/api/v1/money/advertiser/:entityType/:entityId/transactions', { params: { entityType: 'ADVERTISER', entityId: advertiserId }, queries: { page } });
      setTransactions(res.content ?? []);
      setTxTotalPages(res.totalPages ?? 1);
    } catch (err: unknown) {
      console.warn("Could not load transactions", err);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (advertiserId) {
       
      loadTransactions(txPage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txPage, advertiserId]);

  return {
    walletBalance,
    transactions,
    txPage,
    setTxPage,
    txTotalPages,
    txLoading,
    loadWalletData,
  };
}
