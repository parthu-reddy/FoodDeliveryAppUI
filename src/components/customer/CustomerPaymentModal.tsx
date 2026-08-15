import React, { useState } from 'react';
import { ShieldCheck, Check, MapPin, CreditCard, Wallet, Banknote, Store, ChevronRight, Lock } from 'lucide-react';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { Modal, Button, Spinner } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

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
  processPaymentAndOrder,
  cart,
  cartRestaurant,
  address
}: any) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wallet' | 'cod'>('cod');
  const totals = getCartTotal ? getCartTotal() : { subtotal: 0, deliveryFee: 0, tax: 0, total: 0 };

  const methods = [
    { id: 'card', icon: CreditCard, label: 'Credit Card', color: 'indigo' },
    { id: 'wallet', icon: Wallet, label: 'Wallet', color: 'sky' },
    { id: 'cod', icon: Banknote, label: 'Cash on Delivery', color: 'emerald' },
  ];

  return (
    <Modal 
      isOpen={isPaymentModalOpen} 
      onClose={() => paymentStatus === 'idle' && setIsPaymentModalOpen(false)} 
      size="lg"
      title={paymentStatus === 'idle' ? "Complete Your Order" : paymentStatus === 'processing' ? "Processing..." : "Success"}
    >
      <div className="relative overflow-hidden text-left p-1 sm:p-4">
        {/* Abstract Background Elements inside Modal */}
        {paymentStatus === 'idle' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl opacity-20 dark:opacity-40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {paymentStatus === 'idle' && (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Summary & Map */}
                <div className="space-y-4">
                  {/* Delivery Location */}
                  <div className="glass-card p-4 flex gap-4 items-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Delivering To</h4>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-2">{address || 'No address selected'}</p>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/20 dark:border-white/10">
                      <Store className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-bold text-slate-800 dark:text-white">{cartRestaurant?.name || 'Restaurant'}</h3>
                    </div>
                    
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {(cart || []).map((cItem: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span className="bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded text-xs font-semibold">{cItem.quantity}x</span>
                            <span className="truncate max-w-[150px]">{cItem.item?.name}</span>
                          </div>
                          <span className="font-mono font-medium text-slate-800 dark:text-white">₹{(cItem.item?.price * cItem.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Payment & Totals */}
                <div className="space-y-4">
                  {/* Payment Method Selector */}
                  <div className="glass-card p-4">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Payment Method</h4>
                    <div className="space-y-2">
                      {methods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id as "card" | "wallet" | "cod")}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isSelected 
                                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/20 shadow-md' 
                                : 'border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                {method.label}
                              </span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Totals Box */}
                  <div className="glass-card p-4 bg-slate-900 dark:bg-black/40 border-none shadow-xl text-white">
                    <div className="space-y-2 text-sm text-slate-300 mb-4">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">₹{totals.subtotal?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-mono">₹{totals.deliveryFee?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes (CGST+SGST)</span>
                        <span className="font-mono">₹{((totals.cgst || 0) + (totals.sgst || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/20 pt-3 flex justify-between items-end">
                      <span className="text-slate-200">Total to Pay</span>
                      <span className="font-mono text-2xl font-black">₹{totals.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  onClick={processPaymentAndOrder}
                  disabled={paymentStatus !== 'idle'}
                  className="w-full relative group overflow-hidden bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-2xl py-4"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <div className="flex items-center justify-center gap-2 font-bold text-lg">
                    {selectedMethod === 'cod' ? 'Confirm Cash Order' : `Pay ₹${totals.total?.toFixed(2)} Now`}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 text-white/50">
                    <Lock className="w-4 h-4" />
                  </div>
                </Button>
                <p className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Payments are secure and encrypted
                </p>
              </div>
            </motion.div>
          )}

          {paymentStatus === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-slate-800 flex items-center justify-center">
                  <Store className="w-10 h-10 text-indigo-500 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-6">Sending Order...</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Connecting to {cartRestaurant?.name}</p>
            </motion.div>
          )}

          {paymentStatus === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 relative">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/30"
                >
                  <Check className="w-8 h-8" />
                </motion.div>
                {/* Confetti effect placeholder */}
                <div className="absolute inset-0 animate-ping opacity-20 rounded-full border border-emerald-500"></div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">Order Confirmed!</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">Your food is being prepared and will be with you shortly.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
