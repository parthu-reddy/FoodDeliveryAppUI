import { Surface } from '@shared/ui';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { RateOrderModal } from '@features/reviews';
import { OrderTrackerLive } from './OrderTrackerLive';
import { OrderTrackerSettled } from './OrderTrackerSettled';
// Use React.lazy for map
const OrderTrackingMap = React.lazy(() => import("@features/maps-tracking/components/OrderTrackingMap"));
import { useCallContext } from '@/contexts/CallContext';

import { Order } from '@/types';
import { useOrderRefunds } from '@features/customer-orders/model/useOrderRefunds';
import { Select } from '@shared/ui';

interface CustomerOrderTrackerProps {
  currentTrackingOrder: Order;
  setTrackingOrder: (order: Order | null) => void;
  isActiveOrder: (order: Order) => boolean;
  activeOrders: Order[];
  isFailedOrder: (order: Order) => boolean;
  onAddApiLog?: (log: unknown) => void;
  onUpdateOrder?: (id: string, status: string) => void;
  setInternalOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  showError: (msg: string) => void;
  getFriendlyStatusMessage: (status: string, deliveryStatus?: string) => string;
}

export const CustomerOrderTracker: React.FC<CustomerOrderTrackerProps> = ({
  currentTrackingOrder,
  setTrackingOrder,
  isActiveOrder,
  activeOrders,
  isFailedOrder,
  onAddApiLog,
  onUpdateOrder,
  setInternalOrders,
  showError,
  getFriendlyStatusMessage,
}) => {
  const { startCall } = useCallContext();
  const refunds = useOrderRefunds(currentTrackingOrder?.id, isFailedOrder(currentTrackingOrder));
  const [orderIdToRate, setOrderIdToRate] = useState<string | null>(null);
  const presets = useMotionPresets();
  return (
    <motion.div
      key="tracking" {...presets.rise}
      className="p-5 space-y-5"
    >
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setTrackingOrder(null)}
          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:text-[#f0ede6] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg flex items-center gap-2">
          {isActiveOrder(currentTrackingOrder) ? 'Order Tracking' : 'Order Details'}
          {activeOrders.filter(o => isActiveOrder(o)).length > 1 ? (
            <Select
              selectSize="sm"
              aria-label="Which order to track"
              className="w-56"
              value={currentTrackingOrder.id}
              onChange={(id: string) => {
                const order = activeOrders.find((o) => o.id === id);
                if (order) setTrackingOrder(order);
              }}
              options={activeOrders
                .filter((o) => isActiveOrder(o))
                .map((o) => ({ value: o.id, label: `#${o.id} - ${o.status}` }))}
            />
          ) : (
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300">#{currentTrackingOrder.id}</span>
          )}
        </h3>
      </div>

      {isActiveOrder(currentTrackingOrder) && !isFailedOrder(currentTrackingOrder) ? (
        <>
          {/* Immersive Delivery map (Vector path simulation) */}
          <Surface radius="xl" elevation={0} className="relative w-full h-44 overflow-hidden">
            <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">Loading map...</div>}>
              <OrderTrackingMap order={currentTrackingOrder} enableLiveTracking={true} />
            </React.Suspense>
          </Surface>

          <OrderTrackerLive
            currentTrackingOrder={currentTrackingOrder}
            isFailedOrder={isFailedOrder}
            startCall={startCall}
            onAddApiLog={onAddApiLog}
            onUpdateOrder={onUpdateOrder}
            setInternalOrders={setInternalOrders}
            showError={showError}
            setTrackingOrder={setTrackingOrder}
          />
        </>
      ) : (
        <OrderTrackerSettled
          currentTrackingOrder={currentTrackingOrder}
          isFailedOrder={isFailedOrder}
          getFriendlyStatusMessage={getFriendlyStatusMessage}
          refunds={refunds}
          setOrderIdToRate={setOrderIdToRate}
          startCall={startCall}
        />
      )}

      {/* Quick action / note */}
      <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-center">
        <p className="text-xs text-amber-500 leading-relaxed">
          👉 <strong>How to complete?</strong> You can switch roles from the top menu, navigate to the <strong>Restaurant View</strong> to accept/cook, then to the <strong>Delivery Partner View</strong> to navigate and insert the OTP!
        </p>
      </div>

      {orderIdToRate && (
        <RateOrderModal
          isOpen={!!orderIdToRate}
          onClose={() => setOrderIdToRate(null)}
          orderId={orderIdToRate}
        />
      )}
    </motion.div>
  );
};
