
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Package, Timer, ShieldCheck, AlertCircle } from 'lucide-react';
import { Restaurant, CartItem, MenuItem } from '../types';
import { z } from 'zod';

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
  cart,
  removeFromCart,
  addToCart,
  getCartTotal,
  setIsPaymentModalOpen
}: any) {
  const [error, setError] = React.useState<string | null>(null);

  const onCheckoutClick = () => {
    const validation = checkoutSchema.safeParse({ address: address.trim() });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    setError(null);
    handleCheckout();
  };

  return (
    <>
      {/* ------------------- CART DRAWER ------------------- */}
      <AnimatePresence>
        {isCartOpen && selectedRestaurant && (
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
                  <h4 className="font-bold text-lg">Your Order</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-300">from {selectedRestaurant.name}</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-48 overflow-y-auto overflow-x-hidden space-y-3 pr-1">
                {cart.map(cartItem => (
                  <div key={cartItem.item.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900 dark:text-[#f0ede6]">{cartItem.item.name}</span>
                      <p className="text-xs text-amber-500 font-mono">${cartItem.item.price}</p>
                    </div>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-[#f0ede6] rounded-lg font-bold">
                      <button 
                        onClick={() => removeFromCart(cartItem.item.id)}
                        className="p-1 px-2.5 text-xs hover:text-red-500 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-1 text-xs">{cartItem.quantity}</span>
                      <button 
                        onClick={() => addToCart(cartItem.item)}
                        className="p-1 px-2.5 text-xs hover:text-emerald-500 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary calculations */}
              <div className="border-t border-rose-500/20 dark:border-rose-500/30 pt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span>${getCartTotal().subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 dark:text-slate-300">
                  <span>Delivery fee</span>
                  <span>${getCartTotal().deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-[#f0ede6] font-bold text-sm">
                  <span>Grand Total</span>
                  <span>${getCartTotal().total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Address indicator */}
              <div className="p-3 bg-white/20 dark:bg-slate-900/45 backdrop-blur-sm border border-rose-500/20 dark:border-rose-500/30 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono">Delivering To</span>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-transparent border-none text-xs w-full font-semibold text-slate-800 dark:text-[#f0ede6] focus:outline-none"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={onCheckoutClick}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              >
                <ShieldCheck className="w-5 h-5" />
                Place Cash-on-Delivery Order
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
