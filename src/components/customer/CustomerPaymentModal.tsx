import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { Modal, Button, Spinner } from '../ui';

export default function CustomerPaymentModal(props: any) {
  return (
    <ErrorBoundary>
      <_CustomerPaymentModal {...props} />
    </ErrorBoundary>
  );
}

function _CustomerPaymentModal({
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  paymentStatus,
  getCartTotal,
  processPaymentAndOrder
}: any) {
  return (
    <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} size="sm">
      <div className="flex flex-col items-center text-center">
        {paymentStatus === 'idle' && (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-[#f0ede6]">Checkout</h3>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Total Amount: <span className="font-bold text-slate-900 dark:text-[#f0ede6]">${getCartTotal().total?.toFixed(2)}</span></p>
            </div>
            
            <div className="w-full space-y-2 mt-6">
              <Button
                onClick={processPaymentAndOrder}
                disabled={paymentStatus !== 'idle'}
                variant="primary"
                fullWidth
                icon={<Check className="w-4 h-4" />}
              >
                Pay Securely
              </Button>
              <Button
                onClick={() => setIsPaymentModalOpen(false)}
                variant="secondary"
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="py-8 flex flex-col items-center">
            <Spinner size="xl" className="text-rose-500 mb-6" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#f0ede6]">Processing Payment</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Please do not close this window</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="py-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-6 animate-[bounce_0.5s_ease-out]">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#f0ede6]">Payment Successful!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Placing your order...</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
