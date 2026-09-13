import { reviewsApi } from '@/lib/zodiosClients';
import { parseApiError } from '@/lib/parseApiError';
import { useEffect, useState } from 'react';
import type { ReviewDetail } from './types';

const PAGE_SIZE = 20;

interface UseMyReviews {
  reviews: ReviewDetail[];
  isLoading: boolean;
  error: string | null;
}

interface Loaded {
  reviews: ReviewDetail[];
  error: string | null;
}

/**
 * Everything the signed-in user has written, newest first.
 *
 * Unredacted, because they are their own author: the order each review belongs to is included, so
 * "you rated Bombay Canteen ★★★★☆" can be traced back to the meal it was about.
 */
export function useMyReviews(enabled = true): UseMyReviews {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let ignore = false;
    reviewsApi.review
      .get('/api/v1/reviews/me', { queries: { page: 0, size: PAGE_SIZE } })
      .then((res) => {
        if (ignore) return;
        const body = res as unknown as { data?: { content?: ReviewDetail[] } };
        setLoaded({ reviews: body?.data?.content ?? [], error: null });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setLoaded({
          reviews: [],
          error: parseApiError(err, 'Could not load your reviews.').message,
        });
      });

    return () => {
      ignore = true;
    };
  }, [enabled]);

  if (!enabled) {
    return { reviews: [], isLoading: false, error: null };
  }
  if (!loaded) {
    return { reviews: [], isLoading: true, error: null };
  }
  return { reviews: loaded.reviews, isLoading: false, error: loaded.error };
}
