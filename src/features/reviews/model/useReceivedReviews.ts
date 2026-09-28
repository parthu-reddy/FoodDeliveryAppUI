import { reviewsApi } from '@/lib/zodiosClients';
import { parseApiError } from '@/lib/parseApiError';
import { useCallback, useEffect, useState } from 'react';
import { RoleName } from '@/types';
import type { ReviewReceived } from './types';

const PAGE_SIZE = 10;

interface Loaded {
  key: string;
  page: number;
  reviews: ReviewReceived[];
  totalPages: number;
  error: string | null;
}

/** Private feedback addressed to the signed-in participant. */
export function useReceivedReviews(actorRole: RoleName, outletId?: string) {
  const [page, setPage] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${actorRole}:${outletId ?? ''}:${reloadToken}`;

  const refetch = useCallback(() => {
    setPage(0);
    setReloadToken((current) => current + 1);
  }, []);
  const loadMore = useCallback(() => setPage((current) => current + 1), []);

  useEffect(() => {
    let ignore = false;
    reviewsApi.review
      .getReceivedReviews({
        queries: {
          actorRole,
          ...(outletId ? { outletId } : {}),
          page,
          size: PAGE_SIZE,
        },
      })
      .then((response) => {
        if (ignore) return;
        const content = response.data?.content ?? [];
        const totalPages = response.data?.page?.totalPages ?? 1;
        setLoaded((previous) => {
          if (page === 0 || previous?.key !== key) {
            return { key, page, reviews: content, totalPages, error: null };
          }
          return {
            ...previous,
            page,
            reviews: [...previous.reviews, ...content],
            totalPages,
            error: null,
          };
        });
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setLoaded((previous) => ({
          key,
          page,
          reviews: previous?.key === key ? previous.reviews : [],
          totalPages: previous?.key === key ? previous.totalPages : 1,
          error: parseApiError(error, 'Could not load private feedback.').message,
        }));
      });

    return () => {
      ignore = true;
    };
  }, [actorRole, outletId, page, key]);

  const current = loaded;
  const matches = current?.key === key;
  return {
    reviews: matches ? current.reviews : [],
    isLoading: !matches || current.page !== page,
    isLoadingMore: matches && current.page !== page,
    error: matches ? current.error : null,
    hasMore: matches && current.page + 1 < current.totalPages,
    loadMore,
    refetch,
  };
}
