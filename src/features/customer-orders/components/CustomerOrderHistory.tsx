import { normalizeOrder } from '../../../schemas/order';
import { customerApi } from '@/lib/zodiosClients';
import { DeliveryStatus, Order, OrderStatus } from '@/types';
import { RateOrderModal } from '@features/reviews';
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { Button, EmptyState, Overlay, PullToRefresh, Spinner, Surface } from '@shared/ui';
import { AlertCircle, Clock, Package, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatINR } from '@shared/money';
import PostDeliverySupportModal from './PostDeliverySupportModal';
import { Star } from 'lucide-react';

interface CustomerOrderHistoryProps {
  onClose: () => void;
  onAddApiLog?: (log: unknown) => void;
}

export function CustomerOrderHistory({ onClose, onAddApiLog }: CustomerOrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingPage, setIsFetchingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrderIdForSupport, setSelectedOrderIdForSupport] = useState<string | null>(null);
  const [orderIdToRate, setOrderIdToRate] = useState<string | null>(null);
  // Bumped after a submission so the rate affordance re-reads eligibility and flips to "rated".
  const [reviewedAt, setReviewedAt] = useState<Record<string, number>>({});

  const handleSupportRequest = async (orderId: string, reason: string) => {
    await customerApi.customerOrder.post('/api/v1/customer/orders/:orderId/refund-request', { reason }, { params: { orderId } });
    await loadHistory();
    setSelectedOrderIdForSupport(null);
  };

  // A callable fetch, not an effect body: pull-to-refresh has to be able to await it so the
  // indicator stays until the data lands. The previous "force reload history" was
  // `setPage(p => p)`, which re-renders nothing and re-runs no effect — a refresh that never
  // refreshed.
  const loadHistory = useCallback(async () => {
    if (onAddApiLog) {
      onAddApiLog({ id: `fetch_history_${page}`, label: `GET /api/v1/orders/history?page=${page}&size=20`, method: 'GET' });
    }
    try {
      const res = await customerApi.order.getOrderHistory({ queries: { page } });
      if (res.data) {
        const content = res.data.content ?? [];
        // Normalise rather than cast. The API sends `total` but no `total`, `subtotal` or
        // `customerName`, and this view reads all three -- assigning the raw response left them
        // undefined. That was invisible while Order resolved to `any`.
        setOrders(content.map(normalizeOrder));
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch order history", err);
      setError("Failed to load past orders.");
    } finally {
      setIsLoading(false);
      setIsFetchingPage(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > 0) setIsFetchingPage(true);
    loadHistory();
  }, [page, loadHistory]);

  return (
    <Overlay open onClose={onClose} label="Order history" className="w-full max-w-2xl">
      <div className="w-full overflow-hidden flex flex-col max-h-[85vh]">
      <Surface variant="glass-overlay" elevation={4} radius="xl" className="flex flex-col overflow-hidden h-full">
        <Surface elevation={0} className="p-4 sm:p-6 border-b flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" />
              Order History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your past orders and refunds</p>
          </div>
          <Button variant="secondary" size="icon" aria-label="Close order history" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </Surface>

        <PullToRefresh
          onRefresh={loadHistory}
          label="Pull down to reload your orders"
          className="flex-1 p-4 sm:p-6 space-y-4"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" color="var(--color-action)" />
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Loading your history...</p>
            </div>
          ) : error ? (
            <div
              className="p-6 rounded-2xl flex flex-col items-center text-center"
              style={{
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger-line)',
              }}
            >
              <AlertCircle className="w-10 h-10 mb-2" />
              <h3 className="font-bold">Oops!</h3>
              <p className="text-sm">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState 
              title="No Past Orders"
              description="When you complete or cancel an order, it will appear here."
              icon={<Package className="w-12 h-12" />}
            />
          ) : (
            orders.map(order => (
              <Surface radius="lg" elevation={1} className="p-4 flex flex-col gap-3 hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors" key={order.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{order.restaurantName}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                      {new Date(order.createdAt || '').toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-800 dark:text-white text-lg block">
                      {formatINR(order.totalAmount || 0)}
                    </span>
                  </div>
                </div>

                <Surface radius="md" elevation={0} className="text-sm text-slate-700 dark:text-slate-300 p-3">
                  { }
                  { }
                  {order.items?.map((item: import('@/types').OrderItem, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{item.quantity || 1}x</span>
                      <span className="truncate">{item.item?.name || item.name || 'Item'}</span>
                    </div>
                  ))}
                </Surface>

                <Surface elevation={0} className="flex items-center justify-between pt-2 border-t mt-1">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                    order.status === OrderStatus.CANCELLED || order.status === OrderStatus.CANCELLED_BY_RESTAURANT 
                      ? 'bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-500/20'
                      : 'bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/20'
                  }`}>
                    {getFriendlyStatusMessage(order.status, order.deliveryStatus)}
                  </span>
                  
                  <div className="ml-auto flex items-center gap-2">
                    {/* Delivered, from deliveryStatus -- OrderStatus has no DELIVERED value, and
                        HANDED_OVER only means the rider has the food. This mirrors the server's
                        own eligibility gate, so the button is never offered for something the
                        API will refuse. */}
                    {order.deliveryStatus === DeliveryStatus.DELIVERED && (
                      <button
                        key={reviewedAt[order.id as string] ?? 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderIdToRate(order.id as string);
                        }}
                        className="flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                      >
                        <Star className="w-3 h-3" />
                        Rate this order
                      </button>
                    )}

                    {/* Same gate as the rate button, and for the same reason.
                        CustomerOrderController.requestPostDeliveryRefund rejects anything whose
                        deliveryStatus is not DELIVERED with a 400 -- so keying this on
                        HANDED_OVER offered a post-delivery refund while the rider still had the
                        food, and the customer got "Refund requests can only be made for delivered
                        orders through this channel." */}
                    {order.deliveryStatus === DeliveryStatus.DELIVERED && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderIdForSupport(order.id);
                        }}
                        className="text-[10px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2 py-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                      >
                        Report Issue / Request Refund
                      </button>
                    )}
                  </div>
                </Surface>
              </Surface>
            ))
          )}
          
          {!isLoading && !error && orders.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || isFetchingPage}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isFetchingPage}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </PullToRefresh>
      </Surface>
      </div>
      
      {selectedOrderIdForSupport && (
        <PostDeliverySupportModal
          isOpen={!!selectedOrderIdForSupport}
          onClose={() => setSelectedOrderIdForSupport(null)}
          orderId={selectedOrderIdForSupport}
          submitSupportRequest={handleSupportRequest}
        />
      )}

      {orderIdToRate && (
        <RateOrderModal
          isOpen={!!orderIdToRate}
          onClose={() => setOrderIdToRate(null)}
          orderId={orderIdToRate}
          onSubmitted={() => setReviewedAt(prev => ({ ...prev, [orderIdToRate]: Date.now() }))}
        />
      )}
    </Overlay>
  );
}
