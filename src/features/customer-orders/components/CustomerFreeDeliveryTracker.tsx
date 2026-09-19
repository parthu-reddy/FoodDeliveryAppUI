import { Surface } from '@shared/ui';
import { AnimatePresence, motion } from 'motion/react';
import { DURATION, EASE, useMotionPresets } from '@shared/ui';
import { Bike, CheckCircle2 } from 'lucide-react';
import React from 'react';
import { CartState } from '../model/useCustomerCart';
import { formatINR } from '@shared/money';

interface CustomerFreeDeliveryTrackerProps {
  carts: Record<string, CartState>;
  getCartTotal: (restaurantId: string) => { subtotal: number; minAmountForFreeDelivery?: number };
  deliveryPricing: { total: number };
  selectedRestaurantId?: string;
  isQuoting?: boolean;
}

export const CustomerFreeDeliveryTracker: React.FC<CustomerFreeDeliveryTrackerProps> = ({
  carts,
  getCartTotal,
  deliveryPricing,
  selectedRestaurantId,
  isQuoting
}) => {
  const presets = useMotionPresets();
  // We can track the selected restaurant's cart or the first active cart if none selected
  const activeRestaurantId = selectedRestaurantId || Object.keys(carts).find(id => carts[id]?.items.length > 0);
  const activeCart = activeRestaurantId ? carts[activeRestaurantId] : null;

  if (!activeCart || activeCart.items.length === 0) return null;

  if (isQuoting) {
    return (
      <AnimatePresence>
        <motion.div {...presets.rise}
          className="sticky top-[88px] z-40 mb-2 max-w-[380px] mx-auto pointer-events-none"
        >
          <Surface radius="lg" elevation={2} className="p-3 pointer-events-auto h-16 animate-pulse flex items-center gap-3">
            <div className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 w-9 h-9" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            </div>
          </Surface>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!activeRestaurantId || !deliveryPricing) return null;

  const cartTotal = getCartTotal(activeRestaurantId!);
  const minOrder = cartTotal?.minAmountForFreeDelivery;

  if (minOrder == null) return null;

  const subtotal = cartTotal?.subtotal ?? 0;
  const progress = Math.min(100, (subtotal / minOrder) * 100);
  const isFreeDelivery = subtotal >= minOrder;

  return (
    <AnimatePresence>
      <motion.div {...presets.rise}
        className="sticky top-[88px] z-40 mb-2 max-w-[380px] mx-auto pointer-events-none"
      >
        <Surface radius="lg" elevation={2} className="p-3 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isFreeDelivery ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
              {isFreeDelivery ? <CheckCircle2 className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              {isFreeDelivery ? (
                <>
                  <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 tracking-tight">Free Delivery Unlocked! 🎉</h4>
                  <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">You only pay the platform fee</p>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 tracking-tight">
                    Add {formatINR((minOrder - subtotal))} for Free Delivery!
                  </h4>
                  <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Save on variable delivery fees</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full w-full rounded-full origin-left ${isFreeDelivery ? 'bg-gradient-to-r from-amber-400 to-slate-400' : 'bg-gradient-to-r from-amber-400 to-amber-400'}`}
              // scaleX on a full-width bar, not an animated width: width is a layout property
              // and this bar is on screen for the whole cart flow.
              initial={presets.reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: presets.reduce ? 0 : DURATION.slow, ease: EASE.out }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress towards free delivery"
            />
          </div>
        </Surface>
      </motion.div>
    </AnimatePresence>
  );
};
