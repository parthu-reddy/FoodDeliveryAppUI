import React from 'react';
import { Order } from '../types';

interface CustomerActiveOrdersCarouselProps {
  activeOrders: Order[];
  isActiveOrder: (status: string) => boolean;
  trackingOrder: Order | null;
  cartLength: number;
  selectedRestaurantId?: string;
  cartRestaurantId?: string;
  setTrackingOrder: (order: Order) => void;
}

export default function CustomerActiveOrdersCarousel({
  activeOrders,
  isActiveOrder,
  trackingOrder,
  cartLength,
  selectedRestaurantId,
  cartRestaurantId,
  setTrackingOrder
}: CustomerActiveOrdersCarouselProps) {
  if (activeOrders.filter(o => isActiveOrder(o.status)).length === 0 || trackingOrder) {
    return null;
  }

  const isCartActiveForSelectedRestaurant = cartLength > 0 && (!selectedRestaurantId || cartRestaurantId === selectedRestaurantId);

  return (
    <div className={`fixed left-0 right-0 max-w-3xl mx-auto z-30 pointer-events-none transition-all duration-300 ${isCartActiveForSelectedRestaurant ? 'bottom-24' : 'bottom-4'}`}>
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none px-5 gap-4 pb-2 pointer-events-auto">
        {activeOrders.filter(o => isActiveOrder(o.status)).slice().reverse().map((order) => (
          <button 
            key={order.id} 
            onClick={() => setTrackingOrder(order)}
            className="shrink-0 w-[85%] sm:w-[340px] snap-center bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl rounded-[20px] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-rose-500/20 dark:border-rose-500/30 p-3.5 text-left cursor-pointer transition-all active:scale-[0.98] hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
          >
            <div className="flex justify-between items-center gap-2">
              <span className="shrink-0 text-[10px] font-mono font-bold text-slate-600 dark:text-[#f0ede6] bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded-full">#{order.id.substring(0, 8)}</span>
              <h5 className="font-extrabold text-[14px] text-slate-900 dark:text-[#f0ede6] line-clamp-1 flex-1">{order.restaurantName}</h5>
              <span className="shrink-0 text-[9px] font-black px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
