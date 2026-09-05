import { restaurantApi } from '@/lib/zodiosClients';
import { Order } from '@/types';
import { Button } from '@shared/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Receipt, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatINR } from '@shared/money';

interface RestaurantOrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RestaurantOrderDetailsModal: React.FC<RestaurantOrderDetailsModalProps> = ({ order, isOpen, onClose }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      setError(null);
      // Fetch transparent invoice details
      restaurantApi.fulfillment.get('/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/invoice', { params: { restaurantId: order.restaurantId, orderId: order.id } })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((res: any) => {
          setInvoice(res);
        })
        .catch((err) => {
          console.error("Failed to load invoice:", err);
          setError("Could not load full invoice details. Displaying available data.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setInvoice(null);
    }
  }, [isOpen, order]);

  if (!order) return null;

  const data = invoice?.data || invoice || order;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-emerald-500" />
                  Order Details
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading precise invoice data...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {error && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">{error}</p>
                  </div>
                )}


                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Order Items</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                    { }
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {data.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {item.quantity}x
                          </span>
                          <span className="text-slate-700 dark:text-slate-200 font-medium">{item.name}</span>
                        </div>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {formatINR((item.price * item.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transparent Financial Breakdown */}
                <div>
                  <h3 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Transparent Financial Breakdown
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">


                    {/* The Restaurant's Perspective */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Restaurant Revenue & Deductions</h4>
                      <div className="space-y-2 text-sm pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Food Value (Item Total)</span>
                          <span>{formatINR((data.subtotal || data.foodCost || 0))}</span>
                        </div>
                        <div className="flex justify-between text-rose-500 dark:text-rose-400">
                          <span>Platform Fee (Restaurant)</span>
                          <span>- {formatINR((data.restaurantPlatformFee || 0))}</span>
                        </div>
                        <div className="flex justify-between text-rose-500 dark:text-rose-400">
                          <span>Delivery Contribution</span>
                          <span>- {formatINR((data.restaurantDeliveryContribution || 0))}</span>
                        </div>
                        {data.platformBonus > 0 && (
                          <div className="flex justify-between text-emerald-500 dark:text-emerald-400">
                            <span>Platform Bonus</span>
                            <span>+ {formatINR((data.platformBonus || 0))}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-emerald-600 dark:text-emerald-400 pt-2">
                          <span>Net Restaurant Payout</span>
                          <span>{formatINR((data.restaurantPayout || 0))}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
          
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
               <Button fullWidth variant="outline" onClick={onClose}>
                 Close Details
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
