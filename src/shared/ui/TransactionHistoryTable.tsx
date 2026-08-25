import { format } from 'date-fns';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CircleDollarSign, Loader2 } from 'lucide-react';

export interface WalletTransaction {
  id: string;
  amount: number;
  transactionType: 'CREDIT' | 'DEBIT' | 'REFUND';
  referenceId: string;
  description: string;
  metadata?: string;
  createdAt: string;
}

interface TransactionHistoryTableProps {
  transactions: WalletTransaction[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TransactionHistoryTable({ 
  transactions, 
  isLoading, 
  page, 
  totalPages, 
  onPageChange 
}: TransactionHistoryTableProps) {
  
  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <CircleDollarSign className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No transactions yet</h3>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          When you make payments, receive earnings, or run ad campaigns, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Transaction</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Reference ID</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isCredit = tx.transactionType === 'CREDIT' || tx.transactionType === 'REFUND';
              return (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {tx.transactionType === 'REFUND' ? (
                          <ArrowLeftRight className="w-4 h-4" />
                        ) : isCredit ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {tx.transactionType === 'CREDIT' ? 'Credit Received' : 
                           tx.transactionType === 'REFUND' ? 'Refund Processed' : 'Deduction'}
                        </p>
                        <p className="text-xs text-slate-500 max-w-[250px] truncate" title={tx.description}>
                          {tx.description}
                        </p>
                        {(() => {
                          try {
                            if (!tx.metadata) return null;
                            const meta = JSON.parse(tx.metadata);
                            return (
                              <div className="mt-2 space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-1">
                                {meta.subtotal && (
                                  <div className="flex justify-between w-40"><span>Subtotal:</span><span className="font-medium">₹{meta.subtotal.toFixed(2)}</span></div>
                                )}
                                {meta.platformFee && (
                                  <div className="flex justify-between w-40"><span>Platform Fee:</span><span className="font-medium text-rose-500">-₹{meta.platformFee.toFixed(2)}</span></div>
                                )}
                                {meta.netEarnings && (
                                  <div className="flex justify-between w-40"><span>Net Earnings:</span><span className="font-medium text-emerald-600">₹{meta.netEarnings.toFixed(2)}</span></div>
                                )}
                                {meta.distanceFee && (
                                  <div className="flex justify-between w-40"><span>Distance Fee:</span><span className="font-medium">₹{meta.distanceFee.toFixed(2)}</span></div>
                                )}
                                {meta.tipAmount && (
                                  <div className="flex justify-between w-40"><span>Tips:</span><span className="font-medium text-emerald-600">+₹{meta.tipAmount.toFixed(2)}</span></div>
                                )}
                                {meta.totalEarnings && (
                                  <div className="flex justify-between w-40"><span>Total Earnings:</span><span className="font-medium text-emerald-600">₹{meta.totalEarnings.toFixed(2)}</span></div>
                                )}
                              </div>
                            );
                          } catch (_e: unknown) {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      {tx.referenceId}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                    <span className={isCredit ? 'text-emerald-600' : 'text-slate-900'}>
                      {isCredit ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-700">{page + 1}</span> of <span className="font-medium text-slate-700">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0 || isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1 || isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
