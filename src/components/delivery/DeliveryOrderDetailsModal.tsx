import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, CheckCircle2, MapPin } from 'lucide-react';
import { Order } from '../../types';
import { Button } from '../ui';

interface DeliveryOrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeliveryOrderDetailsModal: React.FC<DeliveryOrderDetailsModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
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
                <Receipt className="w-6 h-6 text-indigo-500" />
                Earnings Breakdown
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
                ORDER #{order.id.slice(0, 8).toUpperCase()}
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
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            
            {/* Delivery Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Delivery Route</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pickup</p>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.restaurantName}</p>
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 ml-2" />
                <div className="flex gap-3">
                  <div className="mt-1"><MapPin className="w-4 h-4 text-indigo-500" /></div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Drop-off</p>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Payout Details</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <div className="space-y-3">
                  {/* Gross Earnings details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Base Pay (Customer)</span>
                      <span>₹{(order.driverCustomerContribution || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Distance/Surge Pay (Restaurant)</span>
                      <span>₹{(order.driverRestaurantContribution || 0).toFixed(2)}</span>
                    </div>
                    {(order.driverTip && order.driverTip > 0) ? (
                      <div className="flex justify-between text-emerald-500 dark:text-emerald-400 font-medium">
                        <span>Customer Tip</span>
                        <span>+ ₹{order.driverTip.toFixed(2)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-4" />

                {/* Deductions section */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-900 dark:text-white font-medium">
                    <span>Total Gross Earnings</span>
                    <span>₹{(order.grossPayout || ((order.driverCustomerContribution || 0) + (order.driverRestaurantContribution || 0) + (order.driverTip || 0))).toFixed(2)}</span>
                  </div>
                  
                  {order.driverTaxes ? (
                    <div className="flex justify-between text-rose-500 dark:text-rose-400">
                      <span>Government Tax Deducted (18%)</span>
                      <span>- ₹{order.driverTaxes.toFixed(2)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-4" />

                {/* Total Net Payout */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Total Net Payout</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    ₹{(order.payout || ((order.grossPayout || 0) - (order.driverTaxes || 0))).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
             <Button fullWidth variant="primary" onClick={onClose}>
               Close
             </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
