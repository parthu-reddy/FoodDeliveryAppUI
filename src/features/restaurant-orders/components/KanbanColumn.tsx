import { Surface } from '@shared/ui';
import React from 'react';

/**
 * One column of the kitchen board.
 *
 * The six columns were six copies of the same 40 lines, differing in a title, a dot colour
 * and an empty state — and each one recomputed its `myOrders.filter(...)` three times, once
 * for the count, once for the emptiness test and once to render. The rows arrive here already
 * derived, so each filter runs once.
 *
 * The column is a scroll-snap card on a phone and a grid cell from `md:` up. The restaurant
 * role is tablet-landscape first (Phase4_RoleSurfaces/plan.md, "Responsive targets"), where
 * six columns side by side is the whole point of a kanban — a horizontally scrolling board on
 * a 1024px counter tablet is a phone layout that happens to be wide.
 */

export type ColumnTone = 'warning' | 'danger' | 'info' | 'success' | 'neutral';

const TONE: Record<ColumnTone, { ink: string; bg: string; line: string }> = {
  warning: { ink: 'var(--color-warning)', bg: 'var(--color-warning-bg)', line: 'var(--color-warning-line)' },
  danger: { ink: 'var(--color-danger)', bg: 'var(--color-danger-bg)', line: 'var(--color-danger-line)' },
  info: { ink: 'var(--color-info)', bg: 'var(--color-info-bg)', line: 'var(--color-info-line)' },
  success: { ink: 'var(--color-success)', bg: 'var(--color-success-bg)', line: 'var(--color-success-line)' },
  neutral: { ink: 'var(--color-ink-2)', bg: 'var(--color-paper-sunken)', line: 'var(--color-paper-line)' },
};

interface KanbanColumnProps {
  title: string;
  tone: ColumnTone;
  count: number;
  /** `ping` for a column that wants attention now; `pulse` for one that is merely working. */
  beat?: 'ping' | 'pulse';
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyHint: string;
  children: React.ReactNode;
}

export function KanbanColumn({
  title, tone, count, beat = 'pulse', emptyIcon, emptyTitle, emptyHint, children,
}: KanbanColumnProps) {
  const { ink, bg, line } = TONE[tone];

  return (
    <Surface
      as="section"
      aria-label={`${title}, ${count} order${count === 1 ? '' : 's'}`}
      elevation={2}
      radius="xl"
      className="w-[85%] xs:w-[310px] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex flex-col p-4 min-h-[480px]"
    >
      <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            // Written out, not `animate-${beat}`: Tailwind scans source text, and a class
            // assembled at runtime is a class it never generates.
            className={`w-2 h-2 rounded-full ${beat === 'ping' ? 'animate-ping' : 'animate-pulse'}`}
            style={{ background: ink }}
            aria-hidden="true"
          />
          <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">
            {title}
          </span>
        </div>
        <span
          className="text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full"
          style={{ color: ink, background: bg, border: `1px solid ${line}` }}
        >
          {count}
        </span>
      </div>

      <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
        {count === 0 ? (
          <Surface
            radius="lg"
            elevation={0}
            className="h-full flex flex-col items-center justify-center text-center py-16 px-4 duration-500 border-dashed"
          >
            <Surface radius="full" elevation={2} className="w-16 h-16 flex items-center justify-center mb-4" style={{ color: ink }}>
              {emptyIcon}
            </Surface>
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">{emptyTitle}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">{emptyHint}</p>
          </Surface>
        ) : (
          children
        )}
      </div>
    </Surface>
  );
}
