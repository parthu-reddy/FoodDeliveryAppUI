import { useState, useRef, useEffect } from 'react';
import { MenuItem, CartItem, Order, Restaurant } from '../../types';
import { apiGet, apiPost } from '../../lib/apiClient';
import { getUserProfile } from '../../lib/tokenStore';

interface UseCustomerCartOptions {
  locationKey: string;
  onAddApiLog?: (log: any) => void;
  onPlaceOrder?: (order: Order) => void;
  setTrackingOrder?: (order: Order) => void;
}

export interface CartState {
  items: CartItem[];
  restaurant: Restaurant;
}

const EMPTY_CARTS: Record<string, CartState> = {};

export function useCustomerCart({ locationKey, onAddApiLog, onPlaceOrder, setTrackingOrder }: UseCustomerCartOptions) {
  const [globalCarts, setGlobalCarts] = useState<Record<string, Record<string, CartState>>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Derived active carts for current location
  const carts = globalCarts[locationKey] || EMPTY_CARTS;

  useEffect(() => {
    try {
      const savedGlobalCarts = localStorage.getItem('food_delivery_carts_v2');
      if (savedGlobalCarts) {
        setGlobalCarts(JSON.parse(savedGlobalCarts));
      } else {
        // Migration logic from V1 to V2
        const oldCarts = localStorage.getItem('food_delivery_carts');
        if (oldCarts) {
          const parsedCarts = JSON.parse(oldCarts);
          setGlobalCarts({
            [locationKey]: parsedCarts
          });
        }
      }
    } catch (e) {
      console.error('Failed to load carts from local storage', e);
    }
    setIsInitialized(true);
  }, []); // Only run once on mount, locationKey at mount is used for V1 migration fallback

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('food_delivery_carts_v2', JSON.stringify(globalCarts));
  }, [globalCarts, isInitialized]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [checkoutRestaurantId, setCheckoutRestaurantId] = useState<string | null>(null);
  
  const cartUpdateRef = useRef<number>(0);
  const isSubmittingOrderRef = useRef<boolean>(false);

  const addToCart = (item: MenuItem, selectedRestaurant: Restaurant | null) => {
    if (!selectedRestaurant) return;
    const now = Date.now();
    if (now - cartUpdateRef.current < 50) return;
    cartUpdateRef.current = now;

    setGlobalCarts(prevGlobal => {
      const prevLocationCarts = prevGlobal[locationKey] || {};
      const resId = selectedRestaurant.id;
      const existingCart = prevLocationCarts[resId] || { items: [], restaurant: selectedRestaurant };
      
      const existingItem = existingCart.items.find(i => i.item.id === item.id);
      let newItems;
      if (existingItem) {
        newItems = existingCart.items.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newItems = [...existingCart.items, { item, quantity: 1 }];
      }

      return {
        ...prevGlobal,
        [locationKey]: {
          ...prevLocationCarts,
          [resId]: {
            ...existingCart,
            restaurant: selectedRestaurant, // Ensure restaurant data is up to date
            items: newItems
          }
        }
      };
    });
  };

  const removeFromCart = (itemId: string, restaurantId: string) => {
    const now = Date.now();
    if (now - cartUpdateRef.current < 50) return;
    cartUpdateRef.current = now;
    
    setGlobalCarts(prevGlobal => {
      const prevLocationCarts = prevGlobal[locationKey] || {};
      const existingCart = prevLocationCarts[restaurantId];
      if (!existingCart) return prevGlobal;

      const existingItem = existingCart.items.find(i => i.item.id === itemId);
      let newItems;
      if (existingItem && existingItem.quantity > 1) {
        newItems = existingCart.items.map(i => i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      } else {
        newItems = existingCart.items.filter(i => i.item.id !== itemId);
      }

      const newLocationCarts = { ...prevLocationCarts };
      
      if (newItems.length === 0) {
        delete newLocationCarts[restaurantId];
      } else {
        newLocationCarts[restaurantId] = {
          ...existingCart,
          items: newItems
        };
      }

      return {
        ...prevGlobal,
        [locationKey]: newLocationCarts
      };
    });
  };

  const getCartTotal = (restaurantId: string, deliveryPricing: any) => {
    const cartState = carts[restaurantId];
    if (!cartState) {
      return { subtotal: 0, sgst: 0, cgst: 0, deliveryFee: 0, driverPayout: 0, restaurantDeliveryShare: 0, total: 0 };
    }
    
    const subtotal = cartState.items.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
    
    let sgst = 0;
    let cgst = 0;
    let deliveryFee = 0;
    let driverPayout = 0;
    let restaurantDeliveryShare = 0;
    
    if (deliveryPricing && deliveryPricing.config) {
      const config = deliveryPricing.config;
      const distanceKm = deliveryPricing.distanceKm || 5.0;
      
      driverPayout = config.basePrice + (config.perKmRate * Math.max(1, distanceKm));
      const maxRestContribution = subtotal * config.restMaxContributionPercent;
      restaurantDeliveryShare = Math.min(driverPayout, maxRestContribution);
      const custPaysDe = Math.max(0, driverPayout - restaurantDeliveryShare);
      
      deliveryFee = custPaysDe + config.fixedPlatformFee;
      sgst = subtotal * config.sgstPercent;
      cgst = subtotal * config.cgstPercent;
    } else if (deliveryPricing && deliveryPricing.totalCustomerDeliveryFee !== undefined) {
      sgst = deliveryPricing.sgst || 0;
      cgst = deliveryPricing.cgst || 0;
      deliveryFee = deliveryPricing.totalCustomerDeliveryFee || 0;
    } else if (cartState.restaurant) {
      deliveryFee = Number(cartState.restaurant.deliveryFee || 0);
    }
    
    return {
      subtotal,
      sgst,
      cgst,
      deliveryFee,
      driverPayout,
      restaurantDeliveryShare,
      total: subtotal + sgst + cgst + deliveryFee
    };
  };

  const handleCheckout = async (restaurantId: string) => {
    const activeCart = carts[restaurantId];
    if (!activeCart || activeCart.items.length === 0) return;
    
    setCheckoutRestaurantId(restaurantId);

    try {
      const availRes = await apiGet(`/api/v1/restaurants/${restaurantId}/delivery-availability`);
      if (availRes.data && availRes.data.available === false) {
        setGlobalError("This restaurant is currently out of your delivery zone.");
        setTimeout(() => setGlobalError(null), 3000);
        return;
      }
      if (onAddApiLog) {
        onAddApiLog({ id: 'delivery_avail', label: `GET /api/v1/restaurants/${restaurantId}/delivery-availability`, method: 'GET' });
      }
    } catch(e: any) {
      console.warn("Availability check failed", e);
      const errorMsg = e?.message || "Delivery partner check failed.";
      setGlobalError(errorMsg);
      setTimeout(() => setGlobalError(null), 3000);
      return;
    }

    if (onAddApiLog) {
      onAddApiLog({ id: 'menu_batch', label: `GET /api/v1/restaurants/${restaurantId}/menu/batch`, method: 'GET' });
    }

    setPaymentStatus('idle');
    setIsPaymentModalOpen(true);
  };

  const processPaymentAndOrder = async (
    deliveryAddressId: string,
    deliveryLat: string | number,
    deliveryLng: string | number,
    address: string,
    onSuccessCb: () => void
  ) => {
    if (!checkoutRestaurantId) return;
    if (isSubmittingOrderRef.current || paymentStatus !== 'idle') return;
    
    const activeCart = carts[checkoutRestaurantId];
    if (!activeCart || activeCart.items.length === 0) return;
    
    isSubmittingOrderRef.current = true;
    setPaymentStatus('processing');
    
    if (onAddApiLog) {
      onAddApiLog({ id: 'create_order', label: 'POST /api/v1/orders', method: 'POST' });
    }

    try {
      const items = activeCart.items.map(i => ({ menuItemId: i.item.id, quantity: i.quantity }));
      const profile = getUserProfile();
      
      let finalAddressId = deliveryAddressId;
      if (!finalAddressId) {
        const payload = {
          label: "Current Location",
          addressLine1: address,
          city: "Unknown",
          state: "Unknown",
          zipCode: "000000",
          latitude: parseFloat(deliveryLat as any),
          longitude: parseFloat(deliveryLng as any)
        };
        try {
          const addrRes = await apiPost(`/api/v1/customers/${profile?.id}/addresses`, payload);
          if (addrRes.data?.id) finalAddressId = addrRes.data.id;
        } catch (e) {
          console.error("Failed to save temporary address", e);
        }
      }

      if (!finalAddressId) {
        setPaymentStatus('failed');
        setGlobalError('Could not determine your delivery address. Please select a saved address and try again.');
        return;
      }

      const orderPayload = {
        customerId: profile?.id,
        customerName: profile?.fullName || profile?.name || 'Customer',
        restaurantId: activeCart.restaurant.id,
        deliveryAddressId: finalAddressId,
        items
      };
      
      const res = await apiPost('/api/v1/orders', orderPayload);
      
      setPaymentStatus('success');
      setTimeout(() => {
        if (res.data?.id) {
          onPlaceOrder?.(res.data);
          setTrackingOrder?.(res.data);
          
          setGlobalCarts(prevGlobal => {
            const prevLocationCarts = prevGlobal[locationKey] || {};
            const newLocationCarts = { ...prevLocationCarts };
            delete newLocationCarts[checkoutRestaurantId];
            return {
              ...prevGlobal,
              [locationKey]: newLocationCarts
            };
          });
          
          setIsCartOpen(false);
          setIsPaymentModalOpen(false);
          setCheckoutRestaurantId(null);
          onSuccessCb();
        }
        isSubmittingOrderRef.current = false;
      }, 800);
    } catch (err: any) {
      console.error(err);
      isSubmittingOrderRef.current = false;
      setPaymentStatus('idle');
      setIsPaymentModalOpen(false); 

      if (err?.data?.data && Array.isArray(err.data.data) && err.data.data.length > 0) {
        const unavailableIds = err.data.data as string[];
        const removedItemNames = activeCart.items
          .filter(i => unavailableIds.includes(i.item.id))
          .map(i => i.item.name)
          .join(', ');
          
        setGlobalCarts(prevGlobal => {
          const prevLocationCarts = prevGlobal[locationKey] || {};
          const existingCart = prevLocationCarts[checkoutRestaurantId];
          if (!existingCart) return prevGlobal;
          
          const newItems = existingCart.items.filter(i => !unavailableIds.includes(i.item.id));
          const newLocationCarts = { ...prevLocationCarts };
          
          if (newItems.length === 0) {
            delete newLocationCarts[checkoutRestaurantId];
          } else {
            newLocationCarts[checkoutRestaurantId] = {
              ...existingCart,
              items: newItems
            };
          }
          
          return {
            ...prevGlobal,
            [locationKey]: newLocationCarts
          };
        });
        
        setGlobalError(removedItemNames ? `Removed unavailable items from cart: ${removedItemNames}` : "Some items are unavailable.");
        setTimeout(() => setGlobalError(null), 5000);
      } else {
        const errorMsg = err?.message || "Failed to create order";
        setGlobalError(errorMsg);
        setTimeout(() => setGlobalError(null), 3000);
      }
    }
  };

  return {
    carts,
    isCartOpen,
    setIsCartOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentStatus,
    globalError,
    setGlobalError,
    checkoutRestaurantId,
    addToCart,
    removeFromCart,
    getCartTotal,
    handleCheckout,
    processPaymentAndOrder
  };
}

