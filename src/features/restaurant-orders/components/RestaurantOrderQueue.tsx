import { Order, OrderStatus } from '@/types';
import { KanbanColumn } from '@features/restaurant-orders/components/KanbanColumn';
import { RestaurantOrderCard } from '@features/restaurant-orders/components/RestaurantOrderCard';
import {
 Bike,
 ChefHat,
 Clock,
 RefreshCw,
 Sliders,
 Truck
} from 'lucide-react';
import React, { useMemo } from 'react';
import { z } from 'zod';
import { RefundView } from '@/api/generated/schemas/customer/common';
import { Spinner, Surface } from '@shared/ui';

type RefundViewType = z.infer<typeof RefundView>;

interface RestaurantOrderQueueProps {
 totalRevenue: number;
 completedOrders: Order[];
 pendingOrders: Order[];
 activePreparing: Order[];
 myOrders: Order[];
 refundRequests?: RefundViewType[];

 cardDelayStatus: Record<string, { minutes: number, reason: string }>;

 handleCardCancelSubmit: (orderId: string, reason: string) => void;
 handleCardDelaySubmit: (orderId: string, minutes: string, reason: string) => void;
 handleCardPartialRefundSubmit: (orderId: string, amount: string, reason: string) => void;

 handleStatusTransition: (order: Order) => void;
 setSelectedChatOrder: (order: Order) => void;
}

const ICON = { className: "w-8 h-8", strokeWidth: 1.5 } as const;

export const RestaurantOrderQueue = React.memo(function RestaurantOrderQueue({
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
 totalRevenue,
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
 completedOrders,
 pendingOrders,
 activePreparing,
 myOrders,
 refundRequests = [],
 cardDelayStatus,
 handleCardCancelSubmit,
 handleCardDelaySubmit,
 handleCardPartialRefundSubmit,
 handleStatusTransition,
 setSelectedChatOrder
}: RestaurantOrderQueueProps) {
 // Newest first, and each status filtered once. Every column used to run its own filter
 // three times over -- for the count, for the emptiness test and again to render.
 const byStatus = useMemo(() => {
   const of = (status: OrderStatus) =>
     myOrders.filter(o => o.status === status).slice().reverse();
   return {
     delayed: of(OrderStatus.AWAITING_DELAY_APPROVAL),
     ready: of(OrderStatus.READY_FOR_PICKUP),
     handedOver: of(OrderStatus.HANDED_OVER),
   };
 }, [myOrders]);

 const card = (order: Order, extra: { isNewPlaced?: boolean; isRefundRequest?: boolean; isCooking?: boolean; isPrepared?: boolean; isBeingDelivered?: boolean } = {}) => (
   <RestaurantOrderCard
     key={order.id}
     order={order}
     cardDelayStatus={cardDelayStatus}
     handleStatusTransition={handleStatusTransition}
     setSelectedChatOrder={setSelectedChatOrder}
     handleCardCancelSubmit={handleCardCancelSubmit}
     handleCardDelaySubmit={handleCardDelaySubmit}
     handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
     {...extra}
   />
 );

 const refundOrders = refundRequests
   .slice()
   .reverse()
   .map(ticket => myOrders.find(o => o.id === ticket.orderId))
   .filter((o): o is Order => Boolean(o));

 // A plain div, and NOT key="orders-panel".
 //
 // This root carried the SAME `key` as the <motion.div> that wraps it in
 // RestaurantTabPanels, nested directly inside it. AnimatePresence tracks children by key,
 // so a duplicate inside its subtree corrupted the presence entry: the orders panel's exit
 // never resolved, and with mode="wait" the next panel never mounted. The restaurant tabs
 // therefore changed the URL and the tab highlight while the Kanban stayed on screen -- and
 // a full page load looked fine, because an initial mount has no exit to wait for.
 //
 // The parent already provides the entrance animation; animating again here was redundant.
 return (
 <div
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
 <Surface radius="md" elevation={2} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-300 px-2.5 py-1">
 <Spinner size="xs" color="var(--color-action)" label="" />
 <span>Auto-Sync Gateway</span>
 </Surface>
 </div>

 {/*
   A scroll-snap rail on a phone; a grid from md: up. The kitchen runs this on a
   propped-up landscape tablet, where the whole board has to be visible at once --
   that is what a kanban is for, and scrolling it sideways at 1024px was a phone
   layout that happened to be wide.
 */}
 <div className="flex gap-4 pb-6 w-full overflow-x-auto touch-pan-x snap-x snap-mandatory scrollbar-thin scrollbar-thumb-rose-500/30 scrollbar-track-transparent md:grid md:overflow-visible md:snap-none md:[grid-template-columns:repeat(auto-fit,minmax(310px,1fr))]">

 <KanbanColumn
 title="New Placed"
 tone="warning"
 beat="ping"
 count={pendingOrders.length}
 emptyIcon={<Clock {...ICON} />}
 emptyTitle="No pending orders"
 emptyHint="When customers place live orders, they will ping in this slot instantly."
 >
 {pendingOrders.slice().reverse().map(order => card(order, { isNewPlaced: true }))}
 </KanbanColumn>

 <KanbanColumn
 title="Active Refunds"
 tone="danger"
 beat="ping"
 count={refundOrders.length}
 emptyIcon={<RefreshCw {...ICON} />}
 emptyTitle="No active requests"
 emptyHint="Customer refund requests will appear here for review."
 >
 {refundOrders.map(order => card(order, { isRefundRequest: true }))}
 </KanbanColumn>

 <KanbanColumn
 title="Requested Delay"
 tone="danger"
 count={byStatus.delayed.length}
 emptyIcon={<Clock {...ICON} />}
 emptyTitle="No delayed orders"
 emptyHint="Orders awaiting a delay decision from the customer will appear here."
 >
 {byStatus.delayed.map(order => card(order))}
 </KanbanColumn>

 <KanbanColumn
 title="Cooking Feed"
 tone="warning"
 count={activePreparing.length}
 emptyIcon={<ChefHat {...ICON} />}
 emptyTitle="Kitchen is idle"
 emptyHint="Accepted tickets appear here. Start cooking to alert couriers!"
 >
 {activePreparing.slice().reverse().map(order => card(order, { isCooking: true }))}
 </KanbanColumn>

 <KanbanColumn
 title="Prepared Ready"
 tone="success"
 count={byStatus.ready.length}
 emptyIcon={<Truck {...ICON} />}
 emptyTitle="No ready packages"
 emptyHint="Finished dishes will wait here. Handover to couriers with secure codes."
 >
 {byStatus.ready.map(order => card(order, { isPrepared: true }))}
 </KanbanColumn>

 <KanbanColumn
 title="Being Delivered"
 tone="info"
 count={byStatus.handedOver.length}
 emptyIcon={<Bike {...ICON} />}
 emptyTitle="No orders in transit"
 emptyHint="Orders picked up by riders will appear here until delivered."
 >
 {byStatus.handedOver.map(order => card(order, { isBeingDelivered: true }))}
 </KanbanColumn>

 </div>
 </div>
 </div>
 );
});
