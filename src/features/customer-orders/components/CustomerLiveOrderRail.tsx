import React from 'react';
import type { Order } from '@/types';
import { useCallContext } from '@/contexts/CallContext';
import { Surface } from '@shared/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { OrderTrackerLive } from './OrderTrackerLive';

const OrderTrackingMap = React.lazy(() => import('@features/maps-tracking/components/OrderTrackingMap'));

/**
 * The desktop right rail from `Desktop.dc.html`: the order on its way, beside the menu rather
 * than instead of it. Only from `xl:` (the artboard is drawn at 1280), and only while there is
 * a live order -- an empty rail would take 344 px from the menu to say nothing.
 *
 * It renders the same `OrderTrackerLive` the phone shows, so there is one tracker, not two.
 *
 * Below 1280 it renders nothing at all. It used to be `hidden xl:flex` -- invisible but mounted --
 * while the main column also showed the order below 1280, so every phone and tablet ran two
 * trackers, two maps and two /live-tracking streams for one order (Phase 7 B9).
 */

interface CustomerLiveOrderRailProps {
  order: Order;
  onAddApiLog?: (log: unknown) => void;
  onUpdateOrder?: (id: string, status: string) => void;
  setInternalOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setTrackingOrder: (order: Order | null) => void;
  showError: (msg: string) => void;
}

export const RAIL_MEDIA_QUERY = '(min-width: 1280px)';

export function CustomerLiveOrderRail({ order, ...rest }: CustomerLiveOrderRailProps) {
  const { startCall } = useCallContext();
  const wide = useMediaQuery(RAIL_MEDIA_QUERY);
  if (!wide) return null;
  return (
    <aside
      aria-label="Live order"
      className="hidden xl:flex w-[344px] shrink-0 flex-col gap-4 p-5 overflow-y-auto border-l border-paper-line"
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-live)' }} aria-hidden="true" />
        <h2 className="flex-1 text-[15px] font-extrabold tracking-tight text-ink">Live order</h2>
        <span className="font-mono text-[11px] text-ink-2">#{order.id.slice(0, 8).toUpperCase()}</span>
      </div>
      <Surface radius="lg" elevation={1} className="relative w-full h-44 overflow-hidden">
        <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center text-sm text-ink-2">Loading map…</div>}>
          <OrderTrackingMap order={order} enableLiveTracking={true} />
        </React.Suspense>
      </Surface>
      <OrderTrackerLive currentTrackingOrder={order} isFailedOrder={() => false} startCall={startCall} {...rest} />
    </aside>
  );
}
