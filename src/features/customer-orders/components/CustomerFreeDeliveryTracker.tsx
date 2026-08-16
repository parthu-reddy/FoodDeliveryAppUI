import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, CheckCircle2 } from 'lucide-react';
import { CartState, useCustomerCart } from '../model/useCustomerCart';

interface CustomerFreeDeliveryTrackerProps {
  carts: Record<string, CartState>;
  getCartTotal: (restaurantId: string) => { subtotal: number };
  deliveryPricing: any;
  selectedRestaurantId?: string;
}

export const CustomerFreeDeliveryTracker: React.FC<CustomerFreeDeliveryTrackerProps> = ({
  carts,
  getCartTotal,
  deliveryPricing,
  selectedRestaurantId
}) => {
  // We can track the selected restaurant's cart or the first active cart if none selected
  const activeRestaurantId = selectedRestaurantId || Object.keys(carts).find(id => carts[id]?.items.length > 0);
  const activeCart = activeRestaurantId ? carts[activeRestaurantId] : null;

  if (!activeRestaurantId || !deliveryPricing) return null;

  const minOrder = deliveryPricing?.config 
    ? ((deliveryPricing.config.basePrice + (deliveryPricing.config.perKmRate * Math.max(1, deliveryPricing.distanceKm || 5.0))) / (deliveryPricing.config.restMaxContributionPercent || 1))
    : (deliveryPricing?.minimumOrderForFreeDelivery || 999999);

  if (minOrder >= 999999) return null;

  const subtotal = getCartTotal(activeRestaurantId!).subtotal;
  const progress = Math.min(100, (subtotal / minOrder) * 100);
  const isFreeDelivery = subtotal >= minOrder;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-4 right-4 z-40 max-w-[380px] mx-auto pointer-events-none"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-2xl rounded-2xl p-3 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isFreeDelivery ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'}`}>
              {isFreeDelivery ? <CheckCircle2 className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              {isFreeDelivery ? (
                <>
                  <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">Free Delivery Unlocked! 🎉</h4>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">You only pay the platform fee</p>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 tracking-tight">
                    Add ₹{(minOrder - subtotal).toFixed(2)} for Free Delivery!
                  </h4>
                  <p className="text-[10px] text-orange-600/80 dark:text-orange-400/80 mt-0.5">Save on variable delivery fees</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full rounded-full ${isFreeDelivery ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-orange-400 to-amber-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
