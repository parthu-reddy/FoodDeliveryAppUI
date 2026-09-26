import { customerApi } from '@/lib/zodiosClients';
import { formatINR } from '@shared/money';
import { lastDaysWindow, todayIn } from '@/shared/time';
import { TransactionHistoryTable, WalletTransaction } from '@shared/ui';
import React, { useCallback, useEffect, useState } from 'react';

/**
 * The rider's earnings wallet: balance, statement, and the paging over it.
 *
 * Split out of RiderSettingsView, which carried five unrelated sections in one file. The
 * fetching moved verbatim, the note on why it reads driver money rather than a wallet
 * included -- that was a real defect once, and the comment is what records it.
 */
export function RiderWalletSection({ userId }: { userId: string }) {
  // Wallet State
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [tips, setTips] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const loadWalletData = useCallback(async (page: number) => {
    if (!userId) return;
    setTxLoading(true);
    try {
      // A driver has no wallet -- WalletEntityType is CUSTOMER and ADVERTISER only. Their money is
      // ledger earnings and cash, so this reads the driver money summary and statement. The old
      // code asked WalletService for a DRIVER wallet, which no route and no handler served; the
      // catch below turned that into a permanent zero balance and an empty history.
      // The 30 calendar days up to and including today, on the rider's calendar, which is what the
      // tips line below says. It sent period 'ALL', which the server ignored for one UTC month.
      const summary = await customerApi.driverMoney.get('/api/v1/money/driver/summary', { queries: lastDaysWindow(todayIn(), 30) });
      if (summary) {
        // Absent when the ledger could not say: shown as unavailable, not as a balance of zero.
        setWalletBalance(summary.pendingBalance ?? null);
        // Customers' tips, paid to the rider whole (Phase 7 A3); each also appears in the
        // statement below as a "Rider tip" line.
        setTips(summary.tips ?? 0);
      }

      const txRes = await customerApi.driverMoney.get('/api/v1/money/driver/statement', { queries: { page, size: 20 } });
      if (txRes && txRes.content) {
        setTransactions(txRes.content.map((line): WalletTransaction => ({
          id: String(line.transactionId ?? ''),
          walletId: "00000000-0000-0000-0000-000000000000",
          amount: Number(line.amount ?? 0),
          transactionType: line.direction === 'DEBIT' ? 'DEBIT' : 'CREDIT',
          referenceId: line.referenceId ? String(line.referenceId) : undefined,
          description: line.description ?? line.category ?? undefined,
          createdAt: String(line.createdAt ?? ''),
        })));
        setTxTotalPages(txRes.totalPages || 1);
      }
    } catch (e: unknown) {
      console.warn("Error loading wallet data:", e);
    } finally {
      setTxLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadWalletData(txPage);
    }
  }, [userId, txPage, loadWalletData]);

  return (
        <div className="pt-8 mt-8 border-t border-rose-500/20">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">Earnings Wallet</h4>
            <span className="font-black text-slate-900 dark:text-[#f0ede6] text-lg">{walletBalance === null ? <span aria-label="Not available">—</span> : formatINR(walletBalance)}</span>
          </div>
          {tips > 0 && (
            <p className="-mt-2 mb-4 text-xs font-semibold text-ink-2" data-testid="rider-tips">
              Tips from customers, last 30 days: <span className="font-mono text-ink">{formatINR(tips)}</span>
            </p>
          )}
          <TransactionHistoryTable 
            transactions={transactions}
            isLoading={txLoading}
            page={txPage}
            totalPages={txTotalPages}
            onPageChange={setTxPage}
          />
        </div>
  );
}
