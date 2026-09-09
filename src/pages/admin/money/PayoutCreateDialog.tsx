import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { ledgerApi } from "@/lib/zodiosClients";
import { Button } from '@shared/ui';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { formatINR } from '@shared/money';
import { ConfirmMoneyAction } from '@/shared/money/components/ConfirmMoneyAction';

import { PendingPayoutResponse as PendingPayoutResponseSchema } from "@/api/generated/schemas/ledger/common";
import { z } from "zod";

type PendingPayoutResponse = z.infer<typeof PendingPayoutResponseSchema>;

export default function PayoutCreateDialog({ 
    account, 
    onClose, 
    onSuccess 
}: { 
    account: PendingPayoutResponse; 
    onClose: () => void; 
    onSuccess: (payoutId: string) => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [force, setForce] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleCreate = async (idempotencyKey: string) => {
    if (!account.displayName && !force) {
        showError("Payee is not resolved. Use force to bypass.");
        return;
    }
    
    setLoading(true);
    try {
      const res = await ledgerApi.payout.post('/api/v1/internal/admin/payouts', {
          payeeId: account.payeeId!,
          payeeType: account.payeeType!,
          periodTo: new Date().toISOString(),
          force
      }, { headers: { "Idempotency-Key": idempotencyKey } });
      
      showSuccess(`Payout of ${formatINR(res.amount ?? 0)} created successfully.`);
      onSuccess(res.id!);
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to create payout').message);
    } finally {
      setLoading(false);
    }
  };

  const isVerified = account.beneficiaryStatus?.verified === true;
  const showWarning = !account.displayName || !isVerified;

  return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-4">Create Payout</h3>
              
              <div className="mb-6 space-y-4">
                  <div className="flex justify-between">
                      <span className="text-slate-500">Payee</span>
                      <span className="font-medium text-slate-900 dark:text-white">{account.displayName || account.payeeId}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-black text-xl text-slate-900 dark:text-white">{formatINR(account.unsettledAmount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-slate-500">Lines</span>
                      <span className="font-medium text-slate-900 dark:text-white">{account.lineCount}</span>
                  </div>
              </div>

              {showWarning && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                          <p className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-1">Attention Required</p>
                          {!account.displayName && <p className="text-xs text-amber-700 dark:text-amber-400">The payee name could not be resolved from external services.</p>}
                          {!isVerified && <p className="text-xs text-amber-700 dark:text-amber-400">Beneficiary bank details are not VERIFIED.</p>}
                          
                          <label className="flex items-center gap-2 mt-3 text-sm font-medium text-amber-900 dark:text-amber-300 cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={force} 
                                  onChange={(e) => setForce(e.target.checked)}
                                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                              />
                              Force create payout anyway
                          </label>
                      </div>
                  </div>
              )}

              {showWarning && !force ? (
                  <div className="flex justify-end mt-4">
                      <Button variant="ghost" onClick={onClose}>Cancel</Button>
                  </div>
              ) : (
                  <div className="mt-4">
                      <ConfirmMoneyAction
                          amount={account.unsettledAmount ?? 0}
                          effectSummary={`Settle ${account.lineCount} lines for ${formatINR(account.unsettledAmount ?? 0)}`}
                          buttonLabel="Create Draft Payout"
                          onConfirm={handleCreate}
                          isPending={loading}
                      />
                      <div className="flex justify-end mt-2">
                          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
}
