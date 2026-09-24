import { AlertCircle, ChevronRight, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React from 'react';
import { Button } from '@shared/ui';

/**
 * The two things that float over the customer home: an error banner and the cart bar.
 *
 * Both are chrome — they sit above scrolling content and follow the viewport — which is why
 * they keep their own positioning and their glass, and why they are not part of
 * `CustomerMainView`, whose three surfaces are the content underneath.
 */

export function CustomerGlobalError({ message }: { message: string | null }) {
  const globalError = message;
  const presets = useMotionPresets();
  return (
    <AnimatePresence>
  {globalError && (
    <motion.div {...presets.scaleIn}
      className="fixed top-12 left-0 right-0 mx-auto max-w-sm z-[100] px-4"
    >
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'var(--color-danger-solid)', border: '1px solid var(--color-danger-solid)' }}
      >
        <AlertCircle className="w-6 h-6 text-white shrink-0" />
        <p className="text-white font-medium text-sm pt-0.5">{globalError}</p>
      </div>
    </motion.div>
  )}
    </AnimatePresence>
  );
}

interface CartBarProps {
  totalCartItems: number;
  activeCartCount: number;
  setIsCartOpen: (open: boolean) => void;
}

export function CustomerCartBar({
  totalCartItems, activeCartCount, setIsCartOpen,
}: CartBarProps) {
  return (
    <>
{totalCartItems > 0 && (
  <div className="fixed bottom-4 left-4 right-4 z-40 max-w-[380px] mx-auto">
    <Button
      onClick={() => setIsCartOpen(true)}
      variant="warning"
      fullWidth
      className="justify-between !py-4 !rounded-2xl"
    >
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        <div className="flex flex-col items-start text-left leading-tight">
          <span className="font-bold">{totalCartItems} Item{totalCartItems > 1 ? 's' : ''} in Cart</span>
          {activeCartCount > 1 && (
            <span className="text-xs text-amber-100/90 font-medium">{activeCartCount} restaurants</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span>View Cart</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </Button>
  </div>
)}
    </>
  );
}
