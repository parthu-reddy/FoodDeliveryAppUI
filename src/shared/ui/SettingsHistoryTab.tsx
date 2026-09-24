/* eslint-disable react-hooks/set-state-in-effect */
import { customerApi } from '@/lib/zodiosClients';
import { useToast } from '@/contexts/ToastContext';
// the same Order the settings view uses: `@/types` is a wider shape and the two
// are not assignable in either direction
import type { Order } from '../../schemas/order';
import { formatINR } from '@shared/money';
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { placedAt } from '@features/customer-orders/model/placedAt';
import { Badge } from './Badge';
import { Button } from './action/Button';
import { Surface } from './surface/Surface';
import { useEffect, useState } from 'react';

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
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const fetchOrders = async (page: number, type: 'history') => {
    try {
      if (type === 'history') setIsLoadingOrders(true);
      
      let rawRes: unknown;
      if (type === 'history') {
         rawRes = await customerApi.order.get('/api/v1/orders/history', { queries: { page } });
      } else {
         throw new Error(`Unsupported order type: ${type}`);
      }
      
      const res = rawRes as {data?: {content?: Order[], last?: boolean}} | {data?: Order[]} | undefined;
      
      if (res?.data && 'content' in res.data) {
        if (type === 'history') {
          const typedContent = (res.data as { content?: Order[] }).content || [];
          setPaginatedOrders(prev => page === 0 ? typedContent : [...prev, ...typedContent]);
          setHasMoreOrders(!res.data.last);
          setCurrentPageOrders(page);
        }
      }
    } catch (e: unknown) {
      console.error(e);
      showError('Failed to fetch orders');
    } finally {
      if (type === 'history') setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders(0, 'history');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {isLoadingOrders && paginatedOrders.length === 0 ? (
        <div className="text-center text-slate-500 text-sm py-8">Loading history...</div>
      ) : paginatedOrders.length === 0 ? (
        <div className="text-center text-slate-500 text-sm py-8">No order history found.</div>
      ) : (
        paginatedOrders.map((order: Order) => (
          <button type="button"
            key={order.id}
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
            {/* Buttons removed for simplified history view */}
           </Surface>
          </button>
        ))
      )}
      {hasMoreOrders && !isLoadingOrders && (
        <Button
          onClick={() => fetchOrders(currentPageOrders + 1, 'history')}
          variant="outline"
          fullWidth
        >
          Load More History
        </Button>
      )}
    </div>
  );
}
