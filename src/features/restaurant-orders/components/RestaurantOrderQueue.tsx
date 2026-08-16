import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, CheckCircle, Sliders, RefreshCw, Clock, 
  User, MapPin, Bike, XCircle, Check, Send, 
  ChefHat, Flame, Play, CheckCircle2, MessageSquare, Truck, Shield 
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { RestaurantOrderCard } from '@features/restaurant-orders/components/RestaurantOrderCard';

// Utility
const getFriendlyDeliveryStatusMessage = (status: string | undefined): string => {
  if (!status) return "Searching...";
  switch (status.toUpperCase()) {
    case 'PENDING': return 'Searching...';
    case 'ASSIGNED': return 'On the way';
    case 'ARRIVED_AT_RESTAURANT': return 'At restaurant';
    case 'PICKED_UP': return 'Out for delivery';
    case 'ARRIVED_AT_CUSTOMER': return 'Arrived at customer';
    case 'DELIVERED': return 'Delivered';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
};

interface RestaurantOrderQueueProps {
  totalRevenue: number;
  completedOrders: Order[];
  pendingOrders: Order[];
  activePreparing: Order[];
  myOrders: Order[];
  
  cardDelayStatus: Record<string, { minutes: number, reason: string }>;
  
  handleCardCancelSubmit: (orderId: string, reason: string) => void;
  handleCardDelaySubmit: (orderId: string, minutes: string, reason: string) => void;
  handleCardPartialRefundSubmit: (orderId: string, amount: string, reason: string) => void;
  
  handleStatusTransition: (order: Order) => void;
  setSelectedChatOrder: (order: Order) => void;
}

export const RestaurantOrderQueue = React.memo(function RestaurantOrderQueue({
  totalRevenue,
  completedOrders,
  pendingOrders,
  activePreparing,
  myOrders,
  cardDelayStatus,
  handleCardCancelSubmit,
  handleCardDelaySubmit,
  handleCardPartialRefundSubmit,
  handleStatusTransition,
  setSelectedChatOrder
}: RestaurantOrderQueueProps) {
  return (
    <motion.div
      key="orders-panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-5 space-y-5"
    >


      {/* Live Orders Kanban Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-[#f0ede6] uppercase font-sans flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-rose-500" />
              <span>Kitchen Kanban Board</span>
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-300">Manage orders through standard operations. Swiping/scrolling available.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-rose-500/20 dark:border-rose-500/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <RefreshCw className="w-3 h-3 animate-spin text-rose-500" />
            <span>Auto-Sync Gateway</span>
          </div>
        </div>

        {/* Responsive Kanban Columns */}
        <div className="flex gap-4 pb-6 w-full overflow-x-auto touch-pan-x snap-x snap-mandatory scrollbar-thin scrollbar-thumb-rose-500/30 scrollbar-track-transparent ">
          
          {/* COLUMN 1: Placed Orders (Just Got Placed) */}
          <div className="w-[85%] xs:w-[310px] sm:w-[350px] shrink-0 snap-center flex flex-col glass-panel p-4 min-h-[480px]">
            <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">New Placed</span>
              </div>
              <span className="text-[10px] font-black font-mono bg-amber-500/10 text-amber-550 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {pendingOrders.length}
              </span>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
              {pendingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 relative z-10">
                      <Clock className="w-8 h-8 text-amber-400 dark:text-amber-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">No pending orders</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">When customers place live orders, they will ping in this slot instantly.</p>
                </div>
              ) : (
                pendingOrders.slice().reverse().map(order => (
                  <RestaurantOrderCard
                    key={order.id}
                    order={order}
                    cardDelayStatus={cardDelayStatus}
                    isNewPlaced={true}
                    handleStatusTransition={handleStatusTransition}
                    setSelectedChatOrder={setSelectedChatOrder}
                    handleCardCancelSubmit={handleCardCancelSubmit}
                    handleCardDelaySubmit={handleCardDelaySubmit}
                    handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: Requested Delay (On Hold) */}
          <div className="w-[85%] xs:w-[310px] sm:w-[350px] shrink-0 snap-center flex flex-col glass-panel p-4 min-h-[480px]">
            <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">Requested Delay</span>
              </div>
              <span className="text-[10px] font-black font-mono bg-red-500/10 text-red-500 px-2.5 py-0.5 rounded-full border border-red-500/20">
                {myOrders.filter(o => o.status === OrderStatus.AWAITING_DELAY_APPROVAL).length}
              </span>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
              {myOrders.filter(o => o.status === OrderStatus.AWAITING_DELAY_APPROVAL).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-red-500/20 dark:bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 relative z-10">
                      <Clock className="w-8 h-8 text-red-400 dark:text-red-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">No delayed orders</h3>
                </div>
              ) : (
                myOrders.filter(o => o.status === OrderStatus.AWAITING_DELAY_APPROVAL).slice().reverse().map(order => (
                  <RestaurantOrderCard
                    key={order.id}
                    order={order}
                    cardDelayStatus={cardDelayStatus}
                    isRequestedDelay={true}
                    handleStatusTransition={handleStatusTransition}
                    setSelectedChatOrder={setSelectedChatOrder}
                    handleCardCancelSubmit={handleCardCancelSubmit}
                    handleCardDelaySubmit={handleCardDelaySubmit}
                    handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: Kitchen Preparing (Accepted or Preparing) */}
          <div className="w-[85%] xs:w-[310px] sm:w-[350px] shrink-0 snap-center flex flex-col glass-panel p-4 min-h-[480px]">
            <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">Cooking Feed</span>
              </div>
              <span className="text-[10px] font-black font-mono bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                {activePreparing.length}
              </span>
            </div>

            {/* Body - Scrollable list */}
            <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
              {activePreparing.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 relative z-10">
                      <ChefHat className="w-8 h-8 text-indigo-400 dark:text-indigo-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">Kitchen is idle</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">Accepted tickets appear here. Start cooking to alert couriers!</p>
                </div>
              ) : (
                activePreparing.slice().reverse().map(order => (
                  <RestaurantOrderCard
                    key={order.id}
                    order={order}
                    cardDelayStatus={cardDelayStatus}
                    isCooking={true}
                    handleStatusTransition={handleStatusTransition}
                    setSelectedChatOrder={setSelectedChatOrder}
                    handleCardCancelSubmit={handleCardCancelSubmit}
                    handleCardDelaySubmit={handleCardDelaySubmit}
                    handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 4: Prepared & Ready (Dispatched, awaiting pickup) */}
          <div className="w-[85%] xs:w-[310px] sm:w-[350px] shrink-0 snap-center flex flex-col glass-panel p-4 min-h-[480px]">
            <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">Prepared Ready</span>
              </div>
              <span className="text-[10px] font-black font-mono bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {myOrders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP).length}
              </span>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
              {myOrders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 relative z-10">
                      <Truck className="w-8 h-8 text-emerald-400 dark:text-emerald-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">No ready packages</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">Finished dishes will wait here. Handover to couriers with secure codes.</p>
                </div>
              ) : (
                myOrders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP).slice().reverse().map(order => (
                  <RestaurantOrderCard
                    key={order.id}
                    order={order}
                    cardDelayStatus={cardDelayStatus}
                    isPrepared={true}
                    handleStatusTransition={handleStatusTransition}
                    setSelectedChatOrder={setSelectedChatOrder}
                    handleCardCancelSubmit={handleCardCancelSubmit}
                    handleCardDelaySubmit={handleCardDelaySubmit}
                    handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 5: Being Delivered (Picked up) */}
          <div className="w-[85%] xs:w-[310px] sm:w-[350px] shrink-0 snap-center flex flex-col glass-panel p-4 min-h-[480px]">
            <div className="flex items-center justify-between border-b border-purple-500/20 dark:border-purple-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">Being Delivered</span>
              </div>
              <span className="text-[10px] font-black font-mono bg-purple-500/10 text-purple-650 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                {myOrders.filter(o => o.status === OrderStatus.HANDED_OVER).length}
              </span>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
              {myOrders.filter(o => o.status === OrderStatus.HANDED_OVER).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/40 dark:bg-slate-900/10 border border-dashed border-purple-500/20 dark:border-purple-500/30 rounded-2xl">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 relative z-10">
                      <Bike className="w-8 h-8 text-purple-400 dark:text-purple-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">No orders in transit</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">Orders picked up by riders will appear here until delivered.</p>
                </div>
              ) : (
                myOrders.filter(o => o.status === OrderStatus.HANDED_OVER).slice().reverse().map(order => (
                  <RestaurantOrderCard
                    key={order.id}
                    order={order}
                    cardDelayStatus={cardDelayStatus}
                    isBeingDelivered={true}
                    handleStatusTransition={handleStatusTransition}
                    setSelectedChatOrder={setSelectedChatOrder}
                    handleCardCancelSubmit={handleCardCancelSubmit}
                    handleCardDelaySubmit={handleCardDelaySubmit}
                    handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
});
