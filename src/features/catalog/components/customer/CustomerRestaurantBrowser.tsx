import { useDebounce } from '@/hooks/useDebounce';
import { Button, EmptyState, Surface } from '@shared/ui';
import { AlertCircle, MapPinOff, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CustomerRestaurantCard from './CustomerRestaurantCard';
import { ReorderStrip } from '@features/customer-orders/components/ReorderStrip';
import { useReorderSuggestions } from '@features/customer-orders/model/useReorderSuggestions';

interface CustomerRestaurantBrowserProps {
  restaurants: import('@/types').Restaurant[];
  isRestaurantsLoading: boolean;
  setIsAddressSelectorOpen: (isOpen: boolean) => void;
  setSelectedRestaurant: (restaurant: import('@/types').Restaurant) => void;
  onAddApiLog?: (log: unknown) => void;
}

/**
 * Chips come from the cuisines actually on the list, most common first. They used to be a
 * hardcoded ['All', 'Burgers', 'Pizza', 'Sushi', 'Salads', 'Desserts'] matched against
 * `restaurant.tags` -- a field the restaurant DTO does not have -- so every chip but All
 * emptied the list.
 */
function cuisineChips(restaurants: import('@/types').Restaurant[], max = 8): string[] {
  const counts = new Map<string, number>();
  for (const r of restaurants) {
    const c = r.cuisine?.trim();
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([c]) => c);
}

export const CustomerRestaurantBrowser: React.FC<CustomerRestaurantBrowserProps> = ({
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
  // Reorder-first. `Main.dc.html` is titled "Home — reorder first"; this data was already
  // being fetched, but only from Settings → History, three taps deep.
  const { suggestions } = useReorderSuggestions();

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
    const matchesCategory = !selectedCategory || restaurant.cuisine?.trim() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const chips = cuisineChips(restaurants);
  const presets = useMotionPresets();
  return (
    <motion.div
      key="feed" {...presets.fade}
      className="p-5 space-y-6"
    >
      {/* Search Bar */}
      <Surface variant="sunken" radius="md" elevation={0} className="flex items-center px-4 py-3">
        <Search className="w-4.5 h-4.5 text-ink-3 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search restaurants or cuisines"
          aria-label="Search restaurants or cuisines"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-sm w-full rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        />
      </Surface>

      {/* Reorder first, then browse -- the order `Main.dc.html` specifies. A promotional
          banner used to hold this slot, which put a campaign above the path most customers
          actually take. The strip renders nothing when there is no history, so a first-time
          customer still lands on discovery. */}
      <ReorderStrip
        suggestions={suggestions}
        onReorder={(s) => {
          const match = restaurants.find((r) => r.id === s.restaurantId);
          if (match) setSelectedRestaurant(match);
        }}
      />

      {/* The promotional banner that used to sit here is gone.
          Three reasons, in order of weight: `Main.dc.html` has no such section -- the home is
          search, "Order it again", then "Open now near you"; its copy ("FLAT 50% OFF",
          "Craving pizza or juicy burgers?") was hardcoded filler wired to no campaign data,
          so it advertised an offer that does not exist; and it rendered as
          amber-700 -> amber-900, which is brown. The dark end of the ramp was forced by the
          white text on it, so the one appetising colour in the palette came out as mud at the
          top of the appetite-led screen. A real campaign surface belongs here when
          CampaignService feeds it. */}
      {/* Restaurants Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg tracking-tight text-ink">Open now near you</h2>
          <span className="text-xs font-mono text-ink-2">{filteredRestaurants.length} nearby</span>
        </div>
        {/* Cuisine filter */}
        {chips.length > 1 && (
          <div className="flex overflow-x-auto scrollbar-none gap-2 pb-1 -mx-5 px-5 sm:mx-0 sm:px-0" role="group" aria-label="Filter by cuisine">
            {['All', ...chips].map(cat => {
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
        )}


        {/* Loading is checked first: an empty list while the request is in flight is not
            "out of range", and the old order flashed that message on every visit. */}
        {isRestaurantsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Surface radius="xl" elevation={0} className="h-64 p-4 animate-pulse flex flex-col justify-between" key={i}>
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl mb-2" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </Surface>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
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
