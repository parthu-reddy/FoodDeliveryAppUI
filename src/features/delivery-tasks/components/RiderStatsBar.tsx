import { Check, DollarSign } from 'lucide-react';
import React from 'react';
import { formatINR } from '@shared/money';
import { Surface } from '@shared/ui';
import { DriverRatingCard } from '@features/reviews';

/**
 * What the rider has earned today, and how many trips it took.
 *
 * Earnings are visible without navigating anywhere, which is the point: a rider checking
 * their take should not have to leave the job screen to do it.
 */

interface RiderStatsBarProps {
  todayEarnings: number;
  todayCompletedCount: number;
  deliveryExecutiveId: string;
  historyOpen: boolean;
  onOpenHistory: () => void;
}

export function RiderStatsBar({
  todayEarnings,
  todayCompletedCount,
  deliveryExecutiveId,
  historyOpen,
  onOpenHistory,
}: RiderStatsBarProps) {
  return (
    <div className="p-5 grid grid-cols-2 gap-4 shrink-0">
      <Surface radius="lg" elevation={2} className="p-4 flex items-center gap-3">
        <span
          className="p-2.5 rounded-xl"
          style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}
        >
          <DollarSign className="w-5 h-5" aria-hidden="true" />
        </span>
        <span>
          <span
            className="text-[10px] uppercase font-mono block"
            style={{ color: 'var(--color-ink-2)' }}
          >
            Today&rsquo;s Earnings
          </span>
          <span className="text-base font-black" style={{ color: 'var(--color-ink)' }}>
            {formatINR(todayEarnings)}
          </span>
        </span>
      </Surface>

      <button
        onClick={onOpenHistory}
        aria-pressed={historyOpen}
        className="text-left rounded-xl"
        style={{ minHeight: 48 }}
      >
        <Surface
          radius="lg"
          elevation={2}
          interactive
          className="p-4 flex items-center gap-3 h-full"
          style={historyOpen ? { outline: '2px solid var(--color-action)' } : undefined}
        >
          <span
            className="p-2.5 rounded-xl"
            style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}
          >
            <Check className="w-5 h-5" aria-hidden="true" />
          </span>
          <span>
            <span
              className="text-[10px] uppercase font-mono block"
              style={{ color: 'var(--color-ink-2)' }}
            >
              Trips Completed
            </span>
            <span className="text-base font-black" style={{ color: 'var(--color-ink)' }}>
              {todayCompletedCount} orders
            </span>
          </span>
        </Surface>
      </button>

      {/* Spans both columns: the comments underneath need the width, and the rating is a
          standing figure rather than a today-only one like the two tiles above it. */}
      <DriverRatingCard driverId={deliveryExecutiveId} className="col-span-2" />
    </div>
  );
}
