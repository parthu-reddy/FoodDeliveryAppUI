import { useEffect, useState } from 'react';
import { ChevronRight, PhoneCall, Store, UserRound } from 'lucide-react';
import type { Order } from '@/types';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { Button, StatusPill, Surface, surfaceStyle } from '@shared/ui';
import { formatINR } from '@shared/money';
import { orderStatusView, terminalHeadline } from '@features/customer-orders/model/orderStatus';
import { useLiveOrderActions } from '@features/customer-orders/model/useLiveOrderActions';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { OrderMoneyBreakdown } from './OrderMoneyBreakdown';

/**
 * An order that is still happening — the waiting screen. Built against `Tracking.dc.html`:
 * the next time that matters is the headline, the stages sit directly under it, and the person
 * who has your food is one tap away.
 *
 * Everything shown is a field the order API returns. What the artboard has and the API does
 * not — rider rating, delivery count, per-stage times, a chat button on this card — is left
 * out rather than faked.
 */

interface OrderTrackerLiveProps {
  currentTrackingOrder: Order;
  isFailedOrder: (order: Order) => boolean;
  startCall: (userId: string, name: string) => void;
  onAddApiLog?: (log: unknown) => void;
  onUpdateOrder?: (id: string, status: string) => void;
  setInternalOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setTrackingOrder: (order: Order | null) => void;
  showError: (msg: string) => void;
}

/** Whole minutes until `epochMs`, re-read every 30 s. Null when there is no estimate. */
function useMinutesUntil(epochMs?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!epochMs) return;
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, [epochMs]);
  if (!epochMs) return null;
  return Math.max(0, Math.ceil((epochMs - now) / 60_000));
}

function headlineFor(order: Order): { title: string; detail: string } {
  if (order.deliveryStatus === DeliveryStatus.FAILED) {
    return { title: 'Finding a rider', detail: 'Your food is safe. We are looking for a nearby delivery partner.' };
  }
  switch (order.status) {
    case OrderStatus.CREATED:
    case OrderStatus.PENDING_ACCEPTANCE:
      return { title: 'Waiting for the restaurant', detail: 'They have 10 minutes to accept. If they do not, the order is cancelled for you.' };
    case OrderStatus.AWAITING_DELAY_APPROVAL:
      return { title: 'The kitchen needs more time', detail: 'Let them know if you are happy to wait.' };
    case OrderStatus.ACCEPTED:
    case OrderStatus.PREPARING:
      return { title: 'Cooking now', detail: 'The kitchen has your order.' };
    case OrderStatus.READY_FOR_PICKUP:
      return { title: 'Packed and ready', detail: 'Waiting for your rider to collect it.' };
    default:
      return order.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY
        ? { title: 'On the way', detail: 'Your rider has your food.' }
        : { title: 'Rider at the restaurant', detail: 'Your food is being handed over.' };
  }
}

