import { Surface, Switch } from '@shared/ui';
import type { MenuItem } from '@/types';
import ImageLoader from '@shared/ui/ImageLoader';
import { formatINR } from '@shared/money';
import { VegMarker } from '../VegMarker';

/**
 * One dish and its in-stock switch -- "86 it" in one tap. Shared by the Menu tab and the
 * orders screen's quick rail (`Restaurant.dc.html`), so the two cannot disagree about what a
 * dish's availability is or how it is changed.
 */

interface StockToggleRowProps {
  dish: MenuItem;
  available: boolean;
  onToggle: () => void;
  /** The quick rail: no photo, no card, a single dense line. */
  compact?: boolean;
}

export function StockToggleRow({ dish, available, onToggle, compact = false }: StockToggleRowProps) {
  const toggle = (
    <Switch checked={available} onChange={onToggle} label={`${dish.name} available`} className="p-1">
      {!compact && (
        <span className="font-bold text-xs font-mono" style={{ color: available ? 'var(--color-success)' : 'var(--color-ink-3)' }}>
          {available ? 'ACTIVE' : 'PAUSED'}
        </span>
      )}
    </Switch>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 py-2">
        <VegMarker item={dish} />
        <span className="flex-1 min-w-0">
          <span className={`block truncate text-[13px] font-bold ${available ? 'text-ink' : 'text-ink-3 line-through'}`}>{dish.name}</span>
          <span className="block font-mono text-[11px] text-ink-2">{formatINR(Number(dish.price ?? 0))}</span>
        </span>
        {toggle}
      </div>
    );
  }

  return (
    <Surface radius="lg" elevation={1} className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
          <ImageLoader src={dish.imageUrl || ''} alt={dish.name} className="w-full h-full object-cover" containerClassName="w-full h-full" referrerPolicy="no-referrer" loading="lazy" />
        </div>
        <div className="min-w-0">
          <h5 className="font-bold text-sm text-ink truncate">{dish.name}</h5>
          <span className="text-xs font-mono text-ink-2">{formatINR(Number(dish.price ?? 0))}</span>
        </div>
      </div>
      {toggle}
    </Surface>
  );
}
