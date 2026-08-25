import { useDebounce } from '@/hooks/useDebounce';
import { Button, EmptyState } from '@shared/ui';
import { AlertCircle, MapPinOff, Search } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CustomerRestaurantCard from './CustomerRestaurantCard';

interface CustomerRestaurantBrowserProps {
  categories: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  restaurants: any[];
  isRestaurantsLoading: boolean;
  setIsAddressSelectorOpen: (isOpen: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedRestaurant: (restaurant: any) => void;
  onAddApiLog?: (log: unknown) => void;
}

export const CustomerRestaurantBrowser: React.FC<CustomerRestaurantBrowserProps> = ({
  categories,
  restaurants,
  isRestaurantsLoading,
  setIsAddressSelectorOpen,
  setSelectedRestaurant,
  onAddApiLog
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(6);
  }, [debouncedSearchQuery, selectedCategory, restaurants]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastElementRef = useCallback((node: any) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 6);
      }
    });
    if (node) observerRef.current.observe(node);
  }, []);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = (restaurant.name || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (restaurant.cuisine || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' ||
      (restaurant.tags || []).includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      key="feed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-5 space-y-6"
    >
      {/* Promo banner */}
      <div className="bg-gradient-to-r from-orange-500/90 to-amber-500/90 border border-white/25 backdrop-blur-md text-white p-5 rounded-3xl relative overflow-hidden shadow-lg shadow-orange-500/10">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle,_transparent_30%,_rgba(0,0,0,0.1)_70%)] pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-[240px]">
          <span className="text-[9px] uppercase font-bold tracking-wider bg-white/30 text-white px-2 py-0.5 rounded-full border border-white/20">FLAT 50% OFF</span>
          <h3 className="text-xl font-black tracking-tight leading-none text-white">Craving pizza or juicy burgers?</h3>
          <p className="text-xs text-orange-50 font-semibold">Free delivery on your first three gourmet meals.</p>
        </div>
      </div>

      {/* Categories Selector */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm tracking-wide text-slate-400 dark:text-slate-300 uppercase font-mono">Filter by Cravings</h4>
        <div className="flex overflow-x-auto scrollbar-none gap-2 pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${(cat === 'All' && !selectedCategory) || selectedCategory === cat
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-transparent text-white shadow-md shadow-orange-500/15'
                  : 'bg-white/20 dark:bg-white/5 backdrop-blur-sm border-rose-500/20 dark:border-rose-500/30 text-slate-500 dark:text-[#f0ede6] hover:border-orange-500/30 dark:hover:border-orange-500/50 hover:bg-white/20 dark:hover:bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-[69px] z-20 flex items-center bg-white/20 dark:bg-white/5 border border-rose-500/20 dark:border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/20 dark:hover:bg-white/10 focus-within:bg-white/20 dark:focus-within:bg-white/10 backdrop-blur-md rounded-[2rem] px-4 py-3 focus-within:border-orange-500/50 dark:focus-within:border-orange-500/50 transition-all hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50">
        <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-300 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search restaurants, dishes, cuisines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-sm outline-none w-full text-slate-800 dark:text-[#f0ede6] placeholder-slate-400"
        />
      </div>

      {/* Restaurants Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Premium Kitchens</h4>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-300">{filteredRestaurants.length} open</span>
        </div>

        {restaurants.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 rounded-3xl bg-white/5 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <MapPinOff className="w-12 h-12 text-rose-500/50" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-[#f0ede6] mb-2">Out of Range</h3>
            { }
            <p className="text-sm mb-4">We don't have any partner kitchens in your delivery area yet.</p>
            <Button
              onClick={() => setIsAddressSelectorOpen(true)}
              variant="primary"
            >
              Change Address
            </Button>
          </div>
        ) : isRestaurantsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-white/20 dark:bg-slate-900/45 border border-rose-500/20 dark:border-rose-500/30 p-4 animate-pulse flex flex-col justify-between">
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl mb-2" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <EmptyState
            title="No Kitchens Found"
             
            description="We couldn't find any kitchens matching your search criteria."
            icon={<AlertCircle className="w-12 h-12 text-rose-500/50" />}
            action={
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                className="mt-4 px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.slice(0, visibleCount).map((restaurant, idx, arr) => (
              <CustomerRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isLast={idx === arr.length - 1}
                lastElementRef={lastElementRef}
                onClick={(rest) => {
                  setSelectedRestaurant(rest);
                  if (onAddApiLog) {
                    onAddApiLog({ id: 'delivery_check', label: `GET /api/v1/restaurants/${rest.id}/delivery-availability`, method: 'GET' });
                    onAddApiLog({ id: 'catalog', label: `GET /api/v1/restaurants/${rest.id}/catalog/items`, method: 'GET' });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
