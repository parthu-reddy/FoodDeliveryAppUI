import { Button } from '@shared/ui';
import { ChevronDown, Star } from 'lucide-react';
import { toAverage, useEntityAggregate } from '@features/reviews';

interface RestaurantReviewButtonProps {
  outletId: string;
  expanded: boolean;
  onToggle: () => void;
}

export function RestaurantReviewButton({ outletId, expanded, onToggle }: RestaurantReviewButtonProps) {
  const { aggregate, isLoading, error } = useEntityAggregate('RESTAURANT', outletId, Boolean(outletId));
  const count = aggregate?.totalReviews ?? 0;
  const text = error ? 'Rating unavailable' : isLoading ? 'Loading…'
    : count > 0 ? `${toAverage(aggregate?.averageRating).toFixed(1)} (${count.toLocaleString()})` : 'New';
  const label = error ? 'Restaurant rating unavailable. Open restaurant reviews.'
    : isLoading ? 'Loading restaurant rating. Open restaurant reviews.'
    : count > 0 ? `View restaurant reviews. ${text} from ${count} review${count === 1 ? '' : 's'}.`
    : 'View restaurant reviews. No ratings yet.';

  return (
    <Button size="sm" variant="secondary" aria-expanded={expanded} aria-label={label}
      title={error ?? undefined} onClick={onToggle}
      icon={<Star className="w-3.5 h-3.5 fill-current" />}
      iconRight={<ChevronDown className={`w-3 h-3 ${expanded ? 'rotate-180' : ''}`} />}>
      {text}
    </Button>
  );
}
