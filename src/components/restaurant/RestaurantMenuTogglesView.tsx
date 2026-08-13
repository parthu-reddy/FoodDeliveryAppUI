import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { MenuItem } from '../../types';
import ImageLoader from '../shared/ImageLoader';
import { motion } from 'motion/react';

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
    const cat = dish.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <motion.div
      key="menu-panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
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
                  <div 
                    key={dish.id} 
                    className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                        <ImageLoader 
                          src={dish.imageUrl || dish.image} 
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

                    <button 
                      onClick={() => toggleStock(dish.id, available)}
                      className="cursor-pointer transition-colors p-1"
                    >
                      {available ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs font-mono">
                          <span>ACTIVE</span>
                          <ToggleRight className="w-10 h-10" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs font-mono">
                          <span>PAUSED</span>
                          <ToggleLeft className="w-10 h-10" />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
