import React from 'react';
import { Store } from 'lucide-react';
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';

interface RestaurantBrandSelectorProps {
  myRestaurantName: string;
  hasOutlets: boolean;
  selectedOutletId: string;
  setSelectedOutletId: (id: string) => void;
  outlets: any[];
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
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-[#f0ede6] focus:outline-none"
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isCurrentOutletAcceptingOrders ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-[9px] font-bold font-mono ${isCurrentOutletAcceptingOrders ? 'text-emerald-400' : 'text-red-400'}`}>
              {hasOutlets ? (isCurrentOutletAcceptingOrders ? 'ACCEPTING LIVE ORDERS' : 'STORE OFFLINE') : 'SETUP REQUIRED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
