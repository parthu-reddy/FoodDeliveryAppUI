import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React from 'react';
import type { Order } from '@/types';
import { Surface } from '@shared/ui';
import { Check, X } from 'lucide-react';

/**
 * "Your order is in." The one moment the customer most wants confirming, and the one place
 * they most want a way straight to tracking.
 */

interface CustomerOrderPlacedToastProps {
  order: Order | null;
  onTrack: (order: Order) => void;
  onDismiss: () => void;
}

export function CustomerOrderPlacedToast({ order, onTrack, onDismiss }: CustomerOrderPlacedToastProps) {
  const orderSuccessToast = order;
  const setOrderSuccessToast = (next: Order | null) => { if (!next) onDismiss(); };
  const setTrackingOrder = onTrack;
  const presets = useMotionPresets();
  return (
    <AnimatePresence>
    {orderSuccessToast && (
      <motion.div {...presets.scaleIn}
        className="fixed top-12 left-0 right-0 mx-auto max-w-sm z-[100] px-4"
      >
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{
            background: 'linear-gradient(140deg, var(--color-amber-700), var(--color-amber-900))',
            border: '1px solid var(--color-amber-700)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Surface radius="full" elevation={0} className="w-8 h-8 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-white" />
              </Surface>
              <div>
                <p className="text-white font-bold text-sm">Order Placed Successfully!</p>
                <p className="text-amber-100 text-[10px] mt-0.5">{orderSuccessToast.restaurantName}</p>
              </div>
            </div>
            <button
              onClick={() => setOrderSuccessToast(null)}
              aria-label="Dismiss"
              className="text-white/70 hover:text-white p-1 rounded-full transition-colors hover:bg-[var(--color-amber-950)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <button
              onClick={() => {
                setTrackingOrder(orderSuccessToast);
                setOrderSuccessToast(null);
              }}
              className="px-4 py-2 bg-white text-amber-600 rounded-lg text-xs font-bold hover:shadow transition hover:bg-amber-50 w-full"
            >
              Track Order
            </button>
          </div>
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  );
}
