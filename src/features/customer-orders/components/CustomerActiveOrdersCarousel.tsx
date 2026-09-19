import { Order } from '@/types';
import { orderStatusView } from '@features/customer-orders/model/orderStatus';
import { StatusPill, Surface } from '@shared/ui';

/**
 * The live-order strip: everything the customer has in flight, one card each, floating above
 * the bottom chrome.
 *
 * The status now comes from `orderStatusView`, so a delivered order reads green and a failed
 * one reads red. Every card previously rendered the same rose badge whatever the status was —
 * the one place a customer glances to see how an order is going told them nothing about it.
 */

interface CustomerActiveOrdersCarouselProps {
  activeOrders: Order[];
  isActiveOrder: (order: Order) => boolean;
  trackingOrder: Order | null;
  cartLength: number;
  setTrackingOrder: (order: Order) => void;
}

export default function CustomerActiveOrdersCarousel({
  activeOrders,
  isActiveOrder,
  trackingOrder,
  cartLength,
  setTrackingOrder,
}: CustomerActiveOrdersCarouselProps) {
  const inFlight = activeOrders.filter(isActiveOrder);
  if (inFlight.length === 0 || trackingOrder) return null;

  return (
    <div
      className={`fixed left-0 right-0 max-w-3xl mx-auto z-30 pointer-events-none ${
        cartLength > 0 ? 'bottom-24' : 'bottom-4'
      }`}
    >
      <ul className="flex overflow-x-auto snap-x snap-mandatory px-5 gap-4 pb-2 pointer-events-auto list-none">
        {inFlight
          .slice()
          .reverse()
          .map((order) => {
            const status = orderStatusView(order.status, order.deliveryStatus);
            return (
              <li key={order.id} className="shrink-0 w-[85%] sm:w-[340px] snap-center">
                <button
                  onClick={() => setTrackingOrder(order)}
                  className="w-full text-left cursor-pointer"
                  aria-label={`Track your order from ${order.restaurantName}`}
                >
                  <Surface variant="glass-overlay" radius="xl" elevation={3} interactive className="p-3.5">
                    <span className="flex justify-between items-center gap-2">
                      <span
                        className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: 'var(--color-ink-2)',
                          background: 'var(--color-paper-sunken)',
                        }}
                      >
                        #{order.id.substring(0, 8)}
                      </span>
                      <span
                        className="font-extrabold text-[14px] line-clamp-1 flex-1"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {order.restaurantName}
                      </span>
                      <StatusPill label={status.label} tone={status.tone} live={status.live} />
                    </span>
                  </Surface>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
