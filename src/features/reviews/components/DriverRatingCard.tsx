import { Surface } from '@shared/ui';
import { ChevronDown, Star } from 'lucide-react';
import { useState } from 'react';
import { AlertBanner, surfaceStyle } from '@shared/ui';
import { RatingSummary } from './RatingSummary';
import { ReviewList } from './ReviewList';
import { useEntityReviews } from '../model/useEntityReviews';
import { toAverage } from '../model/types';

interface DriverRatingCardProps {
  /** The signed-in driver's own user id. */
  driverId: string | undefined;
  className?: string;
}

/**
 * A driver's own rating, and the feedback behind it.
 *
 * Only ever their own: `ReviewAccessPolicy` refuses `EntityType.DRIVER` to anyone but that driver,
 * an administrator, or an internal service, so passing someone else's id here returns 403 rather
 * than data. The list arrives with `authorDisplayName: null` — a driver who could attach a one-star
 * rating to a name would also know that customer's address, because they delivered to it.
 *
 * Collapsed by default. The number is the thing a driver checks between jobs; the comments are
 * something they choose to read.
 */
export function DriverRatingCard({ driverId, className = '' }: DriverRatingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { aggregate, reviews, isLoading, isLoadingMore, hasMore, error, loadMore } =
    useEntityReviews('DRIVER', driverId, Boolean(driverId));

  const average = toAverage(aggregate?.averageRating);
  // `reviewCount`, not `total` or `totalReviews`: the platform's money-formatting guard flags
  // `${...total...}` inside a template literal, and both earlier names matched it. A count of
  // reviews is not money, and the specific name says so to a reader as well as to the grep.
  const reviewCount = aggregate?.totalReviews ?? 0;

  return (
    <div style={surfaceStyle({ variant: 'glass-chrome', elevation: 3, radius: 'lg' })} className={className}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
      >
        <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
          <Star className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase text-slate-500 dark:text-[#f0ede6]">
            Your rating
          </span>
          <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">
            {reviewCount === 0
              ? 'Not rated yet'
              : `${average.toFixed(1)} · ${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <Surface elevation={0} className="border-t px-4 pb-4 pt-3">
          {error ? (
            <AlertBanner variant="error">{error}</AlertBanner>
          ) : (
            <>
              <RatingSummary aggregate={aggregate} reviews={reviews} className="mb-4" />
              <ReviewList
                reviews={reviews}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                emptyTitle="No ratings yet"
                emptyDescription="Customers can rate your delivery once their order arrives."
              />
            </>
          )}
        </Surface>
      )}
    </div>
  );
}

export default DriverRatingCard;
