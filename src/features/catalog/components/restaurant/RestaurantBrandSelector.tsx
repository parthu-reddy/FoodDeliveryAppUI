import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import { Store } from 'lucide-react';
import { Select } from '@shared/ui';

interface RestaurantBrandSelectorProps {
  myRestaurantName: string;
  hasOutlets: boolean;
  selectedOutletId: string;
  setSelectedOutletId: (id: string) => void;
  outlets: import('@/types').Outlet[];
  isCurrentOutletAcceptingOrders: boolean;
}

export function RestaurantBrandSelector({
  myRestaurantName,
  hasOutlets,
  selectedOutletId,
  setSelectedOutletId,
  outlets,
  isCurrentOutletAcceptingOrders
}: RestaurantBrandSelectorProps) {
  return (
    <div className="flex items-center gap-3.5 flex-wrap">
      <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs" subColorClass="text-rose-500 text-[8px]" />
      <div className="hidden sm:flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <Store className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-xs tracking-tight leading-none text-slate-900 dark:text-[#f0ede6]">{myRestaurantName}</h3>
            {hasOutlets && (
              <Select
                selectSize="sm"
                aria-label="Outlet"
                className="w-44"
                value={selectedOutletId}
                onChange={setSelectedOutletId}
                options={outlets
                  .filter((o): o is typeof o & { id: string } => Boolean(o.id))
                  .map((o) => ({ value: o.id, label: o.name ?? 'Unnamed outlet' }))}
              />
            )}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isCurrentOutletAcceptingOrders ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className={`text-[9px] font-bold font-mono ${isCurrentOutletAcceptingOrders ? 'text-amber-400' : 'text-rose-400'}`}>
              {hasOutlets ? (isCurrentOutletAcceptingOrders ? 'ACCEPTING LIVE ORDERS' : 'STORE OFFLINE') : 'SETUP REQUIRED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
