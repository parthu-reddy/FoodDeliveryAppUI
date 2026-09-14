import { reviewsApi } from '@/lib/zodiosClients';
import { parseApiError } from '@/lib/parseApiError';
import { useCallback, useEffect, useState } from 'react';
import type { ReviewEligibility } from './types';

interface UseOrderReviewEligibility {
  eligibility: ReviewEligibility | null;
  isLoading: boolean;
  /** A transport failure, not a refusal. A refusal arrives inside `eligibility`. */
  error: string | null;
  refetch: () => void;
}

interface Loaded {
  key: string;
  eligibility: ReviewEligibility | null;
  error: string | null;
}

/**
 * What this customer may still say about one order, and what they have already said.
 *
 * A refusal — cancelled order, closed window — is not an error here: the service returns it as
 * `reviewable: false` with a reason, so the sheet can explain it. `error` is reserved for the
 * request itself failing, which is the only case where retrying makes sense.
 *
 * Fetched lazily. Order history renders a page of orders at a time and most of them will never have
 * their rating sheet opened; asking for every one would be a page of requests nobody reads.
 *
 * State is written only from the response callback. `isLoading` is derived from "what I have is not
 * for the order being asked about", which also means reopening the sheet for a different order never
 * shows the previous order's targets for a frame.
 */
export function useOrderReviewEligibility(
  orderId: string | undefined,
  enabled: boolean,
): UseOrderReviewEligibility {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const active = enabled && Boolean(orderId);
  const key = `${orderId}:${reloadToken}`;

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!active) return;

    let ignore = false;
    reviewsApi.review
      .getEligibility({
        params: { orderId: orderId as string },
      })
      .then((res) => {
        if (ignore) return;
        const body = res as { data?: ReviewEligibility };
        setLoaded({ key, eligibility: body?.data ?? null, error: null });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        // Surfaced, not swallowed. A silently empty sheet is indistinguishable from "nothing to
        // review", which is what made 50 other call sites in this app render blank on failure.
        setLoaded({
          key,
          eligibility: null,
          error: parseApiError(err, 'Could not load review options for this order.').message,
        });
      });

    return () => {
      ignore = true;
    };
  }, [orderId, active, key]);

  if (!active) {
    return { eligibility: null, isLoading: false, error: null, refetch };
  }
  if (loaded?.key !== key) {
    return { eligibility: null, isLoading: true, error: null, refetch };
  }
  return { eligibility: loaded.eligibility, isLoading: false, error: loaded.error, refetch };
}
