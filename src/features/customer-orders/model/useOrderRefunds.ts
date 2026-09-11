import { customerApi } from '@/lib/zodiosClients';
import { RefundView } from '@/types';
import { useEffect, useState } from 'react';

const NONE: RefundView[] = [];

/**
 * The refunds raised against one order.
 *
 * A cancelled order used to show the customer nothing about their money: the tracker said the
 * order "will be refunded" and then never mentioned it again, while `RefundService` had already
 * recorded a status, an amount and a destination the customer could not see. Store credit in
 * particular is invisible if nobody tells you that is where the money went.
 *
 * Fetched only for orders that ended -- a live order has no refund to show. The result is stored
 * with the id it was fetched for and returned only on a match, so switching orders shows nothing
 * rather than the previous order's refund, without clearing state from inside the effect.
 */
export function useOrderRefunds(orderId: string | undefined, enabled: boolean): RefundView[] {
  const [loaded, setLoaded] = useState<{ orderId: string; refunds: RefundView[] } | null>(null);

  useEffect(() => {
    if (!orderId || !enabled) return;
    let ignore = false;
    customerApi.customerMoney
      .get('/api/v1/money/customer/orders/:orderId/refunds', { params: { orderId } })
      .then(res => {
        if (!ignore) setLoaded({ orderId, refunds: res ?? NONE });
      })
      .catch(() => {
        // A refund that cannot be read is not worth breaking the order view for; the rest of the
        // page still tells the customer what happened to the order itself.
        if (!ignore) setLoaded({ orderId, refunds: NONE });
      });
    return () => { ignore = true; };
  }, [orderId, enabled]);

  if (!orderId || !enabled || loaded?.orderId !== orderId) return NONE;
  return loaded.refunds;
}
