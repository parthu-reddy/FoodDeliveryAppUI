import React from 'react';
import { ArrowLeft, Star, Bike, MapPinOff, Clock, ChevronDown, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageLoader from '../shared/ImageLoader';
import { MenuItem } from '../../types';

interface CustomerMenuViewProps {
  selectedRestaurant: any;
  setSelectedRestaurant: (res: any | null) => void;
  deliveryPricing: any;
  getCartTotal: (resId?: string) => { subtotal: number };
  isDeliveryAvailable: boolean | null;
  brandOutlets: any[];
  setIsOutletSelectorOpen: (isOpen: boolean) => void;
  isMenuLoading: boolean;
  effectiveMenu: MenuItem[];
  carts: any;
  addToCart: (item: any) => void;
  removeFromCart: (itemId: string, restaurantId: string) => void;
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
  selectedRestaurant,
  setSelectedRestaurant,
  deliveryPricing,
  getCartTotal,
  isDeliveryAvailable,
  brandOutlets,
  setIsOutletSelectorOpen,
  isMenuLoading,
  effectiveMenu,
  carts,
  addToCart,
  removeFromCart,
}) => {
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

      {/* Restaurant Info Panel */}
      <div className="p-5 border-b border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-950/20 backdrop-blur-md space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-[#f0ede6] tracking-tight">{selectedRestaurant.name}</h3>
            <p className="text-xs text-slate-500 dark:text-[#f0ede6] mt-1">{selectedRestaurant.cuisine}</p>
          </div>
          <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-md shadow-orange-500/10">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{selectedRestaurant.rating}</span>
          </div>
        </div>

        {/* Removed static free delivery tracker as it is now global floating */}

        {isDeliveryAvailable === false && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm">
            <MapPinOff className="w-5 h-5 shrink-0" />
            <span>Out of Serviceable Area</span>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-300 font-mono">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {selectedRestaurant.deliveryTime} mins</span>
          <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-emerald-500" /> {(() => {
            const minOrder = deliveryPricing?.config 
              ? ((deliveryPricing.config.basePrice + (deliveryPricing.config.perKmRate * Math.max(1, deliveryPricing.distanceKm || 5.0))) / (deliveryPricing.config.restMaxContributionPercent || 1))
              : (deliveryPricing?.minimumOrderForFreeDelivery || 999999);
            return minOrder < 999999 ? ((getCartTotal().subtotal) >= minOrder ? 'Free Delivery' : 'Dynamic Fee') : `₹${selectedRestaurant.deliveryFee} Base`;
          })()}</span>
          <span>•</span>
          <span>{deliveryPricing ? deliveryPricing.distanceKm.toFixed(1) : selectedRestaurant.distance} km away</span>
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
              <span>{selectedRestaurant.name} ({deliveryPricing ? deliveryPricing.distanceKm.toFixed(1) : selectedRestaurant.distance} km away)</span>
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
                {(dishes as any[]).map(dish => {
                  const cartQty = carts[selectedRestaurant.id]?.items.find((i: any) => i.item.id === dish.id)?.quantity || 0;
                  
                  return (
                    <div 
                      key={dish.id}
                      className="bg-white/20 dark:bg-white/5 border border-rose-500/20 dark:border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/20 dark:hover:bg-white/10 hover:border-orange-400/30 dark:hover:border-orange-500/50 hover:shadow-[0_8px_30px_rgb(249,115,22,0.1)] dark:hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] backdrop-blur-md rounded-[2rem] p-4 flex gap-4 transition-all duration-300 relative text-left hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
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
                            <span className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center p-0.5 ${dish.isVeg ? 'border-emerald-500' : 'border-red-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            </span>
                            <h5 className="font-bold text-sm text-slate-900 dark:text-[#f0ede6]">{dish.name}</h5>
                          </div>
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
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-200/20">
                              Out of Stock
                            </span>
                          ) : isDeliveryAvailable === false ? (
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-xl">
                              Unavailable Here
                            </span>
                          ) : cartQty > 0 ? (
                            <div className="flex items-center bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl overflow-hidden font-bold shadow-md shadow-orange-500/15">
                              <button 
                                onClick={() => removeFromCart(dish.id, selectedRestaurant.id)}
                                className="px-3 py-1.5 hover:bg-orange-600 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-sm">{cartQty}</span>
                              <button 
                                onClick={() => addToCart(dish)}
                                className="px-3 py-1.5 hover:bg-orange-600 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(dish)}
                              className="px-4 py-1.5 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border border-rose-500/20 dark:border-rose-500/30 hover:border-orange-500 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
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
      </div>
    </motion.div>
  );
};
