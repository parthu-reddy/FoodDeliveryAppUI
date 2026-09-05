import { StatementTable, StatementRow } from '../money/components/StatementTable';

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
  
  const rows: StatementRow[] = transactions.map(tx => {
    const isCredit = tx.transactionType === 'CREDIT' || tx.transactionType === 'REFUND';
    return {
      id: tx.id,
      date: tx.createdAt,
      description: tx.transactionType === 'CREDIT' ? 'Credit Received' : tx.transactionType === 'REFUND' ? 'Refund Processed' : 'Deduction',
      referenceId: tx.referenceId,
      debit: isCredit ? 0 : tx.amount,
      credit: isCredit ? tx.amount : 0
    };
  });

  return (
    <div className="space-y-4">
      <StatementTable rows={rows} isLoading={isLoading} />
      
      {totalPages > 1 && (
        <div className="px-6 py-4 border border-slate-200 rounded-lg flex items-center justify-between bg-slate-50/50">
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
