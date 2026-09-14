import { reviewsApi } from '@/lib/zodiosClients';
import { parseApiError } from '@/lib/parseApiError';
import { useEffect, useState } from 'react';
import type { ReviewAggregate, ReviewEntityType } from './types';

interface UseEntityAggregate {
  aggregate: ReviewAggregate | null;
  isLoading: boolean;
  error: string | null;
}

interface Loaded {
  key: string;
  aggregate: ReviewAggregate | null;
  error: string | null;
}

/**
 * Just the average and the count for one entity.
 *
 * Separate from `useEntityReviews` on purpose: that hook also pulls the first page of reviews, which
 * is right for a panel someone opened and wrong for a header badge on a page they are only browsing.
 * Using it for a badge would fetch ten reviews per restaurant visit that nobody reads, and then
 * fetch them a second time when the panel below actually opens.
 *
 * State is written only from the response callback, never synchronously in the effect body — loading
 * is derived from "the result on hand is not for the entity currently asked about". That is the same
 * shape `useOrderRefunds` uses, and it is why switching restaurants shows a spinner rather than the
 * previous restaurant's rating.
 */
export function useEntityAggregate(
  entityType: ReviewEntityType | undefined,
  entityId: string | undefined,
  enabled = true,
): UseEntityAggregate {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const active = enabled && Boolean(entityType) && Boolean(entityId);
  const key = `${entityType}:${entityId}`;

  useEffect(() => {
    if (!active) return;

    let ignore = false;
    reviewsApi.review
      .getAggregate({
        queries: { entityType: entityType as ReviewEntityType, entityId: entityId as string },
      })
      .then((res) => {
        if (ignore) return;
        const aggregate = (res.data ?? null) as ReviewAggregate | null;
        setLoaded({ key, aggregate, error: null });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setLoaded({
          key,
          aggregate: null,
          error: parseApiError(err, 'Could not load the rating.').message,
        });
      });

    return () => {
      ignore = true;
    };
  }, [entityType, entityId, active, key]);

  if (!active) {
    return { aggregate: null, isLoading: false, error: null };
  }
  if (loaded?.key !== key) {
    return { aggregate: null, isLoading: true, error: null };
  }
  return { aggregate: loaded.aggregate, isLoading: false, error: loaded.error };
}
