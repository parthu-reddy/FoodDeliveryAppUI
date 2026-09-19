import { Button, EmptyState, Spinner, Surface } from '@shared/ui';
import { MessageSquare } from 'lucide-react';
import { StarRating } from './StarRating';
import { authorLabel, shortDate } from '../model/reviewCopy';
import type { Review } from '../model/types';

interface ReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/**
 * A page of reviews.
 *
 * The author is whatever the server chose to send. Driver reviews arrive with
 * `authorDisplayName: null` and render as "A customer" — that redaction is decided server-side by
 * `ReviewMapper`, and this component neither reverses it nor depends on it being applied.
 */
export function ReviewList({
  reviews,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  emptyTitle = 'No reviews yet',
  emptyDescription = 'Be the first to leave one after your next order.',
  className = '',
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<MessageSquare className="h-10 w-10" />}
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {reviews.map((review) => (
        <Surface
          as="article"
          key={review.id}
          radius="lg"
          elevation={1}
          className="p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-white">
                {authorLabel(review.authorDisplayName)}
              </p>
              <StarRating value={review.rating} size="sm" className="mt-1" />
            </div>
            <time
              dateTime={review.createdAt}
              className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500"
            >
              {shortDate(review.createdAt)}
            </time>
          </div>

          {review.comment?.trim() && (
            <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {review.comment}
            </p>
          )}
        </Surface>
      ))}

      {hasMore && onLoadMore && (
        <Button variant="secondary" fullWidth loading={isLoadingMore} onClick={onLoadMore}>
          Show more reviews
        </Button>
      )}
    </div>
  );
}

export default ReviewList;
