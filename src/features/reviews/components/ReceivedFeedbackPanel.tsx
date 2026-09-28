import { AlertBanner, Button, EmptyState, Spinner, Surface } from '@shared/ui';
import { Lock, MessageSquare, RefreshCw } from 'lucide-react';
import { RoleName } from '@/types';
import { AUTHOR_ROLE_LABEL, shortDate } from '../model/reviewCopy';
import { useReceivedReviews } from '../model/useReceivedReviews';
import { StarRating } from './StarRating';

interface ReceivedFeedbackPanelProps {
  actorRole: RoleName;
  /** Required for the restaurant role because its review target is an outlet. */
  outletId?: string;
  className?: string;
}

function heading(role: RoleName) {
  if (role === RoleName.RESTAURANT) return 'Private delivery partner feedback';
  if (role === RoleName.DELIVERY) return 'Private feedback from order partners';
  return 'Private feedback from order partners';
}

/** A shared recipient view. The API deliberately omits reviewer and order identity. */
export function ReceivedFeedbackPanel({
  actorRole,
  outletId,
  className = '',
}: ReceivedFeedbackPanelProps) {
  const { reviews, isLoading, isLoadingMore, error, hasMore, loadMore, refetch } =
    useReceivedReviews(actorRole, outletId);

  return (
    <section className={className} aria-label={heading(actorRole)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Lock className="h-4 w-4" aria-hidden="true" />
          {heading(actorRole)}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Refresh private feedback"
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={refetch}
        >
          Refresh
        </Button>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Only participants who receive this feedback can read it. Reviewer names and order details are hidden.
      </p>

      {error && (
        <AlertBanner variant="error" className="mb-3">
          {error}
        </AlertBanner>
      )}

      {isLoading && reviews.length === 0 ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : reviews.length === 0 && !error ? (
        <EmptyState
          title="No private feedback yet"
          description="Feedback may arrive after an order is delivered."
          icon={<MessageSquare className="h-8 w-8" />}
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Surface key={review.id} as="article" radius="lg" elevation={1} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    From a {AUTHOR_ROLE_LABEL[review.authorRole].toLowerCase()}
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
              {review.comment?.trim() ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {review.comment}
                </p>
              ) : (
                <p className="mt-3 text-xs italic text-slate-400">No written comment.</p>
              )}
            </Surface>
          ))}
          {hasMore && (
            <Button variant="secondary" fullWidth loading={isLoadingMore} onClick={loadMore}>
              Show more feedback
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

export default ReceivedFeedbackPanel;
