import { reviewsApi } from '@/lib/zodiosClients';
import { parseApiError } from '@/lib/parseApiError';
import { useCallback, useEffect, useState } from 'react';
import type { Review, ReviewAggregate, ReviewEntityType } from './types';

const PAGE_SIZE = 10;

interface UseEntityReviews {
  aggregate: ReviewAggregate | null;
  reviews: Review[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refetch: () => void;
}

interface Loaded {
  /** Identifies the entity and reload generation this data belongs to. */
  key: string;
  /** The highest page number already folded into `reviews`. */
  page: number;
  aggregate: ReviewAggregate | null;
  reviews: Review[];
  totalPages: number;
  error: string | null;
}

const EMPTY: Review[] = [];

/**
 * The aggregate and a growing list of reviews for one entity.
 *
 * The first request fetches both together, so the summary and the list appear at the same moment
 * rather than the header snapping from "no rating" to "4.3" a beat later. Later pages fetch the list
 * alone — the average does not change as the reader scrolls.
 *
 * A 403 here is a real answer, not a bug: `ReviewAccessPolicy` refuses driver ratings to anyone but
 * that driver and an admin. It surfaces as `error` so the caller can decide whether to show anything
 * at all.
 *
 * State is set only from the response callbacks. `isLoading` and `isLoadingMore` are derived by
 * comparing what has landed against what was asked for, which is what keeps a switch of entity from
 * briefly rendering the previous entity's reviews under the new entity's name.
 */
export function useEntityReviews(
  entityType: ReviewEntityType | undefined,
  entityId: string | undefined,
  enabled = true,
): UseEntityReviews {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [page, setPage] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const active = enabled && Boolean(entityType) && Boolean(entityId);
  const key = `${entityType}:${entityId}:${reloadToken}`;

  const refetch = useCallback(() => {
    setPage(0);
    setReloadToken((n) => n + 1);
  }, []);

  const loadMore = useCallback(() => setPage((p) => p + 1), []);

  useEffect(() => {
    if (!active) return;

    let ignore = false;
    const firstPage = page === 0;

    const listPromise = reviewsApi.review.getReviews({
      queries: {
        entityType: entityType as ReviewEntityType,
        entityId: entityId as string,
        page,
        size: PAGE_SIZE,
      },
    });
    const aggregatePromise = firstPage
      ? reviewsApi.review.getAggregate({
          queries: { entityType: entityType as ReviewEntityType, entityId: entityId as string },
        })
      : Promise.resolve(null);

    Promise.all([listPromise, aggregatePromise])
      .then(([listRes, aggRes]) => {
        if (ignore) return;

        const content = (listRes.data?.content ?? []) as Review[];
        const totalPages = listRes.data?.page?.totalPages ?? 1;
        const aggregate = aggRes
          ? ((aggRes.data ?? null) as ReviewAggregate | null)
          : null;

        setLoaded((prev) => {
          const sameRun = prev?.key === key;
          return {
            key,
            page,
            // Later pages append; a first page — including one after refetch — replaces.
            reviews: firstPage || !sameRun ? content : [...(prev?.reviews ?? EMPTY), ...content],
            aggregate: firstPage ? aggregate : (sameRun ? prev.aggregate : null),
            totalPages,
            error: null,
          };
        });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        const message = parseApiError(err, 'Could not load reviews.').message;
        setLoaded((prev) => ({
          key,
          page,
          reviews: prev?.key === key ? prev.reviews : EMPTY,
          aggregate: prev?.key === key ? prev.aggregate : null,
          totalPages: prev?.key === key ? prev.totalPages : 1,
          error: message,
        }));
      });

    return () => {
      ignore = true;
    };
  }, [entityType, entityId, page, active, key]);

  if (!active) {
    return {
      aggregate: null,
      reviews: EMPTY,
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      error: null,
      loadMore,
      refetch,
    };
  }

  const current = loaded?.key === key ? loaded : null;
  const settledOnThisPage = current?.page === page;

  return {
    aggregate: current?.aggregate ?? null,
    reviews: current?.reviews ?? EMPTY,
    isLoading: !current,
    isLoadingMore: Boolean(current) && !settledOnThisPage,
    hasMore: current ? current.page + 1 < current.totalPages : false,
    error: current?.error ?? null,
    loadMore,
    refetch,
  };
}
