import { Surface, Switch } from '@shared/ui';
import { MenuItem } from '@/types';
import ImageLoader from '@shared/ui/ImageLoader';
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
        <h4 className="font-bold text-lg">In-Stock Dish Toggles</h4>
        <p className="text-xs text-slate-400 dark:text-slate-300">
          Instantly toggle dishes to "Out of Stock" to lock them in customer views.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(categories).map(([category, dishes]) => (
          <div key={category} className="space-y-3">
            <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-300 uppercase tracking-widest">
              {category}
            </h5>
            <div className="space-y-3">
              {(dishes as MenuItem[]).map(dish => {
                const available = stockStatus[`${selectedOutletId}_${dish.id}`] !== undefined 
                    ? stockStatus[`${selectedOutletId}_${dish.id}`] 
                    : dish.isAvailable !== false;
                return (
                  <Surface radius="lg" elevation={1} className="p-4 flex items-center justify-between" key={dish.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                        <ImageLoader 
                          src={dish.imageUrl || ''} 
                          alt={dish.name} 
                          className="w-full h-full object-cover" 
                          containerClassName="w-full h-full" 
                          referrerPolicy="no-referrer" 
                          loading="lazy" 
                        />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm">{dish.name}</h5>
                        <span className="text-xs text-amber-500 font-mono">₹{dish.price}</span>
                      </div>
                    </div>

                    <Switch
                      checked={available}
                      onChange={() => toggleStock(dish.id as string, available)}
                      label={`${dish.name} available`}
                      className="p-1"
                    >
                      <span
                        className="font-bold text-xs font-mono"
                        style={{ color: available ? 'var(--color-success)' : 'var(--color-ink-3)' }}
                      >
                        {available ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </Switch>
                  </Surface>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
