import { MenuItem, Restaurant } from '@/types';
import { CartState } from '@features/customer-orders/model/useCustomerCart';
import ImageLoader from '@shared/ui/ImageLoader';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, Bike, ChevronDown, Clock, MapPinOff, Minus, Plus, Star } from 'lucide-react';
import React, { useState } from 'react';
import { StarRating, toAverage, useEntityAggregate, useEntityAggregates } from '@features/reviews';
import { ReviewsPanel } from '@features/reviews/components/ReviewsPanel';
import { VegMarker } from '@features/catalog/components/VegMarker';

interface CustomerMenuViewProps {
  selectedRestaurant: Restaurant;
  setSelectedRestaurant: (res: Restaurant | null) => void;
  deliveryPricing?: {
    isDeliverable?: boolean;
    minAmountForFreeDelivery?: number;
    distanceKm?: number;
    [key: string]: unknown;
  } | null;
  getCartTotal: (resId?: string) => { subtotal: number };
  isDeliveryAvailable: boolean | null;
  deliveryAvailabilityError?: string | null;
  brandOutlets: unknown[];
  setIsOutletSelectorOpen: (isOpen: boolean) => void;
  isMenuLoading: boolean;
  effectiveMenu: MenuItem[];
  carts: Record<string, CartState>;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string, restaurantId: string) => void;
  isQuoting?: boolean;
  deliveryAddressId?: string | null;
  setIsAddressSelectorOpen?: (isOpen: boolean) => void;
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
  selectedRestaurant,
  setSelectedRestaurant,
  deliveryPricing,
  getCartTotal,
  isDeliveryAvailable,
  deliveryAvailabilityError,
  brandOutlets,
  setIsOutletSelectorOpen,
  isMenuLoading,
  effectiveMenu,
  carts,
  addToCart,
  removeFromCart,
  isQuoting,
  deliveryAddressId,
  setIsAddressSelectorOpen
}) => {
  const isDeliverable = deliveryPricing?.isDeliverable ?? isDeliveryAvailable ?? true;
  const showAddressPrompt = !deliveryAddressId;
  const [showReviews, setShowReviews] = useState(false);
  // Aggregate only. The list is fetched by ReviewsPanel when the section is opened, so simply
  // viewing a menu does not pull a page of reviews nobody asked for -- and does not fetch them
  // twice when it is opened.
  // One request for the whole menu. PRODUCT reviews were writable from the rating sheet but shown
  // nowhere, so a customer rated a dish and the rating vanished -- this is the read side of that.
  const { aggregates: dishRatings } = useEntityAggregates(
    'PRODUCT',
    effectiveMenu.map(item => item.id as string),
    effectiveMenu.length > 0,
  );

  const { aggregate: outletAggregate } = useEntityAggregate(
    'RESTAURANT',
    selectedRestaurant.id as string,
    Boolean(selectedRestaurant.id),
  );

  return (
    <motion.div
      key="restaurant-detail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col"
    >
      {/* Cover Image */}
      <div className="relative h-48 w-full bg-transparent">
        <ImageLoader 
          src={selectedRestaurant.image} 
          alt={selectedRestaurant.name}
          className="w-full h-full object-cover brightness-75"
          referrerPolicy="no-referrer"
          containerClassName="w-full h-full"
        />
        <button 
          onClick={() => setSelectedRestaurant(null)}
          className="absolute top-4 left-4 p-2.5 rounded-xl bg-slate-950/20 hover:bg-slate-950 text-white backdrop-blur-sm cursor-pointer border border-rose-500/30"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {showAddressPrompt && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Set your delivery address to see accurate pricing</span>
          </div>
          <button 
            onClick={() => setIsAddressSelectorOpen?.(true)}
            className="text-xs font-bold text-white bg-amber-500 px-3 py-1.5 rounded-lg shadow-sm hover:bg-amber-600 transition-colors"
          >
            Set Address
          </button>
        </div>
      )}

      {/* Restaurant Info Panel */}
      <div className="p-5 border-b border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-950/20 backdrop-blur-md space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-[#f0ede6] tracking-tight">{selectedRestaurant.name}</h3>
            <p className="text-xs text-slate-500 dark:text-[#f0ede6] mt-1">{selectedRestaurant.cuisine}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowReviews(v => !v)}
            aria-expanded={showReviews}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-500 text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 cursor-pointer hover:brightness-110 transition"
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            {/* The live aggregate rather than Outlet.rating. That column is kept current by the
                review-events consumer, but it is a denormalised copy refreshed on an event --
                reading the source means a customer who just submitted a review sees it counted. */}
            <span>
              {outletAggregate && outletAggregate.totalReviews > 0
                ? toAverage(outletAggregate.averageRating).toFixed(1)
                : 'New'}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showReviews ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Removed static free delivery tracker as it is now global floating */}

        {!isDeliverable ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <MapPinOff className="w-5 h-5 shrink-0" />
            <span>
              {(deliveryPricing?.error === 'NO_DELIVERY_PARTNER_NEARBY' || deliveryAvailabilityError === 'NO_DELIVERY_PARTNER_NEARBY')
                ? 'No Delivery Partner Available' 
                : 'Out of Serviceable Area'}
            </span>
          </div>
        ) : null}

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-300 font-mono">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {selectedRestaurant.deliveryTime} mins</span>
          <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-amber-500" /> {isQuoting ? '...' : (() => {
            const minOrder = deliveryPricing?.minAmountForFreeDelivery;
            return minOrder != null ? ((getCartTotal().subtotal) >= minOrder ? 'Free Delivery' : 'Dynamic Fee') : `₹${selectedRestaurant.deliveryFee} Base`;
          })()}</span>
          <span>•</span>
          <span>{deliveryPricing?.distanceKm?.toFixed(1) ?? selectedRestaurant.distance} km away</span>
        </div>
        
        {brandOutlets && brandOutlets.length > 1 && (
          <div className="mt-3">
            <label htmlFor="outlet-select" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Outlet Location:
            </label>
            <button
              id="outlet-select"
              onClick={() => setIsOutletSelectorOpen(true)}
              className="flex w-full items-center justify-between text-sm rounded-xl border border-slate-300 bg-white/50 dark:bg-slate-900/50 dark:border-slate-700 focus:border-rose-500 focus:ring-rose-500 shadow-sm p-2 text-slate-800 dark:text-slate-200"
            >
              <span>{selectedRestaurant.name} ({deliveryPricing?.distanceKm?.toFixed(1) ?? selectedRestaurant.distance} km away)</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}
      </div>

      {/* Dishes Menu List */}
      <div className="p-5 space-y-4">
        <h4 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Menu items</h4>
        
        <div className="space-y-8">
          {isMenuLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 rounded-2xl bg-white/20 dark:bg-slate-900/45 border border-rose-500/20 dark:border-rose-500/30 p-4 animate-pulse flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : Object.entries(effectiveMenu.reduce((acc, dish) => {
            const cat = dish.category || 'Food';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(dish);
            return acc;
          }, {} as Record<string, MenuItem[]>)).map(([category, dishes]) => (
            <div key={category} className="space-y-4">
              <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-300 uppercase tracking-widest">{category}</h5>
              <div className="space-y-4">
                {(dishes as MenuItem[]).map(dish => {
                  const cartQty = carts[selectedRestaurant.id as string]?.items.find((i: import('@/types').CartItem) => i.item.id === dish.id)?.quantity || 0;
                  
                  return (
                    <div 
                      key={dish.id}
                      className="bg-white/20 dark:bg-white/5 border border-rose-500/20 dark:border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/20 dark:hover:bg-white/10 hover:border-amber-400/30 dark:hover:border-amber-500/50 hover:shadow-[0_8px_30px_rgb(249,115,22,0.1)] dark:hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] backdrop-blur-md rounded-[2rem] p-4 flex gap-4 transition duration-300 relative text-left hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition"
                    >
                      <div className="w-20 h-20 rounded-xl bg-transparent overflow-hidden shrink-0">
                        <ImageLoader 
                          src={dish.imageUrl || dish.image} 
                          alt={dish.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          containerClassName="w-full h-full"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <VegMarker item={dish} />
                            <h5 className="font-bold text-sm text-slate-900 dark:text-[#f0ede6]">{dish.name}</h5>
                          </div>
                          {/* Absent until someone has actually rated the dish: "0.0" and an empty
                              row of stars reads as a bad dish rather than a new one. */}
                          {(dishRatings[dish.id as string]?.totalReviews ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <StarRating
                                value={dishRatings[dish.id as string].average}
                                size="sm"
                                label={dish.name}
                              />
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                                {dishRatings[dish.id as string].average.toFixed(1)}
                                <span className="font-normal"> ({dishRatings[dish.id as string].totalReviews})</span>
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">{dish.description}</p>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-black text-amber-500">₹{dish.price}</span>
                            {dish.prepTimeMinutes && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/50">
                                <Clock className="w-3 h-3" />
                                {dish.prepTimeMinutes} mins
                              </span>
                            )}
                          </div>
                          
                          {dish.isAvailable === false ? (
                            <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200/20">
                              Out of Stock
                            </span>
                          ) : !isDeliverable ? (
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-xl">
                              Unavailable Here
                            </span>
                          ) : cartQty > 0 ? (
                            <div className="flex items-center bg-gradient-to-r from-amber-500 to-amber-500 text-white rounded-xl overflow-hidden font-bold shadow-md shadow-amber-500/15">
                              <button 
                                onClick={() => removeFromCart(dish.id as string, selectedRestaurant.id as string)}
                                className="px-3 py-1.5 hover:bg-amber-600 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-sm">{cartQty}</span>
                              <button 
                                onClick={() => addToCart(dish)}
                                className="px-3 py-1.5 hover:bg-amber-600 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(dish)}
                              className="px-4 py-1.5 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-500 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border border-rose-500/20 dark:border-rose-500/30 hover:border-amber-500 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {showReviews && (
          <div className="px-5 pb-8 pt-2 border-t border-rose-500/20 dark:border-rose-500/30">
            <ReviewsPanel
              entityType="RESTAURANT"
              entityId={selectedRestaurant.id as string}
              title="Reviews"
              emptyTitle="No reviews yet"
              emptyDescription="Order from here and you can be the first to leave one."
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
