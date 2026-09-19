import { useDebounce } from '@/hooks/useDebounce';
import { Button, EmptyState, Surface } from '@shared/ui';
import { AlertCircle, MapPinOff, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CustomerRestaurantCard from './CustomerRestaurantCard';

interface CustomerRestaurantBrowserProps {
  categories: string[];
  restaurants: import('@/types').Restaurant[];
  isRestaurantsLoading: boolean;
  setIsAddressSelectorOpen: (isOpen: boolean) => void;
  setSelectedRestaurant: (restaurant: import('@/types').Restaurant) => void;
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
  const lastElementRef = useCallback((node: HTMLButtonElement | null) => {
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
      ((restaurant as { tags?: string[] }).tags || []).includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const presets = useMotionPresets();
  return (
    <motion.div
      key="feed" {...presets.fade}
      className="p-5 space-y-6"
    >
      {/* Promo banner. A coloured panel keeps its colour and takes shape and depth from
          Surface; it is not chrome, so it carries no blur and no white translucency. */}
      <Surface
        radius="lg"
        elevation={2}
        className="text-white p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(140deg, var(--color-amber-700), var(--color-amber-900))',
          border: 'none',
        }}
      >
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle,_transparent_30%,_rgba(0,0,0,0.1)_70%)] pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-[240px]">
          <span
            className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-amber-500)', color: 'var(--color-ink)' }}
          >
            FLAT 50% OFF
          </span>
          <h3 className="text-xl font-black tracking-tight leading-none text-white">Craving pizza or juicy burgers?</h3>
          <p className="text-xs text-amber-50 font-semibold">Free delivery on your first three gourmet meals.</p>
        </div>
      </Surface>

      {/* Categories Selector */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm tracking-wide text-slate-400 dark:text-slate-300 uppercase font-mono">Filter by Cravings</h4>
        <div className="flex overflow-x-auto scrollbar-none gap-2 pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
          {categories.map(cat => {
            const isActive = (cat === 'All' && !selectedCategory) || selectedCategory === cat;
            return (
              <Button
                key={cat}
                size="sm"
                variant={isActive ? 'primary' : 'secondary'}
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                className="shrink-0 whitespace-nowrap"
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <Surface variant="sunken" radius="md" elevation={0} className="sticky top-[69px] z-20 flex items-center px-4 py-3">
        <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-300 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search restaurants, dishes, cuisines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-sm w-full rounded-md text-slate-800 dark:text-[#f0ede6] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        />
      </Surface>

      {/* Restaurants Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Premium Kitchens</h4>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-300">{filteredRestaurants.length} open</span>
        </div>

        {restaurants.length === 0 ? (
          <Surface radius="xl" elevation={0} className="p-12 text-center text-slate-400 dark:text-slate-300 border-dashed">
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
          </Surface>
        ) : isRestaurantsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Surface radius="xl" elevation={0} className="h-64 p-4 animate-pulse flex flex-col justify-between" key={i}>
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl mb-2" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </Surface>
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
