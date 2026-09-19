import { Button, Input, Modal } from '@shared/ui';
import { ConfirmMoneyAction } from '@shared/money/components/ConfirmMoneyAction';

interface PayoutActionDialogsProps {
  amount: number;
  bankRef: string;
  setBankRef: (v: string) => void;
  failReason: string;
  setFailReason: (v: string) => void;
  showMarkPaidDialog: boolean;
  setShowMarkPaidDialog: (open: boolean) => void;
  showFailDialog: boolean;
  setShowFailDialog: (open: boolean) => void;
  actionLoading: string | null;
  onAction: (action: 'mark-paid' | 'fail', idempotencyKey: string) => Promise<void>;
}

/**
 * The two dialogs that close a payout: paid, with its bank reference, and failed, with its
 * reason.
 *
 * Split out of PayoutDetail. They are the reason that screen is on the gate's exception list
 * — each one demands typed input before it will commit, which is stronger than a yes/no
 * confirm — so they are worth being able to read on their own.
 */
export function PayoutActionDialogs({
  amount, bankRef, setBankRef, failReason, setFailReason,
  showMarkPaidDialog, setShowMarkPaidDialog, showFailDialog, setShowFailDialog,
  actionLoading, onAction,
}: PayoutActionDialogsProps) {
  return (
    <>
  <Modal open={showMarkPaidDialog} onClose={() => setShowMarkPaidDialog(false)} title="Mark Payout as Paid" size="md">
          <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Enter the bank reference or UTR number for this transaction.</p>
              <Input 
                 placeholder="e.g. UTR-123456789" 
                 value={bankRef} 
                 onChange={(e) => setBankRef(e.target.value)} 
                 className="mb-6 w-full"
              />
              <div className="mt-4">
                  <ConfirmMoneyAction
                      amount={amount}
                      effectSummary="Mark payout as completed with bank reference"
                      buttonLabel="Confirm Payment"
                      onConfirm={(idempotencyKey) => onAction('mark-paid', idempotencyKey)}
                      isPending={actionLoading === 'mark-paid'}
                  />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setShowMarkPaidDialog(false)}>Cancel</Button>
              </div>
          </div>
  </Modal>

  <Modal open={showFailDialog} onClose={() => setShowFailDialog(false)} title="Fail Payout" size="md">
          <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Why did this payout fail?</p>
              <Input 
                 placeholder="e.g. Invalid bank account" 
                 value={failReason} 
                 onChange={(e) => setFailReason(e.target.value)} 
                 className="mb-6 w-full"
              />
              <div className="mt-4">
                  <ConfirmMoneyAction
                      amount={amount}
                      effectSummary="Mark payout as failed"
                      buttonLabel="Mark Failed"
                      onConfirm={(idempotencyKey) => onAction('fail', idempotencyKey)}
                      isPending={actionLoading === 'fail'}
                  />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setShowFailDialog(false)}>Cancel</Button>
              </div>
          </div>
  </Modal>
    </>
  );
}
