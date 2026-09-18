import * as ledgerCommon from "@/api/generated/schemas/ledger/common";
import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { ledgerApi } from "@/lib/zodiosClients";
import { Button, Overlay, Spinner, Surface } from '@shared/ui';
import { X, ExternalLink, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatINR } from '@shared/money';

import { PendingPayoutResponse as PendingPayoutResponseSchema } from "@/api/generated/schemas/ledger/common";
import { schemas as ledgerStatementSchemas } from "@/api/generated/schemas/ledger/ledger_statement_controller";
import { z } from "zod";
import PayoutCreateDialog from "./PayoutCreateDialog";
import { StatementTable, StatementRow } from "@/shared/money/components/StatementTable";

type PendingPayoutResponse = z.infer<typeof PendingPayoutResponseSchema>;
type LedgerStatementLine = z.infer<typeof ledgerStatementSchemas.LedgerStatementLineDto>;
// The list endpoint returns PayoutDto, whose status is a plain string; schemas.Payout is the
// entity shape with an enum status. They are different types and the drawer renders the DTO.
type Payout = z.infer<typeof ledgerCommon.PayoutDto>;

export default function PayoutDrawer({ 
    account, 
    onClose,
    onPayoutCreated
}: { 
    account: PendingPayoutResponse; 
    onClose: () => void;
    onPayoutCreated: (payoutId: string) => void;
}) {
  const [statementLines, setStatementLines] = useState<LedgerStatementLine[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { showError } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch unsettled lines
      const ownerType = account.payeeType === 'RESTAURANT' ? 'RESTAURANT_PAYABLE' : 'DRIVER_PAYABLE';
      const statementRes = await ledgerApi.ledgerStatement.get('/api/v1/ledger/statements/:ownerType/:ownerId', {
         params: {
             ownerType,
             ownerId: account.payeeId!
         },
         queries: {
             settled: false,
             size: 50
         }
      });
      setStatementLines(statementRes.content || []);

      // 2. Fetch previous payouts
      const payoutsRes = await ledgerApi.payout.get('/api/v1/internal/admin/payouts', {
         queries: {
             payeeId: account.payeeId!,
             payeeType: account.payeeType!,
             size: 5
         }
      });
      setPayouts(payoutsRes.content || []);

    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to fetch account details').message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // A fetch on mount sets its loading flag synchronously, which this rule cannot express;
    // same suppression as AdminLedgerView and the restaurant order components.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.payeeId]);

  return (
    <>
      <Overlay open onClose={onClose} label={account.displayName || 'Payout account'} placement="right" className="h-full w-full max-w-xl">
      <Surface variant="solid" elevation={4} radius="none" className="h-full flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
           <div>
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">{account.displayName || 'Unknown Payee'}</h2>
               <p className="text-sm text-slate-500 font-mono">{account.payeeId}</p>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
           <Surface variant="glass-overlay" elevation={4} radius="xl" className="p-6 mb-8 text-center flex flex-col items-center">
               <p className="text-sm text-slate-500 mb-1">Unsettled Balance</p>
               <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4">{formatINR(account.unsettledAmount ?? 0)}</h3>
               <Button 
                   variant="primary" 
                   onClick={() => setShowCreate(true)}
                   disabled={!account.unsettledAmount || account.unsettledAmount <= 0}
               >
                   Create Payout for Balance
               </Button>
           </Surface>

           <div className="mb-8">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-rose-500" /> Unsettled Lines
               </h3>
               {loading ? (
                   <div className="flex justify-center p-4"><Spinner size="sm" /></div>
               ) : statementLines.length === 0 ? (
                   <p className="text-sm text-slate-500 italic">No unsettled lines found.</p>
               ) : (
                   <StatementTable 
                     rows={statementLines.map((line, index) => ({
                       // The row index, not Math.random(): a fresh key on every render makes React
                       // discard and rebuild the row each time, losing selection and scroll. A
                       // statement line without a transactionId still has a stable position.
                       id: line.transactionId || `unsettled-line-${index}`,
                       date: line.createdAt || '',
                       description: line.description || '',
                       category: line.category,
                       referenceId: line.referenceId,
                       referenceLink: line.referenceId?.startsWith('ord_') ? `/admin/orders/${line.referenceId}/money` : undefined,
                       debit: line.direction === 'DEBIT' ? (line.amount || 0) : 0,
                       credit: line.direction === 'CREDIT' ? (line.amount || 0) : 0,
                     } as StatementRow))}
                   />
               )}
           </div>

           <div>
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <ExternalLink className="w-5 h-5 text-amber-500" /> Previous Payouts
               </h3>
               {loading ? (
                   <div className="flex justify-center p-4"><Spinner size="sm" /></div>
               ) : payouts.length === 0 ? (
                   <p className="text-sm text-slate-500 italic">No previous payouts.</p>
               ) : (
                   <div className="space-y-3">
                       {payouts.map(payout => (
                           <div key={payout.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                               <div>
                                   <div className="text-sm font-medium">{new Date(payout.createdAt || '').toLocaleString()}</div>
                                   <div className="text-xs text-slate-500 font-mono">{payout.id?.substring(0,8)}...</div>
                               </div>
                               <div className="text-right">
                                   <div className="font-bold">{formatINR(payout.amount ?? 0)}</div>
                                   <div className="text-xs text-slate-500">{payout.status}</div>
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
        </div>
      </Surface>
      </Overlay>
      
      {showCreate && (
          <PayoutCreateDialog 
              account={account} 
              onClose={() => setShowCreate(false)} 
              onSuccess={(id) => {
                  setShowCreate(false);
                  onPayoutCreated(id);
              }} 
          />
      )}
    </>
  );
}
