import { Button, EmptyState, Overlay, Stepper, Surface, surfaceStyle } from '@shared/ui';
import { AlertCircle, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { MenuItem, Restaurant } from '@/types';
import React from 'react';
import { z } from 'zod';
import { formatINR } from '@shared/money';

const checkoutSchema = z.object({
  deliveryAddressId: z.string().min(1, "Please select a valid delivery address before checking out.")
});

import { CartState } from '../model/useCustomerCart';

interface CartTotal {
  subtotal: number;
  platformFee?: number;
  deliveryFee?: number;
  sgst: number;
  cgst: number;
  total?: number;
  isEstimated?: boolean;
}

interface CustomerCartDrawerProps {
  address: string;
  setAddress?: (addr: string) => void;
  handleCheckout: (restaurantId: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedRestaurant?: Restaurant | null;
  carts: Record<string, CartState>;
  removeFromCart: (itemId: string, restaurantId: string) => void;
  clearCart: (restaurantId: string) => void;
  addToCart: (item: MenuItem, restaurant: Restaurant | null) => void;
  getCartTotal: (restaurantId: string) => CartTotal;
  setIsPaymentModalOpen?: (open: boolean) => void;
  isSubmitting?: boolean;
  isQuoting?: boolean;
  setIsAddressModalOpen?: (open: boolean) => void;
  deliveryAddressId?: string | null;
}

export default function CustomerCartDrawer({
  address,

  handleCheckout,
  isCartOpen,
  setIsCartOpen,
  selectedRestaurant,
  carts,
  removeFromCart,
  addToCart,
  getCartTotal,

  isSubmitting,
  isQuoting,
  setIsAddressModalOpen,
  deliveryAddressId
}: CustomerCartDrawerProps) {
  const [error, setError] = React.useState<string | null>(null);

  const onCheckoutClick = (restaurantId: string) => {
    if (isSubmitting) return;
    const validation = checkoutSchema.safeParse({ deliveryAddressId: deliveryAddressId || '' });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    if (address.includes("Please add an address")) {
      setError("Please select a delivery address before checking out.");
      return;
    }
    setError(null);
    setTimeout(() => {
      handleCheckout(restaurantId);
    }, 0);
  };

  const activeCarts = Object.entries(carts).filter(([_, c]) => c.items.length > 0);

  return (
    <>
      {/* ------------------- CART DRAWER ------------------- */}
      <Overlay
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        label="Your cart"
        placement="bottom"
        className="w-full max-w-[412px]"
      >
            <Surface
              variant="glass-overlay"
              elevation={4}
              radius="xl"
              className="p-6 pb-8 space-y-5"
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
                  activeCarts.map(([restaurantId, cartState]) => {
                    const total = getCartTotal(restaurantId);
                    return (
                    <Surface radius="lg" elevation={1} className="p-4 space-y-4" key={restaurantId}>
                      <div className="flex justify-between items-center border-b border-rose-500/10 pb-2">
                        <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{cartState.restaurant?.name || 'Restaurant'}</span>
                      </div>
                      <div className="space-y-3">
                        {cartState.items.map((cartItem) => (
                          <div key={cartItem.item.id} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <span className="font-semibold text-slate-900 dark:text-[#f0ede6]">{cartItem.item.name}</span>
                              <p className="text-xs text-amber-500 font-mono">{formatINR(cartItem.item.price)}</p>
                            </div>
                            <Stepper
                              value={cartItem.quantity}
                              label={cartItem.item.name ?? 'item'}
                              min={0}
                              onDecrement={() => removeFromCart(cartItem.item.id as string, restaurantId)}
                              onIncrement={() => addToCart(cartItem.item, selectedRestaurant?.id === restaurantId ? selectedRestaurant : cartState.restaurant)}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Summary calculations for this restaurant */}
                      <div className="border-t border-rose-500/10 pt-3 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Subtotal</span>
                          <span>{formatINR(total.subtotal)}</span>
                        </div>
                        {(total.platformFee !== undefined && total.platformFee > 0) && (
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Platform Fee</span>
                            <span>{formatINR(total.platformFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Delivery Fee</span>
                          <span>{total.deliveryFee === 0 ? <span className="text-amber-500 font-bold">FREE</span> : `${formatINR(total.deliveryFee)}`}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>SGST (2.5%)</span>
                          <span>{total.isEstimated ? 'Calculating...' : `${formatINR(total.sgst)}`}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>CGST (2.5%)</span>
                          <span>{total.isEstimated ? 'Calculating...' : `${formatINR(total.cgst)}`}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 dark:text-[#f0ede6] font-bold text-sm pt-1 border-t border-rose-500/10">
                          <span>Total</span>
                          <span>{total.isEstimated ? `Estimate: ${formatINR(total.total)}` : `${formatINR(total.total)}`}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => onCheckoutClick(restaurantId)}
                        disabled={isSubmitting || isQuoting}
                        fullWidth
                        className="mt-2"
                        icon={<ShieldCheck className="w-4 h-4" />}
                      >
                        {isSubmitting ? 'Processing...' : isQuoting ? 'Calculating Quote...' : `Checkout ${cartState.restaurant?.name}`}
                      </Button>
                    </Surface>
                  )})
                )}
              </div>

              {/* Address indicator */}
              <button type="button" 
                onClick={() => {
                  if (setIsAddressModalOpen) {
                    setIsAddressModalOpen(true);
                    setIsCartOpen(false);
                  }
                }}
                className="p-3 space-y-1 cursor-pointer transition-colors flex justify-between items-center text-left w-full"
                style={surfaceStyle({ variant: 'sunken', radius: 'md', elevation: 0 })}
              >
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono">Delivering To</span>
                  <div className="text-xs font-semibold text-slate-800 dark:text-[#f0ede6] truncate pr-2">
                    {address}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md shrink-0">Change</div>
              </button>
              {error && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </Surface>
      </Overlay>

    </>
  );
}
