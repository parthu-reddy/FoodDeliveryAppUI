import React, { useEffect, useRef } from 'react';
import { Heart, Star, Clock, Bike, Megaphone } from 'lucide-react';
import { Restaurant } from '../types';
import ImageLoader from './ImageLoader';

interface CustomerRestaurantCardProps {
  key?: React.Key;
  restaurant: Restaurant;
  isLast: boolean;
  lastElementRef: (node: any) => void;
  onClick: (restaurant: Restaurant) => void;
}

export default function CustomerRestaurantCard({ restaurant, isLast, lastElementRef, onClick }: CustomerRestaurantCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for Impression Tracking
  useEffect(() => {
    if (!restaurant.isSponsored || !restaurant.adData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Fire impression tracking call to EventTrackingService
          // We fire-and-forget the analytics payload containing the encrypted adData
          fetch(`http://localhost:8080/api/v1/tracking/impression`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ adData: restaurant.adData })
          }).catch(err => console.error("Impression tracking failed", err));
          
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
    if (restaurant.isSponsored && restaurant.adData) {
      // Fire click tracking call to EventTrackingService
      fetch(`http://localhost:8080/api/v1/tracking/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adData: restaurant.adData })
      }).catch(err => console.error("Click tracking failed", err));
    }
    onClick(restaurant);
  };

  return (
    <div
      ref={(node) => {
        // Handle both the infinite scroll ref and our local intersection observer ref
        if (isLast && lastElementRef) lastElementRef(node);
        // @ts-ignore
        cardRef.current = node;
      }}
      onClick={handleCardClick}
      className={`group flex flex-col rounded-3xl transition-all duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 bg-white/12 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] ${restaurant.isSponsored ? 'hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] dark:hover:shadow-[0_0_15px_rgba(234,179,8,0.6)] border-amber-400/40 hover:border-amber-400/60' : 'hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 dark:border-rose-500/30'} transition-all dark:bg-slate-900/20 dark:hover:bg-slate-900/20 dark:shadow-[0_15px_35px_rgba(0,0,0,0.35)] text-left`}
    >
      <div className="h-44 w-full relative overflow-hidden bg-transparent">
        <ImageLoader
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          containerClassName="w-full h-full"
        />
        {restaurant.isSponsored && (
          <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-amber-400/50">
            <Megaphone className="w-3 h-3" />
            Sponsored
          </div>
        )}
        <div className="absolute top-3 right-3 bg-slate-950/20 backdrop-blur-sm p-1.5 rounded-full text-white/80 hover:text-red-500 border border-rose-500/30">
          <Heart className="w-4 h-4" />
        </div>
      </div>

      <div className="p-4.5 space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-base text-slate-900 dark:text-[#f0ede6] group-hover:text-amber-500 transition-colors">{restaurant.brandName || restaurant.name}</h5>
          <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-lg text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{restaurant.rating}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-300 font-medium">{restaurant.cuisine}</p>

        <div className="flex items-center gap-3.5 pt-2 text-xs text-slate-500 dark:text-slate-300 font-mono border-t border-rose-500/20 dark:border-rose-500/30">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {restaurant.deliveryTime}m</span>
          <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-emerald-500" /> ${restaurant.deliveryFee} fee</span>
          <span>{restaurant.distance} km</span>
        </div>
      </div>
    </div>
  );
}
