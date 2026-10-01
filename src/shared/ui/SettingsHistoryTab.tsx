/* eslint-disable react-hooks/set-state-in-effect */
import { customerApi } from '@/lib/zodiosClients';
import { useToast } from '@/contexts/ToastContext';
// the same Order the settings view uses: `@/types` is a wider shape and the two
// are not assignable in either direction
import type { Order } from '../../schemas/order';
import { RoleName } from '@/types';
import { OrderReviewAction, ReceivedFeedbackPanel } from '@features/reviews';
import { formatINR } from '@shared/money';
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { placedAt } from '@features/customer-orders/model/placedAt';
import { Badge } from './Badge';
import { Button } from './action/Button';
import { PullToRefresh } from './feedback/PullToRefresh';
import { Surface } from './surface/Surface';
import { useEffect, useRef, useState } from 'react';

/**
 * The customer's past orders, inside account settings.
 *
 * Split out of SharedSettingsView, which carried five tabs, two fetchers and their paging in
 * one 468-line file. The "have I fetched this tab yet" flags went with it: the tab only
 * renders while it is selected, so the first fetch is simply what happens on mount.
 */
export function SettingsHistoryTab({ setTrackingOrder }: { setTrackingOrder?: (order: Order) => void }) {
  const { showError } = useToast();
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);
  const [currentPageOrders, setCurrentPageOrders] = useState(0);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [failedPage, setFailedPage] = useState<number | null>(null);
  const requestVersion = useRef(0);

  const fetchOrders = async (page: number, type: 'history') => {
    const version = ++requestVersion.current;
    setFailedPage(null);
    try {
      if (type === 'history') setIsLoadingOrders(true);
      
      let rawRes: unknown;
      if (type === 'history') {
         rawRes = await customerApi.order.get('/api/v1/orders/history', { queries: { page } });
      } else {
         throw new Error(`Unsupported order type: ${type}`);
      }
      
      const res = rawRes as {data?: {content?: Order[], last?: boolean}} | {data?: Order[]} | undefined;
      
      if (version !== requestVersion.current) return;
      if (res?.data && 'content' in res.data && Array.isArray(res.data.content)) {
        if (type === 'history') {
          const typedContent = (res.data as { content?: Order[] }).content || [];
          setPaginatedOrders(prev => page === 0 ? typedContent : [...prev, ...typedContent]);
          setHasMoreOrders(!res.data.last);
          setCurrentPageOrders(page);
        }
      } else {
        throw new Error('Invalid order history response');
      }
    } catch (e: unknown) {
      if (version !== requestVersion.current) return;
      console.error(e);
      setFailedPage(page);
      showError('Failed to fetch orders');
    } finally {
      if (version === requestVersion.current && type === 'history') setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders(0, 'history');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
    {/* The motion inventory's pull to refresh for the customer's order history. It was built
        into CustomerOrderHistory.tsx, which no screen renders; this is the history they see. */}
    <PullToRefresh onRefresh={() => fetchOrders(0, 'history')} label="Pull down to reload your orders">
    <div className="space-y-4" data-testid="customer-history-state"
      data-state={isLoadingOrders ? 'loading' : failedPage !== null ? 'error' : paginatedOrders.length > 0 ? 'populated' : 'empty'}>
      {failedPage !== null && (
        <div role="alert" className="space-y-2 text-sm">
          <p>Couldn't load order history. Please try again.</p>
          <Button variant="outline" onClick={() => fetchOrders(failedPage, 'history')}>Try again</Button>
        </div>
      )}
      <ReceivedFeedbackPanel actorRole={RoleName.CUSTOMER} />
      {isLoadingOrders && paginatedOrders.length === 0 ? (
        <div className="text-center text-slate-500 text-sm py-8">Loading history...</div>
      ) : paginatedOrders.length === 0 && failedPage === null ? (
        <div className="text-center text-slate-500 text-sm py-8">No order history found.</div>
      ) : (
        paginatedOrders.map((order: Order) => (
          <div key={order.id} className="space-y-2">
            <button
              type="button"
              data-testid="customer-history-order"
              data-order-id={order.id}
              onClick={() => setTrackingOrder && setTrackingOrder(order)}
              className="cursor-pointer text-left w-full"
            >
              <Surface radius="xl" elevation={1} interactive className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 font-mono block">{order.id.substring(0, 8)}</span>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-[#f0ede6]">{order.restaurantName}</h5>
                    {/* When it was placed (HISTORY-03): a history row said what and how much, never when. */}
                    {placedAt(order.createdAt) && (
                      <time dateTime={order.createdAt} className="block text-[11px] text-slate-500 dark:text-slate-300">
                        {placedAt(order.createdAt)}
                      </time>
                    )}
                  </div>
                  <Badge variant="primary">
                    {getFriendlyStatusMessage(order.status, order.deliveryStatus)}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mb-3">
                  <div className="mb-1 font-semibold">{order.items?.length || 0} items • {formatINR(order.totalAmount || (order as {totalAmount?:number}).totalAmount || 0)}</div>
                  {order.items && order.items.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                      {order.items.map((it: unknown, idx: number) => {
                        const item = it as { quantity?: number, item?: { name?: string }, name?: string };
                        return <li key={idx}>{item.quantity || 1}x {item.item?.name || item.name || 'Item'}</li>
                      })}
                    </ul>
                  )}
                </div>
              </Surface>
            </button>
            {order.deliveryStatus === 'DELIVERED' && (
              <OrderReviewAction orderId={order.id} actorRole={RoleName.CUSTOMER} presentation="compact" />
            )}
          </div>
        ))
      )}
      {hasMoreOrders && !isLoadingOrders && failedPage === null && (
        <Button
          onClick={() => fetchOrders(currentPageOrders + 1, 'history')}
          variant="outline"
          fullWidth
        >
          Load More History
        </Button>
      )}
    </div>
    </PullToRefresh>
    </>
  );
}
