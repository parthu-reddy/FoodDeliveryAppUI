import { customerApi } from '@/lib/zodiosClients';
import type { RefundView } from '@/types';
import { usePolling } from '@/hooks/usePolling';
import { useCallback, useState } from 'react';

const NONE: RefundView[] = [];
export const REFUND_REFRESH_MS = 15_000;
const READ_FAILED = 'Could not refresh refund details. Please retry.';

export interface OrderRefundResult {
  refunds: RefundView[];
  error: string | null;
  isLoading: boolean;
  retry: () => void;
}

const isPending = (refund: RefundView) => refund.status === 'REQUESTED' || refund.status === 'PROCESSING';

/**
 * The refunds raised against one ended order, read while its view is open. A refund still
 * REQUESTED/PROCESSING is re-read until it settles; once every refund has an outcome, or there
 * are none, polling stops. A failed read is reported, never shown as "no refunds", and keeps
 * retrying alongside the customer's Retry. Data is returned only for the order that produced it.
 */
export function useOrderRefunds(orderId: string | undefined, enabled: boolean): OrderRefundResult {
  const active = Boolean(orderId) && enabled;
  const fetchRefunds = useCallback(
    () => customerApi.customerMoney
      .get('/api/v1/money/customer/orders/:orderId/refunds', { params: { orderId: orderId as string } })
      .then(res => res ?? NONE),
    [orderId],
  );
  // The order whose last successful read had no refund left in flight; polling it is pointless.
  const [settledOrderId, setSettledOrderId] = useState<string | null>(null);
  const { data, dataRefreshKey, error, refetch } = usePolling<RefundView[]>({
    fetchFn: fetchRefunds,
    intervalMs: REFUND_REFRESH_MS,
    enabled: active && settledOrderId !== orderId,
    refreshKey: orderId ?? null,
    onData: refunds => setSettledOrderId(refunds.some(isPending) ? null : orderId ?? null),
  });

  if (!active) return { refunds: NONE, error: null, isLoading: false, retry: refetch };
  const current = dataRefreshKey === orderId && data !== null ? data : null;
  return {
    refunds: current ?? NONE,
    error: error ? READ_FAILED : null,
    isLoading: current === null && error === null,
    retry: refetch,
  };
}
