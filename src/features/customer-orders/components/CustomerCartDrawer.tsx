import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Package, Timer, ShieldCheck, AlertCircle, ShoppingBag } from 'lucide-react';
import { Restaurant, CartItem, MenuItem } from '@/types';
import { z } from 'zod';
import { EmptyState } from "@shared/ui";

const checkoutSchema = z.object({
  address: z.string().min(5, "Please enter a valid delivery address").max(200, "Address is too long")
});

export default function CustomerCartDrawer({
  address,
  setAddress,
  handleCheckout,
  isCartOpen,
  setIsCartOpen,
  selectedRestaurant,
  carts,
  removeFromCart,
  addToCart,
  getCartTotal,
  setIsPaymentModalOpen,
  isSubmitting,
  isQuoting
}: any) {
  const [error, setError] = React.useState<string | null>(null);
  const [localAddress, setLocalAddress] = React.useState(address);

  React.useEffect(() => {
    setLocalAddress(address);
  }, [address]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localAddress !== address) {
        setAddress(localAddress);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [localAddress, address, setAddress]);

  const onCheckoutClick = (restaurantId: string) => {
    if (isSubmitting) return;
    const validation = checkoutSchema.safeParse({ address: localAddress.trim() });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    setError(null);
    setAddress(localAddress); // ensure parent has latest
    setTimeout(() => {
      handleCheckout(restaurantId);
    }, 0);
  };

  const activeCarts = Object.entries(carts).filter(([_, c]: any) => c.items.length > 0);

  return (
    <>
      {/* ------------------- CART DRAWER ------------------- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 right-0 sm:-translate-y-1/2 max-w-[412px] mx-auto bg-white/20 dark:bg-slate-950/20 backdrop-blur-2xl border-t border-rose-500/20 dark:border-rose-500/30 rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 z-50 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg">Your Cart{activeCarts.length > 1 ? 's' : ''}</h4>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden space-y-6 pr-1">
                {activeCarts.length === 0 ? (
                  <EmptyState 
                    title="Your cart is empty"
                    description="Add items from the menu to start a new order."
                    icon={<ShoppingBag className="w-10 h-10" />}
                  />
                ) : (
                  activeCarts.map(([restaurantId, cartState]: any) => {
                    const total = getCartTotal(restaurantId);
                    return (
                    <div key={restaurantId} className="bg-white/40 dark:bg-slate-900/40 rounded-2xl p-4 border border-rose-500/10 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-rose-500/10 pb-2">
                        <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{cartState.restaurant?.name || 'Restaurant'}</span>
                      </div>
                      <div className="space-y-3">
                        {cartState.items.map((cartItem: any) => (
                          <div key={cartItem.item.id} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <span className="font-semibold text-slate-900 dark:text-[#f0ede6]">{cartItem.item.name}</span>
                              <p className="text-xs text-amber-500 font-mono">₹{cartItem.item.price}</p>
                            </div>
                            <div className="flex items-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-[#f0ede6] rounded-lg font-bold">
                              <button 
                                onClick={() => removeFromCart(cartItem.item.id, restaurantId)}
                                className="p-1 px-2.5 text-xs hover:text-red-500 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-1 text-xs">{cartItem.quantity}</span>
                              <button 
                                onClick={() => addToCart(cartItem.item, cartState.restaurant)}
                                className="p-1 px-2.5 text-xs hover:text-emerald-500 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary calculations for this restaurant */}
                      <div className="border-t border-rose-500/10 pt-3 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Subtotal</span>
                          <span>₹{total.subtotal.toFixed(2)}</span>
                        </div>
                        {(total.platformFee !== undefined && total.platformFee > 0) && (
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Platform Fee</span>
                            <span>₹{total.platformFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Delivery Fee</span>
                          <span>{total.deliveryFee === 0 ? <span className="text-emerald-500 font-bold">FREE</span> : `₹${total.deliveryFee.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>SGST (2.5%)</span>
                          <span>₹{total.sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>CGST (2.5%)</span>
                          <span>₹{total.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 dark:text-[#f0ede6] font-bold text-sm pt-1 border-t border-rose-500/10">
                          <span>Total</span>
                          <span>₹{total.total?.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onCheckoutClick(restaurantId)}
                        disabled={isSubmitting || isQuoting}
                        className="w-full mt-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-bold shadow-md shadow-orange-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {isSubmitting ? 'Processing...' : isQuoting ? 'Calculating Quote...' : `Checkout ${cartState.restaurant?.name}`}
                      </button>
                    </div>
                  )})
                )}
              </div>

              {/* Address indicator */}
              <div className="p-3 bg-white/20 dark:bg-slate-900/45 backdrop-blur-sm border border-rose-500/20 dark:border-rose-500/30 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono">Delivering To</span>
                <input 
                  type="text" 
                  value={localAddress}
                  onChange={(e) => setLocalAddress(e.target.value)}
                  className="bg-transparent border-none text-xs w-full font-semibold text-slate-800 dark:text-[#f0ede6] focus:outline-none"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
