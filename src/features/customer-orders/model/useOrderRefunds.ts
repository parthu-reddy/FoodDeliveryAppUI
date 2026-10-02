import { customerApi } from '@/lib/zodiosClients';
import type { RefundView } from '@/types';
import { useCallback, useEffect, useState } from 'react';

const NONE: RefundView[] = [];
export const REFUND_REFRESH_MS = 15_000;
interface Loaded { orderId: string; refunds: RefundView[]; error: string | null }
export interface OrderRefundResult {
  refunds: RefundView[];
  error: string | null;
  isLoading: boolean;
  retry: () => void;
}

/** Reads actual refund state while the terminal order view is open. Failures are not empty refunds. */
export function useOrderRefunds(orderId: string | undefined, enabled: boolean): OrderRefundResult {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const retry = useCallback(() => setRetryVersion(value => value + 1), []);

  useEffect(() => {
    if (!orderId || !enabled) return;
    let ignore = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refreshRefunds = async () => {
      try {
        const res = await customerApi.customerMoney
          .get('/api/v1/money/customer/orders/:orderId/refunds', { params: { orderId } });
        if (!ignore) setLoaded({ orderId, refunds: res ?? NONE, error: null });
      } catch {
        if (!ignore) setLoaded(previous => ({ orderId,
          refunds: previous?.orderId === orderId ? previous.refunds : NONE,
          error: 'Could not refresh refund details. Please retry.',
        }));
      } finally {
        // Schedule after completion so slow requests cannot accumulate. Leaving/switching the
        // order invalidates in-flight results and cancels this view's timer.
        if (!ignore) timer = setTimeout(() => { void refreshRefunds(); }, REFUND_REFRESH_MS);
      }
    };
    void refreshRefunds();
    return () => { ignore = true; if (timer !== undefined) clearTimeout(timer); };
  }, [orderId, enabled, retryVersion]);

  if (!orderId || !enabled) return { refunds: NONE, error: null, isLoading: false, retry };
  if (loaded?.orderId !== orderId) return { refunds: NONE, error: null, isLoading: true, retry };
  return { refunds: loaded.refunds, error: loaded.error, isLoading: false, retry };
}