export function OrderTrackerLive({
  currentTrackingOrder: order, isFailedOrder, startCall,
  onAddApiLog, onUpdateOrder, setInternalOrders, showError, setTrackingOrder,
}: OrderTrackerLiveProps) {
  const failed = isFailedOrder(order);
  // `estimatedCompletionTime` is when the FOOD is ready (the restaurant's accept time plus its
  // prep time, epoch ms -- RestaurentApplication CreatedState), not when it arrives. The
  // artboard's "Arriving in" needs a delivery ETA the API does not return (Phase 7 A5), so the
  // countdown is shown only while the kitchen is cooking and says what it actually measures.
  const cooking = order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.PREPARING;
  const minutes = useMinutesUntil(cooking ? order.estimatedCompletionTime : undefined);
  const { busy, cancel, answerDelay } = useLiveOrderActions({ order, onAddApiLog, onUpdateOrder, setInternalOrders, showError });
  const view = orderStatusView(order.status, order.deliveryStatus);
  const { title, detail } = headlineFor(order);
  const cancellable = order.status === OrderStatus.PENDING_ACCEPTANCE || order.status === OrderStatus.CREATED;
  const itemCount = (order.items ?? []).reduce((n, i) => n + ((i as { quantity?: number }).quantity || 1), 0);

  if (failed) {
    return (
      <Surface radius="xl" elevation={2} className="p-5 space-y-4" data-testid="order-tracker" data-order-id={order.id} data-status={order.status}>
        <StatusPill label={view.label} tone="danger" size="md" />
        <div>
          <h2 className="text-xl font-extrabold text-ink">This order was not completed</h2>
          <p className="mt-1 text-sm text-ink-2">{terminalHeadline(order.status) ?? 'Your order could not be completed.'}</p>
        </div>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            setInternalOrders((prev) => prev.filter((o) => o.id !== order.id));
            setTrackingOrder(null);
          }}
        >
          Dismiss
        </Button>
      </Surface>
    );
  }

  return (
    // data-order-id: the E2E suite reads the full id here. The redesign dropped the "#<uuid>"
    // header it used to scrape, and a styling class is not an interface.
    <div className="space-y-3.5" data-testid="order-tracker" data-order-id={order.id} data-status={order.status}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="flex-1 min-w-[11rem]">
          {minutes !== null ? (
            <>
              <span className="block font-mono text-[10px] font-bold tracking-[.12em] text-ink-2">FOOD READY IN</span>
              <span className="block font-mono text-[44px] leading-none font-bold tracking-tight text-ink">
                {minutes}<span className="ml-1 text-xl font-medium tracking-normal">min</span>
              </span>
              <span className="block mt-1 text-[12.5px] font-semibold text-ink-2">
                by{' '}
                <span className="font-mono font-bold text-ink">
                  {new Date(order.estimatedCompletionTime!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
                {' · the kitchen is cooking'}
              </span>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
              <p className="mt-1 text-[12.5px] font-medium text-ink-2">{detail}</p>
            </>
          )}
        </div>
        <StatusPill label={view.label} tone={view.tone} live={view.live} />
      </div>

      <OrderStatusTimeline status={order.status} deliveryStatus={order.deliveryStatus} className="pt-2" />

      {order.status === OrderStatus.AWAITING_DELAY_APPROVAL && (
        <div className="flex gap-2.5">
          <Button fullWidth disabled={busy} onClick={() => answerDelay(true)}>I&rsquo;ll wait</Button>
          <Button fullWidth variant="secondary" disabled={busy} onClick={() => answerDelay(false)}>Cancel order</Button>
        </div>
      )}

      {order.otp && order.status !== OrderStatus.AWAITING_DELAY_APPROVAL && (
        <Surface radius="lg" elevation={1} className="p-3.5 flex items-center gap-3">
          <span className="flex-1 min-w-0">
            <span className="block font-mono text-[10px] font-bold tracking-wider text-ink-2">DELIVERY CODE</span>
            <span className="block text-[13px] font-semibold text-ink">Tell your rider this code at the door</span>
          </span>
          <span data-testid="delivery-code" className="font-mono text-2xl font-bold tracking-[.2em] text-ink px-3 py-1.5" style={surfaceStyle({ variant: 'sunken', radius: 'md', elevation: 0 })}>
            {order.otp}
          </span>
        </Surface>
      )}

      {order.deliveryExecutiveId && (
        <Surface radius="lg" elevation={2} className="p-3 flex items-center gap-3" data-testid="rider-card">
          <span className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center" style={surfaceStyle({ variant: 'sunken', radius: 'md', elevation: 0 })}>
            <UserRound className="w-6 h-6 text-ink-2" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-extrabold text-ink truncate">{order.deliveryExecutiveName || 'Your rider'}</span>
            <span className="block text-[11px] font-medium text-ink-2">
              {order.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY ? 'Has your food' : 'Assigned to your order'}
            </span>
          </span>
          <Button
            size="icon"
            aria-label={`Call ${order.deliveryExecutiveName || 'your rider'}`}
            onClick={() => startCall(order.deliveryExecutiveId!, order.id)}
            icon={<PhoneCall className="w-5 h-5" />}
          />
        </Surface>
      )}

      <Surface radius="lg" elevation={1} className="overflow-hidden">
        <details className="group">
          <summary className="list-none cursor-pointer p-3.5 flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={surfaceStyle({ variant: 'sunken', radius: 'md', elevation: 0 })}>
              <Store className="w-5 h-5 text-ink-2" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold text-ink truncate">{order.restaurantName ?? 'Your order'}</span>
              <span className="block font-mono text-[10px] font-medium text-ink-2">
                #{order.id.slice(0, 8).toUpperCase()} · {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} · {formatINR(order.totalAmount ?? 0)}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-ink-3 transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="px-4 pb-4 space-y-3">
            <ul className="space-y-2">
              {(order.items ?? []).map((raw, idx) => {
                const i = raw as { item?: { name?: string; price?: number }; quantity?: number; name?: string; price?: number };
                const qty = i.quantity || 1;
                return (
                  <li key={idx} className="flex justify-between gap-3 text-[13px]">
                    <span className="font-semibold text-ink">{qty}× {i.item?.name || i.name || 'Item'}</span>
                    <span className="font-mono text-ink">{formatINR((i.item?.price || i.price || 0) * qty)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-dashed border-paper-line pt-3">
              <OrderMoneyBreakdown order={order} />
            </div>
            {order.paymentMethod && <p className="text-[11px] font-semibold text-ink-2">Paid via {order.paymentMethod}</p>}
            {order.restaurantId && (
              <Button variant="ghost" size="sm" onClick={() => startCall(order.restaurantId!, order.id)} icon={<PhoneCall className="w-4 h-4" />}>
                Call the restaurant
              </Button>
            )}
          </div>
        </details>
      </Surface>

      {cancellable && (
        <Button variant="ghost" fullWidth disabled={busy} onClick={cancel} className="!text-danger">
          Cancel order
        </Button>
      )}
    </div>
  );
}
