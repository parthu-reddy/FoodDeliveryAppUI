import { AlertBanner, EmptyState, Spinner } from '@shared/ui';
import { Bike, Star, Store, UtensilsCrossed } from 'lucide-react';
import { StarRating } from './StarRating';
import { shortDate } from '../model/reviewCopy';
import { useMyReviews } from '../model/useMyReviews';
import type { ReviewEntityType } from '../model/types';

interface MyReviewsListProps {
  enabled?: boolean;
  className?: string;
}

const TYPE_LABEL: Record<ReviewEntityType, string> = {
  RESTAURANT: 'Restaurant',
  DRIVER: 'Delivery partner',
  PRODUCT: 'Dish',
};

function icon(entityType: ReviewEntityType) {
  if (entityType === 'RESTAURANT') return <Store className="h-3.5 w-3.5" />;
  if (entityType === 'DRIVER') return <Bike className="h-3.5 w-3.5" />;
  return <UtensilsCrossed className="h-3.5 w-3.5" />;
}

/**
 * Everything this customer has written, newest first.
 *
 * Exists because reviews are immutable. Somebody who cannot edit what they said should at least be
 * able to see it — otherwise a rating they left in error is both permanent and invisible to them,
 * which is the worst of both. This is also the only screen that shows a customer their own driver
 * ratings: those are redacted everywhere else, but the author is entitled to their own words.
 */
export function MyReviewsList({ enabled = true, className = '' }: MyReviewsListProps) {
  const { reviews, isLoading, error } = useMyReviews(enabled);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="You haven't reviewed anything yet"
        description="After an order is delivered you can rate the restaurant, the delivery partner and the dishes."
        icon={<Star className="h-10 w-10" />}
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-2xl border border-white/40 bg-white/20 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-black/10"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {icon(review.entityType)}
              {TYPE_LABEL[review.entityType]}
            </span>
            <time
              dateTime={review.createdAt}
              className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500"
            >
              {shortDate(review.createdAt)}
            </time>
          </div>

          <StarRating value={review.rating} size="sm" className="mt-2" />

          {review.comment?.trim() && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {review.comment}
            </p>
          )}

          <p className="mt-2 font-mono text-[10px] text-slate-400 dark:text-slate-500">
            Order #{review.orderId.substring(0, 8)}
          </p>
        </article>
      ))}

      <p className="pt-1 text-center text-[10px] text-slate-400 dark:text-slate-500">
        Reviews can&apos;t be changed once submitted.
      </p>
    </div>
  );
}

export default MyReviewsList;
