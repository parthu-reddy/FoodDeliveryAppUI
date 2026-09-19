import { StarRating } from './StarRating';

/**
 * Stars, the average and the count, on one line.
 *
 * The customer menu and the restaurant's dish-ratings panel had each written this out — same
 * stars, same `toFixed(1)`, same parenthesised total, different markup. It is one component.
 *
 * With no `emptyLabel` an unrated thing renders nothing at all, which is deliberate: "0.0"
 * beside five empty stars reads as a bad dish rather than a new one.
 */

interface InlineRatingProps {
  average: number;
  total: number;
  /** What is being rated, for assistive technology. */
  label?: string;
  /** Shown when nothing has been rated yet. Omit to render nothing. */
  emptyLabel?: string;
  className?: string;
}

export function InlineRating({
  average,
  total,
  label,
  emptyLabel,
  className = '',
}: InlineRatingProps) {
  if (total === 0) {
    return emptyLabel ? (
      <span className={`text-[10px] font-medium ${className}`} style={{ color: 'var(--color-ink-3)' }}>
        {emptyLabel}
      </span>
    ) : null;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <StarRating value={average} size="sm" label={label} />
      <span
        className="text-[11px] font-semibold tabular-nums"
        style={{ color: 'var(--color-ink-2)' }}
      >
        {average.toFixed(1)}
        <span className="font-normal"> ({total})</span>
      </span>
    </span>
  );
}
