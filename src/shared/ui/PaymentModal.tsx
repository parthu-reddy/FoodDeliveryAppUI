import { Button, Modal } from '@shared/ui';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronRight, CreditCard, Lock, Phone, ShieldCheck, Store, Wallet } from 'lucide-react';
import React, { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { formatINR } from '@shared/money';
import { Spinner } from './feedback/Spinner';
import { Surface } from "./surface/Surface";

export type PaymentMethodType = 'CARD' | 'WALLET' | 'UPI';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'idle' | 'processing' | 'success';
  onProcessPayment: (method: PaymentMethodType) => void;
  availableMethods?: PaymentMethodType[];
  amount: number;
  totals?: { subtotal: number; deliveryFee: number; tax: number; total: number; platformFee?: number };
  title?: string;
  successTitle?: string;
  successSubtitle?: string;
  processingTitle?: string;
  processingSubtitle?: string;
  buttonText?: (method: PaymentMethodType, amount: number) => string;
  leftPanelContent?: React.ReactNode;
  disabledMethods?: PaymentMethodType[];
  methodHints?: Partial<Record<PaymentMethodType, React.ReactNode>>;
  error?: string | null;
}

export function PaymentModal(props: PaymentModalProps) {
  return (
    <ErrorBoundary>
      <PaymentModalInner {...props} />
    </ErrorBoundary>
  );
}

