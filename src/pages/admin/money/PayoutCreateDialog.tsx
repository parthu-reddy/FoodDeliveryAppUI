import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { ledgerApi } from "@/lib/zodiosClients";
import { Button, Modal } from '@shared/ui';
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
  // displayName can be a synthetic fallback made from the payee id. The backend supplies this
  // explicit flag so a real name is never inferred from a non-empty string.
  const nameResolved = account.nameResolved === true;
  const isVerified = account.beneficiaryStatus?.verified === true;
  const needsBankOverride = nameResolved && !isVerified;

  const handleCreate = async (idempotencyKey: string) => {
    if (!nameResolved) {
        showError('Payee identity must be resolved before a payout can be created.');
        return;
    }

    if (!isVerified && !force) {
        showError('Beneficiary bank details must be verified before creating a payout.');
        return;
    }
    
    setLoading(true);
    try {
      const res = await ledgerApi.payout.post('/api/v1/internal/admin/payouts', {
          payeeId: account.payeeId!,
          payeeType: account.payeeType!,
          periodTo: new Date().toISOString(),
          // A force override is only meaningful for a named payee with unverified bank details.
          // Never let it bypass the identity-resolution gate above.
          force: needsBankOverride && force,
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

  const showWarning = !nameResolved || !isVerified;

  return (
      <Modal open onClose={onClose} title="Create Payout" size="md">
          <div className="p-6">
              <div className="mb-6 space-y-4">
                  <div className="flex justify-between">
                      <span className="text-slate-500">Payee</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {nameResolved ? account.displayName : 'Unresolved payee'}
                      </span>
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
                          {!nameResolved && (
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              The payee identity could not be resolved. Payout creation is unavailable until it is resolved.
                            </p>
                          )}
                          {!isVerified && <p className="text-xs text-amber-700 dark:text-amber-400">Beneficiary bank details are not VERIFIED.</p>}
                          {needsBankOverride && (
                            <label className="flex items-center gap-2 mt-3 text-sm font-medium text-amber-900 dark:text-amber-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={force}
                                    onChange={(e) => setForce(e.target.checked)}
                                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                />
                                Create payout despite unverified bank details
                            </label>
                          )}
                      </div>
                  </div>
              )}

              {!nameResolved || (showWarning && !force) ? (
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
      </Modal>
  );
}
