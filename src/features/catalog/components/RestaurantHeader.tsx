import { ArrowLeft, Bike, Clock, MapPin } from 'lucide-react';
import React from 'react';
import type { Restaurant } from '@/types';
import { Button } from '@shared/ui';
import { motion } from 'motion/react';
import ImageLoader from '@shared/ui/ImageLoader';

/**
 * The cover, identity and delivery facts for one restaurant.
 *
 * It was written inline in `CustomerMenuView` — roughly a third of that file — mixed in with
 * the menu itself. Ratings and notices are slots rather than props so that `catalog` does not
 * have to import `reviews` or know anything about a delivery quote.
 */

interface RestaurantHeaderProps {
  restaurant: Restaurant;
  onBack: () => void;
  /** Rating control. A node, so `catalog` need not depend on `reviews`. */
  rating?: React.ReactNode;
  /** Address prompts and deliverability warnings, under the cover image. */
  notices?: React.ReactNode;
  /** Delivery-fee wording; it depends on a live quote the header does not fetch. */
  feeLabel: string;
  /** Distance to show, already resolved against the live quote. */
  distanceLabel: string;
  /** The outlet switcher, when the brand has more than one outlet. */
  children?: React.ReactNode;
}

export function RestaurantHeader({
  restaurant,
  onBack,
  rating,
  notices,
  feeLabel,
  distanceLabel,
  children,
}: RestaurantHeaderProps) {
  return (
    <header>
      {/* The other end of the restaurant-cover shared element; see CustomerRestaurantCard. */}
      <motion.div layoutId={`restaurant-cover-${restaurant.id}`} className="relative h-48 w-full">
        <ImageLoader
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover brightness-75"
          referrerPolicy="no-referrer"
          containerClassName="w-full h-full"
        />
        <Button
          size="icon"
          variant="secondary"
          aria-label="Back to restaurants"
          onClick={onBack}
          className="absolute top-4 left-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </motion.div>

      {notices}

      {/* Page content, so solid paper: glass is for chrome that floats over scrolling content,
          and this block scrolls with the menu. */}
      <div className="px-5 pt-5 pb-3 space-y-3">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3
              className="text-2xl font-black tracking-tight truncate"
              style={{ color: 'var(--color-ink)' }}
            >
              {restaurant.name}
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-ink-2)' }}>
              {restaurant.cuisine}
            </p>
          </div>
          {rating}
        </div>

        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono"
          style={{ color: 'var(--color-ink-2)' }}
        >
          {restaurant.deliveryTime ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {restaurant.deliveryTime} min
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <Bike className="w-3.5 h-3.5" /> {feeLabel}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {distanceLabel}
          </span>
        </div>

        {children}
      </div>
    </header>
  );
}
