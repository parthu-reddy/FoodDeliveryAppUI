import type { MenuItem, Outlet } from '@/types';
import { StockToggleRow } from './StockToggleRow';
import { isDishAvailable } from '../../model/dishAvailability';
import { PrepTimeStepper } from './PrepTimeStepper';

/**
 * The orders screen's right rail from `Restaurant.dc.html`: every dish with its switch, so
 * marking something sold out mid-service is one tap from the order board, not a trip into
 * the menu editor. Shown only on wide screens (2xl) where it does not squeeze the board; on a
 * tablet the Menu tab is the same switches, and the same prep-time stepper.
 */

interface QuickStockRailProps {
  menuList: MenuItem[];
  stockStatus: Record<string, boolean>;
  toggleStock: (dishId: string, currentStatus: boolean) => void;
  selectedOutletId: string;
  outlet?: Outlet;
  onPrepSaved?: () => void;
}

export function QuickStockRail({ menuList, stockStatus, toggleStock, selectedOutletId, outlet, onPrepSaved }: QuickStockRailProps) {
  if (menuList.length === 0) return null;
  return (
    <aside aria-label="Today's menu" className="hidden 2xl:block w-[322px] shrink-0 self-start sticky top-0 px-4 py-3 rounded-2xl border border-paper-line">
      <h2 className="font-mono text-[10px] font-bold tracking-wider text-ink-2">TODAY&rsquo;S MENU</h2>
      <p className="text-[11px] text-ink-3 mb-1">One tap to mark a dish sold out</p>
      <div className="divide-y divide-[var(--color-paper-line)]">
        {menuList.map((dish) => {
          const available = isDishAvailable(stockStatus, selectedOutletId, dish);
          return (
            <StockToggleRow key={dish.id} compact dish={dish} available={available} onToggle={() => toggleStock(dish.id as string, available)} />
          );
        })}
      </div>
      <PrepTimeStepper outlet={outlet} onSaved={onPrepSaved} />
    </aside>
  );
}