function PaymentModalInner({
  isOpen,
  onClose,
  status,
  onProcessPayment,
  availableMethods = ['CARD', 'UPI', 'WALLET'],
  amount,
  totals,
  title = "Complete Your Payment",
  successTitle = "Payment Confirmed!",
  successSubtitle = "Your transaction was successful.",
  processingTitle = "Processing Payment...",
  processingSubtitle = "Please wait while we securely process your payment",
  buttonText = (_method, amt) => `Pay ${formatINR((amt || 0))} Now`,
  leftPanelContent,
  disabledMethods = [],
  methodHints = {},
  error
}: PaymentModalProps) {
  // The first method the customer could actually pick, not simply the first one listed. The old
  // default was `availableMethods[0]`, which pre-selected a method even when it was disabled: the
  // tile rendered unselected (isSelected requires !isDisabled) while this state still held it, and
  // the confirm button below submitted it anyway.
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | undefined>(
    () => availableMethods.find(m => !disabledMethods.includes(m))
  );

  // Recomputed every render rather than tracked in an effect: `disabledMethods` arrives late (the
  // customer modal disables WALLET only once the balance has loaded), so a method that was
  // selectable when it was clicked can stop being selectable afterwards.
  const canPay = !!selectedMethod && !disabledMethods.includes(selectedMethod);

  const allMethods = [
    { id: 'CARD', icon: CreditCard, label: 'Credit Card', color: 'indigo' },
    { id: 'UPI', icon: Phone, label: 'UPI / Netbanking', color: 'indigo' },
    { id: 'WALLET', icon: Wallet, label: 'Wallet', color: 'sky' },
  ];

  const methods = allMethods.filter(m => availableMethods.includes(m.id as PaymentMethodType));

  return (
    <Modal
      open={isOpen}
      onClose={() => status === 'idle' && onClose()}
      size="lg"
      title={status === 'idle' ? title : status === 'processing' ? "Processing..." : "Success"}
    >
      <div className="relative overflow-hidden text-left p-1 sm:p-4">
        {/* Abstract Background Elements inside Modal */}
        {status === 'idle' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl opacity-20 dark:opacity-40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 flex flex-col gap-6"
            >
              <div className={`grid grid-cols-1 ${leftPanelContent ? 'md:grid-cols-2' : ''} gap-6`}>
                {/* Left Column: Custom Content (e.g. Summary & Map) */}
                {leftPanelContent && (
                  <div className="space-y-4">
                    {leftPanelContent}
                  </div>
                )}

                {/* Right Column: Payment & Totals */}
                <div className="space-y-4">
                  {/* Payment Method Selector */}
                  <Surface variant="glass-chrome" elevation={3} radius="lg" className="p-4">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Payment Method</h4>
                    <div className="space-y-2">
                      {methods.map((method) => {
                        const Icon = method.icon;
                        const isDisabled = disabledMethods.includes(method.id as PaymentMethodType);
                        // If selected method is disabled, default back to CARD (assuming CARD is available)
                        const isSelected = selectedMethod === method.id && !isDisabled;
                        
                        return (
                          <div key={method.id} className="flex flex-col gap-1">
                            <button
                              onClick={() => !isDisabled && setSelectedMethod(method.id as PaymentMethodType)}
                              disabled={isDisabled}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition ${
                                isDisabled 
                                  ? 'opacity-50 cursor-not-allowed border-white/20 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 grayscale'
                                  : isSelected
                                    ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-500/20 shadow-md'
                                    : 'border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-rose-100 dark:bg-rose-500/30 text-rose-600 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className={`font-semibold text-sm ${isSelected ? 'text-rose-900 dark:text-rose-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {method.label}
                                </span>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                              </div>
                            </button>
                            {methodHints[method.id as PaymentMethodType] && (
                              <div className="pl-2 text-[11px] text-rose-500 dark:text-rose-400 font-medium">
                                {methodHints[method.id as PaymentMethodType]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Surface>

                  {/* Totals Box */}
                  <Surface variant="glass-chrome" elevation={3} radius="lg" className="p-4 bg-slate-900 dark:bg-black/40 border-none shadow-xl text-white">
                    {totals ? (
                      <div className="space-y-2 text-sm text-slate-300 mb-4">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-mono">{formatINR(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Fee</span>
                          <span className="font-mono">{totals.deliveryFee === 0 ? 'FREE' : `${formatINR(totals.deliveryFee)}`}</span>
                        </div>
                        {totals.platformFee !== undefined && totals.platformFee > 0 && (
                          <div className="flex justify-between">
                            <span>Platform Fee</span>
                            <span className="font-mono">{formatINR(totals.platformFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Taxes</span>
                          <span className="font-mono">{formatINR(totals.tax)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-slate-300 mb-4">
                        <div className="flex justify-between">
                          <span>Amount</span>
                          <span className="font-mono">{formatINR((amount || 0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee</span>
                          <span className="font-mono">₹0.00</span>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-white/20 pt-3 flex justify-between items-end">
                      <span className="text-slate-200">{totals ? 'Total to Pay' : 'Total Amount'}</span>
                      <span className="font-mono text-2xl font-black">{formatINR((amount || 0))}</span>
                    </div>
                  </Surface>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {error && (
                  <div className="mb-4 p-3 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-sm rounded-lg border border-rose-200 dark:border-rose-500/30">
                    {error}
                  </div>
                )}
                <Button
                  onClick={() => selectedMethod && canPay && onProcessPayment(selectedMethod)}
                  disabled={status !== 'idle' || !canPay}
                  className="w-full relative group overflow-hidden bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-500 text-white rounded-2xl py-4"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <div className="flex items-center justify-center gap-2 font-bold text-lg">
                    {canPay && selectedMethod ? buttonText(selectedMethod, amount) : 'Choose a payment method'}
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

          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-rose-100 dark:border-slate-800 flex items-center justify-center">
                  <Store className="w-10 h-10 text-rose-500 animate-pulse" />
                </div>
                <Spinner size="lg" color="var(--color-action)" label="" className="absolute inset-0" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-6">{processingTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{processingSubtitle}</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mb-6 relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-500/30"
                >
                  <Check className="w-8 h-8" />
                </motion.div>
                {/* Confetti effect placeholder */}
                <div className="absolute inset-0 animate-ping opacity-20 rounded-full border border-amber-500"></div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{successTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">{successSubtitle}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
