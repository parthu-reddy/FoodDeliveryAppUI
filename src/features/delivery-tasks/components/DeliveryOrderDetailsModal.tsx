import { Surface } from '@shared/ui';
import { Order } from "@/types";
import { Button, Modal } from '@shared/ui';
import { CheckCircle2, MapPin, Receipt, X } from 'lucide-react';
import React from 'react';
import { formatINR } from '@shared/money';

interface DeliveryOrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeliveryOrderDetailsModal: React.FC<DeliveryOrderDetailsModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Order #${order.id?.substring(0, 8) ?? ''}`}
      size="lg"
      headerless
    >
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <Surface variant="glass-chrome" elevation={0} className="p-6 border-b flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Receipt className="w-6 h-6 text-rose-500" />
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
          </Surface>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            
            {/* Delivery Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Delivery Route</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1"><CheckCircle2 className="w-4 h-4 text-amber-500" /></div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pickup</p>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.restaurantName}</p>
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 ml-2" />
                <div className="flex gap-3">
                  <div className="mt-1"><MapPin className="w-4 h-4 text-rose-500" /></div>
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
                  {/* Earnings details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Delivery Fee</span>
                      <span>{formatINR((order.deliveryFee || 0))}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-4" />

                {/* Total Net Payout */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Total Earnings</span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {formatINR((order.deliveryFee || 0))}
                  </span>
                </div>
              </div>
            </div>

          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
             <Button fullWidth size="touch" variant="primary" onClick={onClose}>
               Close
             </Button>
          </div>
        </div>
    </Modal>
  );
};
