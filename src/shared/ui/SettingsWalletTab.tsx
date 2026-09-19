/* eslint-disable react-hooks/set-state-in-effect */
import { customerApi } from '@/lib/zodiosClients';
import { useToast } from '@/contexts/ToastContext';
import { formatINR } from '@shared/money';
import { Surface } from './surface/Surface';
import { TransactionHistoryTable, WalletTransaction } from './TransactionHistoryTable';
import { WalletTransactionDto } from '../../api/generated/schemas/wallet/common';
import { useEffect, useState } from 'react';
import { z } from 'zod';

/**
 * Store credit and its statement, inside account settings.
 *
 * Split out of SharedSettingsView. The balance and the statement are one fetch, so they are
 * one component; paging re-runs it, which is what the second effect there was doing.
 */
export function SettingsWalletTab({ customerId }: { customerId?: string }) {
  const { showError } = useToast();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const fetchWalletData = async () => {
    if (!customerId) return;
    setTxLoading(true);
    try {
      const balanceRes = await customerApi.customerMoney.get('/api/v1/money/customer/wallet');
      if (balanceRes) setWalletBalance(balanceRes.balance ?? 0);
      
      const txRes = await customerApi.customerMoney.get('/api/v1/money/customer/wallet/transactions', { queries: { page: txPage, size: 20 } });
      if (txRes && txRes.content) {
        const parsedTxs = z.array(WalletTransactionDto).safeParse(txRes.content);
        setTransactions(parsedTxs.success ? parsedTxs.data : []);
        setTxTotalPages(txRes.totalPages || 1);
      }
    } catch (e: unknown) {
      console.error(e);
      showError('Failed to fetch wallet data');
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txPage]);

  return (
    <div className="space-y-6 pb-6">
      <Surface radius="xl" elevation={2} className="p-6 text-center">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Available Balance</p>
        <h2 className="text-4xl font-black text-slate-900 dark:text-[#f0ede6]">{formatINR(walletBalance)}</h2>
      </Surface>
      
      <div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6] mb-4">Transaction History</h3>
        <TransactionHistoryTable 
          transactions={transactions}
          isLoading={txLoading}
          page={txPage}
          totalPages={txTotalPages}
          onPageChange={setTxPage}
        />
      </div>
    </div>
  );
}
