import { MenuItem } from '@/types';
import { StockToggleRow } from './StockToggleRow';
import { isDishAvailable } from '../../model/dishAvailability';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React from 'react';

interface RestaurantMenuTogglesViewProps {
  menuList: MenuItem[];
  stockStatus: Record<string, boolean>;
  toggleStock: (dishId: string, currentStatus: boolean) => void;
  selectedOutletId: string;
}

export const RestaurantMenuTogglesView: React.FC<RestaurantMenuTogglesViewProps> = ({
  menuList,
  stockStatus,
  toggleStock,
  selectedOutletId
}) => {
  const categories = menuList.reduce((acc, dish) => {
    const cat = dish.categoryName || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const presets = useMotionPresets();
  return (
    <motion.div
      key="menu-panel" {...presets.rise}
      className="p-5 space-y-4"
    >
      <div className="space-y-1">
        <h2 className="font-extrabold text-lg tracking-tight text-ink">Today&rsquo;s menu</h2>
        <p className="text-xs text-ink-2">
          Switch a dish off and customers stop seeing it as orderable straight away.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(categories).map(([category, dishes]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-extrabold text-sm text-ink uppercase tracking-widest">
              {category}
            </h3>
            <div className="space-y-3">
              {(dishes as MenuItem[]).map(dish => {
                const available = isDishAvailable(stockStatus, selectedOutletId, dish);
                return (
                  <StockToggleRow key={dish.id} dish={dish} available={available} onToggle={() => toggleStock(dish.id as string, available)} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
