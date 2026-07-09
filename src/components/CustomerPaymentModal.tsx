
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Check } from 'lucide-react';

export default function CustomerPaymentModal({
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  paymentStatus,
  getCartTotal,
  processPaymentAndOrder
}: any) {
  return (
    <>
      {/* ------------------- PAYMENT MODAL ------------------- */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[70]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-[340px] h-fit bg-white dark:bg-slate-900 rounded-3xl p-6 z-[80] shadow-2xl border border-rose-500/20 dark:border-rose-500/30 flex flex-col items-center text-center space-y-5"
            >
              {paymentStatus === 'idle' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-[#f0ede6]">Checkout</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Total Amount: <span className="font-bold text-slate-900 dark:text-[#f0ede6]">${getCartTotal().total.toFixed(2)}</span></p>
                  </div>
                  
                  <div className="w-full space-y-2 mt-4">
                    <button
                      onClick={processPaymentAndOrder}
                      className="w-full bg-slate-900 dark:bg-[#f0ede6] text-white dark:text-black py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <Check className="w-4 h-4" />
                      Pay Securely
                    </button>
                    <button
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-[#f0ede6] py-3.5 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {paymentStatus === 'processing' && (
                <div className="py-8 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 dark:border-rose-500/30 border-t-rose-500 animate-spin mb-6" />
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
