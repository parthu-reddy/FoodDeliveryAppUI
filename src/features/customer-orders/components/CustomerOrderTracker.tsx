import { Surface, surfaceStyle } from '@shared/ui';
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
import { orderStatusView } from '@features/customer-orders/model/orderStatus';
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
  const live = isActiveOrder(currentTrackingOrder) && !isFailedOrder(currentTrackingOrder);
  const trackable = activeOrders.filter((o) => isActiveOrder(o));
  return (
    <motion.div
      key="tracking" {...presets.rise}
      className="p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setTrackingOrder(null)}
          aria-label="Back"
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-ink"
          style={surfaceStyle({ radius: 'md', elevation: 1 })}
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <h1 className="flex-1 min-w-0 text-[17px] font-extrabold tracking-tight text-ink">
          {live ? 'Live order' : 'Order details'}
        </h1>
        {trackable.length > 1 && (
          <Select
            selectSize="sm"
            aria-label="Which order to track"
            className="w-48"
            value={currentTrackingOrder.id}
            onChange={(id: string) => {
              const order = activeOrders.find((o) => o.id === id);
              if (order) setTrackingOrder(order);
            }}
            options={trackable.map((o) => ({
              value: o.id,
              label: `${o.restaurantName ?? 'Order'} · ${orderStatusView(o.status, o.deliveryStatus).label}`,
            }))}
          />
        )}
      </div>

      {live ? (
        <>
          <Surface radius="xl" elevation={1} className="relative w-full h-56 sm:h-64 overflow-hidden">
            <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center text-sm text-ink-2">Loading map…</div>}>
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
