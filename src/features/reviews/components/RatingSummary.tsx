import { StarRating } from './StarRating';
import { toAverage, type Review, type ReviewAggregate } from '../model/types';

interface RatingSummaryProps {
  aggregate: ReviewAggregate | null;
  /** The loaded page of reviews, used for the distribution bars. */
  reviews?: Review[];
  /** Hide the 5→1 breakdown when there is no room for it. */
  compact?: boolean;
  className?: string;
}

const BUCKETS = [5, 4, 3, 2, 1];

/**
 * Average, count, and the shape of the ratings behind them.
 *
 * The distribution is computed from the reviews currently loaded, not from the whole history — and
 * it says so. A "4.2" made of straight fours reads very differently from one made of fives and
 * ones, and hiding that behind a single number is the thing star averages are most often criticised
 * for.
 */
export function RatingSummary({
  aggregate,
  reviews = [],
  compact = false,
  className = '',
}: RatingSummaryProps) {
  const average = toAverage(aggregate?.averageRating);
  const total = aggregate?.totalReviews ?? 0;

  if (total === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StarRating value={0} size="sm" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          No reviews yet
        </span>
      </div>
    );
  }

  const counts = BUCKETS.map((bucket) => reviews.filter((r) => Math.round(r.rating) === bucket).length);
  const loaded = counts.reduce((sum, n) => sum + n, 0);

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-[#f0ede6]">
          {average.toFixed(1)}
        </span>
        <div className="flex flex-col gap-0.5">
          <StarRating value={average} size="sm" />
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {total.toLocaleString()} review{total === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {!compact && loaded > 0 && (
        <div className="mt-3 space-y-1">
          {BUCKETS.map((bucket, i) => (
            <div key={bucket} className="flex items-center gap-2">
              <span className="w-3 text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
                {bucket}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${(counts[i] / loaded) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                {counts[i]}
              </span>
            </div>
          ))}
          {loaded < total && (
            // Said plainly rather than left to be inferred: the bars describe what is on screen.
            <p className="pt-1 text-[10px] text-slate-400 dark:text-slate-500">
              Breakdown of the {loaded} review{loaded === 1 ? '' : 's'} shown below.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default RatingSummary;
