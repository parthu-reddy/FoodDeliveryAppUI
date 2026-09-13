import { AlertBanner } from '@shared/ui';
import { RatingSummary } from './RatingSummary';
import { ReviewList } from './ReviewList';
import { useEntityReviews } from '../model/useEntityReviews';
import type { ReviewEntityType } from '../model/types';

interface ReviewsPanelProps {
  entityType: ReviewEntityType;
  entityId: string | undefined;
  title?: string;
  /** Hide the 5→1 breakdown where space is tight. */
  compactSummary?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/**
 * Summary plus list for one entity. The same panel serves all three roles — a customer reading a
 * restaurant's reviews, an owner reading their outlet's, a driver reading their own — because they
 * are looking at the same thing. What differs between them is what the server will return, and that
 * is `ReviewAccessPolicy`'s decision, not this component's.
 */
export function ReviewsPanel({
  entityType,
  entityId,
  title = 'Reviews',
  compactSummary = false,
  emptyTitle,
  emptyDescription,
  className = '',
}: ReviewsPanelProps) {
  const { aggregate, reviews, isLoading, isLoadingMore, hasMore, error, loadMore } =
    useEntityReviews(entityType, entityId, Boolean(entityId));

  return (
    <section className={className} aria-label={title}>
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </h3>

      {error && (
        <AlertBanner variant="error" className="mb-3">
          {error}
        </AlertBanner>
      )}

      <RatingSummary
        aggregate={aggregate}
        reviews={reviews}
        compact={compactSummary}
        className="mb-5"
      />

      <ReviewList
        reviews={reviews}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </section>
  );
}

export default ReviewsPanel;
