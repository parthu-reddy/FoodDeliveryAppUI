import { reviewsApi } from '@/lib/zodiosClients';
import { logger } from '@/lib/logger';
import { useEffect, useMemo, useState } from 'react';
import { toAverage, type ReviewAggregate, type ReviewEntityType } from './types';

/** Mirrors ReviewQueryService.MAX_BATCH_IDS; the server rejects anything larger with 400. */
const MAX_BATCH_IDS = 100;

export interface AggregateSummary {
  average: number;
  totalReviews: number;
}

interface UseEntityAggregates {
  /** Keyed by entity id. Ids with no reviews are present with `totalReviews: 0`. */
  aggregates: Record<string, AggregateSummary>;
  isLoading: boolean;
}

const NONE: Record<string, AggregateSummary> = {};

/**
 * Ratings for a page of entities in one request.
 *
 * A menu renders dozens of dishes. Asking per dish would be dozens of round trips before the first
 * star appears, which is the whole reason `GET /api/v1/reviews/aggregates` exists.
 *
 * `DRIVER` is deliberately unsupported: the server refuses it outright, because a batch
 * driver-rating lookup is the cheapest way to enumerate the fleet's performance. The type signature
 * says so rather than letting a caller discover it as a 400.
 *
 * A failure here resolves to an empty map rather than an error state. A missing rating on a dish is
 * a cosmetic absence — the dish is still orderable, and blocking the menu on the review service
 * would make browsing depend on something it does not need. It is logged, not swallowed silently.
 */
export function useEntityAggregates(
  entityType: Exclude<ReviewEntityType, 'DRIVER'>,
  entityIds: string[],
  enabled = true,
): UseEntityAggregates {
  const [loaded, setLoaded] = useState<{ key: string; aggregates: Record<string, AggregateSummary> } | null>(null);

  // A stable string, not the array, is what everything downstream depends on. `entityIds` is a
  // fresh array identity on every render of the calling component, so an effect keyed on it refetched
  // the whole menu's ratings on every re-render. Caught by `does not refetch when only the id order
  // changes`.
  const idsKey = Array.from(new Set(entityIds.filter(Boolean)))
    .sort()
    .slice(0, MAX_BATCH_IDS)
    .join(',');
  const ids = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey]);
  const key = `${entityType}:${idsKey}`;
  const active = enabled && ids.length > 0;

  useEffect(() => {
    if (!active) return;

    let ignore = false;
    reviewsApi.review
      .get('/api/v1/reviews/aggregates', { queries: { entityType, entityIds: ids } })
      .then((res) => {
        if (ignore) return;
        const body = res as unknown as { data?: { aggregates?: ReviewAggregate[] } };
        const map: Record<string, AggregateSummary> = {};
        for (const a of body?.data?.aggregates ?? []) {
          map[a.entityId] = {
            average: toAverage(a.averageRating),
            totalReviews: Number(a.totalReviews) || 0,
          };
        }
        setLoaded({ key, aggregates: map });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        logger.warn('Could not load batch review aggregates', { entityType, count: ids.length, err });
        setLoaded({ key, aggregates: {} });
      });

    return () => {
      ignore = true;
    };
  }, [entityType, ids, key, active]);

  if (!active) return { aggregates: NONE, isLoading: false };
  if (loaded?.key !== key) return { aggregates: NONE, isLoading: true };
  return { aggregates: loaded.aggregates, isLoading: false };
}
