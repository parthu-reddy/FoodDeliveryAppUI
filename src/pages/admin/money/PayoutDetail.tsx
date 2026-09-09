import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { ledgerApi } from "@/lib/zodiosClients";
import { Button, Spinner, Input } from '@shared/ui';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, FileText, Banknote, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatINR } from '@shared/money';

import { schemas } from "@/api/generated/schemas/ledger/payout_controller";
import { z } from "zod";
import { getUserProfile } from "@/lib/tokenStore";
import { ConfirmMoneyAction } from "@/shared/money/components/ConfirmMoneyAction";
import { StatementTable, StatementRow } from "@/shared/money/components/StatementTable";

type PayoutDetail = z.infer<typeof schemas.PayoutDetailResponse>;

export default function PayoutDetail({ payoutId, onBack }: { payoutId: string; onBack: () => void }) {
  const [payout, setPayout] = useState<PayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();

  const [bankRef, setBankRef] = useState("");
  const [failReason, setFailReason] = useState("");
  
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [showFailDialog, setShowFailDialog] = useState(false);

  const fetchPayout = async () => {
    setLoading(true);
    try {
      // The payout's own lines: the order entries this payout settles. Fetching the statement for
      // the payout id instead returned only the two legs of the transfer itself, which is not what
      // "see the related transactions while clearing a payout" means.
      const res = await ledgerApi.payout.get('/api/v1/internal/admin/payouts/:payoutId', { params: { payoutId } });
      setPayout(res);
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to fetch payout details').message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoutId]);

  const handleAction = async (action: 'approve' | 'mark-paid' | 'fail' | 'cancel', idempotencyKey: string) => {
    setActionLoading(action);
    try {
      if (action === 'approve') {
        await ledgerApi.payout.post('/api/v1/internal/admin/payouts/:payoutId/approve', undefined, { params: { payoutId }, headers: { "Idempotency-Key": idempotencyKey } });
        showSuccess('Payout approved successfully');
      } else if (action === 'mark-paid') {
        if (!bankRef) {
           showError("Bank reference is required");
           return;
        }
        await ledgerApi.payout.post('/api/v1/internal/admin/payouts/:payoutId/mark-paid', undefined, { params: { payoutId }, queries: { bankReference: bankRef }, headers: { "Idempotency-Key": idempotencyKey } });
        showSuccess('Payout marked as paid');
        setShowMarkPaidDialog(false);
      } else if (action === 'fail') {
        if (!failReason) {
           showError("Failure reason is required");
           return;
        }
        await ledgerApi.payout.post('/api/v1/internal/admin/payouts/:payoutId/fail', undefined, { params: { payoutId }, queries: { reason: failReason }, headers: { "Idempotency-Key": idempotencyKey } });
        showSuccess('Payout marked as failed');
        setShowFailDialog(false);
      } else if (action === 'cancel') {
        await ledgerApi.payout.post('/api/v1/internal/admin/payouts/:payoutId/cancel', undefined, { params: { payoutId }, headers: { "Idempotency-Key": idempotencyKey } });
        showSuccess('Payout cancelled');
      }
      fetchPayout();
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, `Failed to ${action} payout`).message);
    } finally {
      setActionLoading(null);
    }
  };

  const currentAdminId = getUserProfile()?.id;
  const createdByCurrentAdmin = !!currentAdminId && payout?.createdBy === currentAdminId;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-6">
         <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
         <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Payout Not Found</h2>
         <Button variant="outline" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const linesTotal = (payout.lines ?? []).reduce(
    (sum, l) => sum + (l.direction === 'CREDIT' ? (l.amount ?? 0) : -(l.amount ?? 0)), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-[#f0ede6]">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-black flex items-center gap-2">Payout Details</h2>
        
        <div className="ml-auto flex items-center gap-2">
            {payout.status === 'DRAFT' && (
                <>
                    <div className="w-64" title={createdByCurrentAdmin
                        ? 'You raised this payout. Under the four-eyes rule a second administrator must approve it.'
                        : undefined}>
                       {createdByCurrentAdmin ? (
                          <Button variant="primary" disabled>Approve</Button>
                       ) : (
                          <ConfirmMoneyAction
                             amount={payout.amount ?? 0}
                             effectSummary="Approve payout"
                             buttonLabel="Approve"
                             onConfirm={(idempotencyKey) => handleAction('approve', idempotencyKey)}
                             isPending={actionLoading === 'approve'}
                          />
                       )}
                    </div>
                    <div className="w-64">
                       <ConfirmMoneyAction
                          amount={payout.amount ?? 0}
                          effectSummary="Cancel draft payout"
                          buttonLabel="Cancel"
                          onConfirm={(idempotencyKey) => handleAction('cancel', idempotencyKey)}
                          isPending={actionLoading === 'cancel'}
                       />
                    </div>
                </>
            )}
            {payout.status === 'APPROVED' && (
                <>
                    <Button variant="primary" className="!bg-emerald-500 hover:!bg-emerald-600" disabled={!!actionLoading} onClick={() => setShowMarkPaidDialog(true)}>
                       {actionLoading === 'mark-paid' ? <Spinner size="sm" /> : <Banknote className="w-4 h-4 mr-2" />}
                       Mark Paid
                    </Button>
                    <Button variant="danger" disabled={!!actionLoading} onClick={() => setShowFailDialog(true)}>
                       {actionLoading === 'fail' ? <Spinner size="sm" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                       Fail Payout
                    </Button>
                </>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div className="glass-panel p-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <FileText className="w-4 h-4" /> Overview
                 </h3>
                 <div className="space-y-4">
                     <div>
                         <p className="text-xs text-slate-500 mb-1">Status</p>
                         <div className="text-lg font-bold">{payout.status}</div>
                     </div>
                     <div>
                         <p className="text-xs text-slate-500 mb-1">Amount</p>
                         <div className="text-3xl font-black text-slate-900 dark:text-white">{formatINR(payout.amount ?? 0)}</div>
                     </div>
                     <div>
                         <p className="text-xs text-slate-500 mb-1">Payee</p>
                         <div className="font-medium">{payout.payeeDisplayName || payout.payeeId}</div>
                         <div className="text-xs text-slate-500 mt-1">{payout.payeeType}</div>
                     </div>
                 </div>
             </div>

             <div className="glass-panel p-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Clock className="w-4 h-4" /> Timeline
                 </h3>
                 <div className="space-y-4">
                     {payout.createdAt && (
                         <div>
                             <p className="text-xs text-slate-500 mb-1">Created At</p>
                             <div className="font-medium text-sm">{new Date(payout.createdAt).toLocaleString()}</div>
                         </div>
                     )}
                     {payout.approvedAt && (
                         <div>
                             <p className="text-xs text-slate-500 mb-1">Approved At</p>
                             <div className="font-medium text-sm">{new Date(payout.approvedAt).toLocaleString()}</div>
                         </div>
                     )}
                     {payout.paidAt && (
                         <div>
                             <p className="text-xs text-slate-500 mb-1">Paid At</p>
                             <div className="font-medium text-sm text-emerald-600">{new Date(payout.paidAt).toLocaleString()}</div>
                         </div>
                     )}
                 </div>
             </div>
         </div>
         
         {payout.bankReference && (
             <div className="glass-panel p-6 mb-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Bank Reference</h3>
                 <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">{payout.bankReference}</p>
             </div>
         )}
         
         {payout.failureReason && (
             <div className="glass-panel p-6 mb-6 border-l-4 border-rose-500">
                 <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-2">Failure Reason</h3>
                 <p className="text-slate-700 dark:text-slate-300">{payout.failureReason}</p>
             </div>
         )}

         {payout.beneficiary && (
             <div className="glass-panel p-6 mb-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                     Beneficiary as recorded when this payout was raised
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                     <div>
                         <p className="text-xs text-slate-500 mb-1">Account</p>
                         <p className="font-mono">{payout.beneficiary.accountNumberMasked || '--'}</p>
                     </div>
                     <div>
                         <p className="text-xs text-slate-500 mb-1">IFSC</p>
                         <p className="font-mono">{payout.beneficiary.ifsc || '--'}</p>
                     </div>
                     <div>
                         <p className="text-xs text-slate-500 mb-1">Name on account</p>
                         <p>{payout.beneficiary.beneficiaryName || '--'}</p>
                     </div>
                     <div>
                         <p className="text-xs text-slate-500 mb-1">Verified</p>
                         <p className={payout.beneficiary.verified ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                             {payout.beneficiary.verified ? 'Yes' : 'No'}
                         </p>
                     </div>
                 </div>
             </div>
         )}
         
         <div className="glass-panel p-6">
             <div className="flex items-baseline justify-between mb-4">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                     Settled Lines ({payout.lines?.length ?? 0})
                 </h3>
                 <span className="text-sm text-slate-500">
                     Lines total <span className="font-bold text-slate-800 dark:text-white">{formatINR(linesTotal)}</span>
                     {payout.amount !== undefined && Math.abs(linesTotal - payout.amount) > 0.005 && (
                        <span className="ml-2 text-rose-600 font-bold">does not match the payout amount</span>
                     )}
                 </span>
             </div>
             <StatementTable 
                 rows={(payout.lines ?? []).map(line => ({
                   id: line.id || line.ledgerEntryId || String(Math.random()),
                   date: line.entryCreatedAt || '',
                   description: line.category || '',
                   category: line.category,
                   referenceId: line.referenceId,
                   // Every payout line references the order it came from.
                   referenceLink: line.referenceId ? `/admin/orders/${line.referenceId}/money` : undefined,
                   debit: line.direction === 'DEBIT' ? (line.amount || 0) : 0,
                   credit: line.direction === 'CREDIT' ? (line.amount || 0) : 0,
                 } as StatementRow))}
             />
         </div>
      </div>

      {showMarkPaidDialog && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4">Mark Payout as Paid</h3>
                  <p className="text-sm text-slate-500 mb-4">Enter the bank reference or UTR number for this transaction.</p>
                  <Input 
                     placeholder="e.g. UTR-123456789" 
                     value={bankRef} 
                     onChange={(e) => setBankRef(e.target.value)} 
                     className="mb-6 w-full"
                  />
                  <div className="mt-4">
                      <ConfirmMoneyAction
                          amount={payout.amount ?? 0}
                          effectSummary="Mark payout as completed with bank reference"
                          buttonLabel="Confirm Payment"
                          onConfirm={(idempotencyKey) => handleAction('mark-paid', idempotencyKey)}
                          isPending={actionLoading === 'mark-paid'}
                      />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                      <Button variant="ghost" onClick={() => setShowMarkPaidDialog(false)}>Cancel</Button>
                  </div>
              </div>
          </div>
      )}

      {showFailDialog && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4 text-rose-500">Fail Payout</h3>
                  <p className="text-sm text-slate-500 mb-4">Why did this payout fail?</p>
                  <Input 
                     placeholder="e.g. Invalid bank account" 
                     value={failReason} 
                     onChange={(e) => setFailReason(e.target.value)} 
                     className="mb-6 w-full"
                  />
                  <div className="mt-4">
                      <ConfirmMoneyAction
                          amount={payout.amount ?? 0}
                          effectSummary="Mark payout as failed"
                          buttonLabel="Mark Failed"
                          onConfirm={(idempotencyKey) => handleAction('fail', idempotencyKey)}
                          isPending={actionLoading === 'fail'}
                      />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                      <Button variant="ghost" onClick={() => setShowFailDialog(false)}>Cancel</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
