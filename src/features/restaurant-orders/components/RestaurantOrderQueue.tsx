import { Order, OrderStatus } from '@/types';
import { KanbanColumn } from '@features/restaurant-orders/components/KanbanColumn';
import { RestaurantOrderCard } from '@features/restaurant-orders/components/RestaurantOrderCard';
import {
 Bike,
 ChefHat,
 Clock,
 RefreshCw,
 Truck
} from 'lucide-react';
import React, { useMemo } from 'react';
import { z } from 'zod';
import { RefundView } from '@/api/generated/schemas/customer/common';

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
 <div className="flex items-baseline justify-between gap-3">
 <h2 className="font-extrabold text-base tracking-tight text-ink">Orders</h2>
 {/* Honest about freshness: the board polls every 5 s (useRestaurantOrders). It used to
     show a spinner labelled "Auto-Sync Gateway", which described nothing. */}
 <span className="text-[11px] font-mono text-ink-2">Updates every 5 s</span>
 </div>

 {/*
   A scroll-snap rail on a phone; a grid from md: up. The kitchen runs this on a
   propped-up landscape tablet, where the whole board has to be visible at once --
   that is what a kanban is for, and scrolling it sideways at 1024px was a phone
   layout that happened to be wide.
 */}
 <div className="flex gap-4 pb-6 w-full overflow-x-auto touch-pan-x snap-x snap-mandatory scrollbar-thin scrollbar-thumb-rose-500/30 scrollbar-track-transparent md:grid md:overflow-visible md:snap-none md:[grid-template-columns:repeat(auto-fit,minmax(310px,1fr))]">

 <KanbanColumn
 title="Incoming"
 tone="warning"
 beat="ping"
 count={pendingOrders.length}
 emptyIcon={<Clock {...ICON} />}
 emptyTitle="No new orders"
 emptyHint="New orders appear here with a clock: 10 minutes to accept."
 >
 {pendingOrders.slice().reverse().map(order => card(order, { isNewPlaced: true }))}
 </KanbanColumn>

 <KanbanColumn
 title="In the kitchen"
 tone="warning"
 count={activePreparing.length}
 emptyIcon={<ChefHat {...ICON} />}
 emptyTitle="Nothing cooking"
 emptyHint="Accepted orders become kitchen tickets here."
 >
 {activePreparing.slice().reverse().map(order => card(order, { isCooking: true }))}
 </KanbanColumn>

 <KanbanColumn
 title="Waiting on customer"
 tone="danger"
 count={byStatus.delayed.length}
 emptyIcon={<Clock {...ICON} />}
 emptyTitle="No delayed orders"
 emptyHint="Orders where you asked for more time wait here for the customer\u2019s answer."
 >
 {byStatus.delayed.map(order => card(order))}
 </KanbanColumn>

 <KanbanColumn
 title="Ready for pickup"
 tone="success"
 count={byStatus.ready.length}
 emptyIcon={<Truck {...ICON} />}
 emptyTitle="Nothing waiting"
 emptyHint="Packed orders wait here until the rider collects them with the pickup code."
 >
 {byStatus.ready.map(order => card(order, { isPrepared: true }))}
 </KanbanColumn>

 <KanbanColumn
 title="Out for delivery"
 tone="info"
 count={byStatus.handedOver.length}
 emptyIcon={<Bike {...ICON} />}
 emptyTitle="No orders in transit"
 emptyHint="Orders picked up by riders will appear here until delivered."
 >
 {byStatus.handedOver.map(order => card(order, { isBeingDelivered: true }))}
 </KanbanColumn>

 <KanbanColumn
 title="Refund requests"
 tone="danger"
 beat="ping"
 count={refundOrders.length}
 emptyIcon={<RefreshCw {...ICON} />}
 emptyTitle="No refund requests"
 emptyHint="Customer refund requests will appear here for review."
 >
 {refundOrders.map(order => card(order, { isRefundRequest: true }))}
 </KanbanColumn>

 </div>
 </div>
 </div>
 );
});
