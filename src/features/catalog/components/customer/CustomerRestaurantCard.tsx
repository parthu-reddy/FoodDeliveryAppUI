import { formatDeliveryFee, formatKm, formatRating } from '@features/catalog/model/restaurantFacts';
import { outletPrepMinutes } from '@features/catalog/model/prepTime';
import { Surface } from '@shared/ui';
import { Restaurant } from '@/types';
import ImageLoader from '@shared/ui/ImageLoader';
import { motion } from 'motion/react';
import { Bike, Clock, Heart, Megaphone, Star } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { surfaceStyle } from '@shared/ui';

interface CustomerRestaurantCardProps {
  key?: React.Key;
  restaurant: Restaurant;
  isLast: boolean;
  lastElementRef: (node: HTMLButtonElement | null) => void;
  onClick: (restaurant: Restaurant) => void;
}

export default function CustomerRestaurantCard({ restaurant, isLast, lastElementRef, onClick }: CustomerRestaurantCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const prepMinutes = outletPrepMinutes(restaurant.defaultPrepTimeSeconds);

  // IntersectionObserver for Impression Tracking
  useEffect(() => {
    const adData = restaurant.adData;
    if (!restaurant.isSponsored || !adData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Fire impression tracking via GET using the URL provided by the bidding engine
          const trackingUrl = adData.impressionUrl;
          if (trackingUrl) {
            const relativeUrl = trackingUrl.replace('http://event-tracking-service', '');
            window.fetch(import.meta.env.VITE_API_BASE_URL + relativeUrl, { headers: { 'X-Calling-Service': 'CustomerApplication' } }).catch(err => console.error("Tracking failed", err));
          }

          observer.disconnect(); // Only track impression once per render
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    return () => observer.disconnect();
  }, [restaurant]);

  const handleCardClick = () => {
    const adData = restaurant.adData;
    if (restaurant.isSponsored && adData) {
      // Fire click tracking via GET using the URL provided by the bidding engine
      const trackingUrl = adData.clickUrl;
      if (trackingUrl) {
        const relativeUrl = trackingUrl.replace('http://event-tracking-service', '');
        window.fetch(import.meta.env.VITE_API_BASE_URL + relativeUrl, { headers: { 'X-Calling-Service': 'CustomerApplication' } }).catch(err => console.error("Click tracking failed", err));
      }
    }
    onClick(restaurant);
  };

  return (
    <button type="button"
      ref={(node) => {
        // Handle both the infinite scroll ref and our local intersection observer ref
        if (isLast && lastElementRef) lastElementRef(node);
        cardRef.current = node;
      }}
      onClick={handleCardClick}
      style={{
        ...surfaceStyle({ elevation: 2, radius: 'lg' }),
        // sponsored is a border, not a glow: a hover shadow class could never win against
        // the inline boxShadow this style sets, so the old one never rendered
        ...(restaurant.isSponsored ? { border: '1px solid var(--color-amber-400)' } : null),
      }}
      className="group flex flex-col transition duration-300 relative overflow-hidden cursor-pointer hover:-translate-y-1.5 text-left"
    >
      {/* Shared element 1 of 2: this cover travels into the menu's header. */}
      <motion.div layoutId={`restaurant-cover-${restaurant.id}`} className="h-44 w-full relative overflow-hidden bg-transparent">
        <ImageLoader
          src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"}
          alt={restaurant.name || "Restaurant"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          containerClassName="w-full h-full"
        />
        {restaurant.isSponsored && (
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5"
            style={{ background: 'var(--color-amber-500)', color: 'var(--color-ink)' }}
          >
            <Megaphone className="w-3 h-3" />
            Sponsored
          </div>
        )}
        <Surface radius="full" elevation={0} className="absolute top-3 right-3 p-1.5 text-white/80 hover:text-rose-500">
          <Heart className="w-4 h-4" />
        </Surface>
      </motion.div>

      <div className="p-4.5 space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-base text-slate-900 dark:text-[#f0ede6] group-hover:text-amber-500 transition-colors">{restaurant.brandName || restaurant.name}</h5>
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{formatRating(restaurant.rating)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-300 font-medium">{restaurant.cuisine}</p>

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-2 text-xs text-slate-500 dark:text-slate-300 font-mono border-t border-rose-500/20 dark:border-rose-500/30">
          {/* The kitchen's live prep default (the restaurant's stepper), not `deliveryTime` --
              a figure typed in once at onboarding that nothing keeps current. Phase 7 C4. */}
          {prepMinutes ? (
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-ink-3" /> {prepMinutes} min prep</span>
          ) : null}
          <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-ink-3" /> {formatDeliveryFee(restaurant.deliveryFee)}</span>
          {formatKm(restaurant.distance) && <span>{formatKm(restaurant.distance)}</span>}
        </div>
      </div>
    </button>
  );
}
