import { Surface } from '@shared/ui';
import { EmptyState } from '@shared/ui';
import { UtensilsCrossed } from 'lucide-react';
import { useMemo } from 'react';
import { InlineRating } from './InlineRating';
import { useEntityAggregates } from '../model/useEntityAggregates';

interface Dish {
  id?: string;
  name?: string;
}

interface DishRatingsPanelProps {
  dishes: Dish[];
  className?: string;
}

/**
 * How each dish is rated, worst first.
 *
 * Customers rate dishes and customers see dish ratings on the menu; until this existed the one
 * person who could act on "the biryani is at 2.1" — the kitchen — was the only one who could not see
 * it. Same batch request the customer menu uses, so a long menu is one call.
 *
 * Sorted ascending because the useful question is not "what is doing well" but "what should I look
 * at". Unrated dishes sort last: they are not bad, they are unknown.
 */
export function DishRatingsPanel({ dishes, className = '' }: DishRatingsPanelProps) {
  const ids = useMemo(
    () => dishes.map((d) => d.id).filter((id): id is string => Boolean(id)),
    [dishes],
  );
  const { aggregates, isLoading } = useEntityAggregates('PRODUCT', ids, ids.length > 0);

  const rows = useMemo(() => {
    const withRatings = dishes
      .filter((d) => d.id)
      .map((d) => ({
        id: d.id as string,
        name: d.name || 'Item',
        summary: aggregates[d.id as string],
      }));

    return withRatings.sort((a, b) => {
      const aRated = (a.summary?.totalReviews ?? 0) > 0;
      const bRated = (b.summary?.totalReviews ?? 0) > 0;
      if (aRated !== bRated) return aRated ? -1 : 1;
      if (!aRated) return a.name.localeCompare(b.name);
      return a.summary.average - b.summary.average;
    });
  }, [dishes, aggregates]);

  if (ids.length === 0) {
    return (
      <EmptyState
        title="No dishes yet"
        description="Once this outlet has a menu, how each dish is rated will show up here."
        icon={<UtensilsCrossed className="h-10 w-10" />}
      />
    );
  }

  const rated = rows.filter((r) => (r.summary?.totalReviews ?? 0) > 0).length;

  return (
    <section className={className} aria-label="Dish ratings">
      <h3 className="mb-1 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Dish ratings
      </h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        {isLoading
          ? 'Loading…'
          : `${rated} of ${rows.length} dishes rated. Lowest rated first.`}
      </p>

      <div className="space-y-1.5">
        {rows.map((row) => {
          const total = row.summary?.totalReviews ?? 0;
          return (
            <Surface radius="md" elevation={0} className="flex items-center justify-between gap-3 px-3 py-2" key={row.id}>
              <span className="min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-white">
                {row.name}
              </span>

              <InlineRating
                average={row.summary?.average ?? 0}
                total={total}
                label={row.name}
                emptyLabel="Not rated yet"
                className="shrink-0"
              />
            </Surface>
          );
        })}
      </div>
    </section>
  );
}

export default DishRatingsPanel;
