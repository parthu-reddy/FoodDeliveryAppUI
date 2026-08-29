import { getUserProfile } from '@/lib/tokenStore';
import { customerApi } from '@/lib/zodiosClients';
import { CartItem, MenuItem, Order, Restaurant } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { asUntyped } from '../../../lib/untypedResponse';

interface UseCustomerCartOptions {
  locationKey: string;
  onAddApiLog?: (log: unknown) => void;
  onPlaceOrder?: (order: Order) => void;
  setTrackingOrder?: (order: Order) => void;
  selectedRestaurantId?: string | null;
}

export interface CartState {
  items: CartItem[];
  restaurant: Restaurant;
  lastUpdated?: number;
}

const EMPTY_CARTS: Record<string, CartState> = {};

export function useCustomerCart({ locationKey, onAddApiLog, onPlaceOrder, setTrackingOrder, selectedRestaurantId }: UseCustomerCartOptions) {
  const [globalCarts, setGlobalCarts] = useState<Record<string, Record<string, CartState>>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Derived active carts for current location
  const carts = globalCarts[locationKey] || EMPTY_CARTS;

  useEffect(() => {
    try {
      const savedGlobalCarts = localStorage.getItem('food_delivery_carts_v2');
      if (savedGlobalCarts) {
        const parsedCarts = JSON.parse(savedGlobalCarts);
        // Expiry logic: remove carts older than 24 hours
        const EXPIRY_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const validGlobalCarts: Record<string, Record<string, CartState>> = {};

        for (const [locKey, locationCarts] of Object.entries(parsedCarts)) {
          const locObj = locationCarts as Record<string, CartState>;
          const validLocCarts: Record<string, CartState> = {};
          let hasValidCarts = false;
          for (const [resId, cart] of Object.entries(locObj)) {
            // Default to Date.now() if missing to give it a 24h grace period
            const lastUpdated = cart.lastUpdated || now;
            if (now - lastUpdated < EXPIRY_MS) {
              validLocCarts[resId] = cart;
              hasValidCarts = true;
            }
          }
          if (hasValidCarts) {
            validGlobalCarts[locKey] = validLocCarts;
          }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGlobalCarts(validGlobalCarts);
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
    } catch (e: unknown) {
      console.error('Failed to load carts from local storage', e);
    }
    setIsInitialized(true);
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);

  const cartUpdateRef = useRef<number>(0);
  const isSubmittingOrderRef = useRef<boolean>(false);

  const addToCart = (item: MenuItem, selectedRestaurant: Restaurant | null) => {
    if (!selectedRestaurant) {
      setGlobalError('Please select a restaurant location first');
      setTimeout(() => setGlobalError(null), 3000);
      return;
    }
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
            items: newItems,
            lastUpdated: Date.now()
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
          items: newItems,
          lastUpdated: Date.now()
        };
      }

      return {
        ...prevGlobal,
        [locationKey]: newLocationCarts
      };
    });
  };

  const clearCart = (restaurantId: string) => {
    setGlobalCarts(prevGlobal => {
      const prevLocationCarts = prevGlobal[locationKey];
      if (!prevLocationCarts || !prevLocationCarts[restaurantId]) return prevGlobal;

      const newLocationCarts = { ...prevLocationCarts };
      delete newLocationCarts[restaurantId];

      return {
        ...prevGlobal,
        [locationKey]: newLocationCarts
      };
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCartTotal = (restaurantId: string, legacyPricingFallback?: any) => {
    const quote = quotes[restaurantId];
    if (quote) {
      return quote.data ? quote.data : quote;
    }
    // Fallback if quote not yet loaded
    const cartState = carts[restaurantId];
    if (!cartState) {
      return { subtotal: 0, sgst: 0, cgst: 0, deliveryFee: 0, driverPayout: 0, restaurantDeliveryShare: 0, total: 0, platformFee: 0, minAmountForFreeDelivery: 0, distanceKm: 0 };
    }
    const subtotal = cartState.items.reduce((sum, item) => sum + ((item.item.price || 0) * item.quantity), 0);
    let deliveryFee = 0;
    if (legacyPricingFallback && legacyPricingFallback.totalCustomerDeliveryFee !== undefined) {
      deliveryFee = legacyPricingFallback.totalCustomerDeliveryFee || 0;
    } else if (cartState.restaurant) {
      deliveryFee = Number(cartState.restaurant.deliveryFee || 0);
    }
    return {
      subtotal,
      sgst: 0,
      cgst: 0,
      deliveryFee,
      platformFee: 0,
      driverPayout: 0,
      restaurantDeliveryShare: 0,
      total: subtotal + deliveryFee,
      minAmountForFreeDelivery: 0,
      distanceKm: 0,
      isEstimated: true
    };
  };


  // Sync address ID to cart hook for quoting
  useEffect(() => {
    // If not supplied directly via options, we might rely on the dashboard setting it.
    // Or we expose setDeliveryAddressId from the hook.
  }, []);

  // Debounced quote API call
  useEffect(() => {
    if (!isInitialized) return;

    const activeRestaurantIds = new Set(Object.keys(carts).filter(rId => carts[rId].items.length > 0));
    if (selectedRestaurantId) {
      activeRestaurantIds.add(selectedRestaurantId);
    }
    if (activeRestaurantIds.size === 0) return;

    // We only fetch quotes from the backend if we have a valid deliveryAddressId
     
    if (!deliveryAddressId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuotes({});
      return;
    }

    setIsQuoting(true);
    // Optimistically clear quotes if they are for a different address (or just let it fallback to estimated)
     
    // Actually, setting quotes to {} might cause layout shift, but it's better than showing wrong delivery fee
     
    setQuotes(() => {
      // If we are quoting for a new address, clear the quotes.
      // But we don't have the previous address ID here. Let's just clear them to be safe.
      return {};
    });

    const timeout = setTimeout(() => {
      Promise.all(Array.from(activeRestaurantIds).map(async (rId) => {
        const cartState = carts[rId];
        try {
          const res = await customerApi.order.post('/api/v1/orders/quote', {
            restaurantId: rId,
            deliveryAddressId: deliveryAddressId,
            items: cartState ? cartState.items.map(item => ({
              menuItemId: item.item.id as string,
              quantity: item.quantity
            })) : []
          });
          return { restaurantId: rId, quote: res };
        } catch (error: unknown) {
          console.error('Failed to fetch quote for restaurant', rId, error);
          const errorData = (error as { response?: { data?: { errorCode?: string; error?: string; message?: string } } }).response?.data;
          const errorCode = errorData?.errorCode || errorData?.error || errorData?.message || 'UNKNOWN_ERROR';
          
          let friendlyError = errorCode;
          if (errorCode === 'OUT_OF_SERVICE_AREA') {
            friendlyError = "This restaurant is too far for delivery to your location.";
          } else if (errorCode === 'NO_DELIVERY_PARTNER_NEARBY') {
            friendlyError = "All our delivery partners are currently busy. Please try again in a few minutes.";
          }

          return { restaurantId: rId, quote: { isDeliverable: false, error: friendlyError, errorCode: errorData?.errorCode } };
        }
      })).then((results) => {
        const newQuotes = { ...quotes };
        results.forEach(result => {
          if (result.quote) {
            newQuotes[result.restaurantId] = result.quote;
          }
        });
        setQuotes(newQuotes);
        setIsQuoting(false);
      });
    }, 500);

     
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carts, deliveryAddressId, isInitialized, selectedRestaurantId]);

  const handleCheckout = async (restaurantId: string) => {
    const activeCart = carts[restaurantId];
    if (!activeCart || activeCart.items.length === 0) return;

    setCheckoutRestaurantId(restaurantId);

    try {
      const availRes = await customerApi.customerRestaurant.get('/api/v1/restaurants/:id/delivery-availability', { params: { id: restaurantId } });
      if (asUntyped<boolean>(availRes) === false) {
        setGlobalError("This restaurant is currently out of your delivery zone.");
        setTimeout(() => setGlobalError(null), 3000);
        return;
      }
      if (onAddApiLog) {
        onAddApiLog({ id: 'delivery_avail', label: `GET /api/v1/restaurants/${restaurantId}/delivery-availability`, method: 'GET' });
      }
    } catch (e: unknown) {
      console.warn("Availability check failed", e);
      // @ts-expect-error auto-migration type suppression
      const errorMsg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Delivery partner check failed.";
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
    paymentMethod: string,
    deliveryAddressId: string,

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

      const finalAddressId = deliveryAddressId;
      if (!finalAddressId) {
        setPaymentStatus('failed');
        setGlobalError('Could not determine your delivery address. Please select a saved address and try again.');
        isSubmittingOrderRef.current = false;
        return;
      }

      // The order is charged the quoted price, so the quote it was priced from must be sent.
      // Quotes are refreshed whenever the cart or address changes; if one is missing the customer
      // has to re-quote rather than have the server invent a price.
      const rawQuote = quotes[checkoutRestaurantId];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeQuote: any = (rawQuote as any)?.data ?? rawQuote;
      const quoteId: string | undefined = activeQuote?.quoteId;
      if (!quoteId) {
        setPaymentStatus('failed');
        setGlobalError('Your price quote is no longer available. Please review your cart and try again.');
        isSubmittingOrderRef.current = false;
        return;
      }

      const orderPayload = {
        quoteId,
        customerId: profile?.id,
        customerName: profile?.fullName || profile?.name || 'Customer',
        restaurantId: activeCart.restaurant.id,
        deliveryAddressId: finalAddressId,
        items,
        paymentMethod: paymentMethod || 'WALLET'
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await customerApi.order.post('/api/v1/orders', orderPayload as any, {});

      setPaymentStatus('success');
       
      setTimeout(() => {
         
        if (res.data?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPlaceOrder?.(res.data as any);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTrackingOrder?.(res.data as any);

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
        setPaymentStatus('idle');
      }, 3000);
    } catch (err: unknown) {
      console.error(err);
      isSubmittingOrderRef.current = false;
      setPaymentStatus('idle');
      setIsPaymentModalOpen(false);

      // @ts-expect-error auto-migration type suppression
      if (err?.data?.data && Array.isArray(err.data.data) && err.data.data.length > 0) {
        // @ts-expect-error auto-migration type suppression
        const unavailableIds = err.data.data as string[];
        const removedItemNames = activeCart.items
          .filter(i => unavailableIds.includes(i.item.id as string))
          .map(i => i.item.name)
          .join(', ');

        setGlobalCarts(prevGlobal => {
          const prevLocationCarts = prevGlobal[locationKey] || {};
          const existingCart = prevLocationCarts[checkoutRestaurantId];
          if (!existingCart) return prevGlobal;

          const newItems = existingCart.items.filter(i => !unavailableIds.includes(i.item.id as string));
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
        // @ts-expect-error auto-migration type suppression
        const errorCode = err?.response?.data?.errorCode;
        // @ts-expect-error auto-migration type suppression
        let errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to create order";
        
        if (errorCode === 'OUT_OF_SERVICE_AREA') {
          errorMsg = "This restaurant is too far for delivery to your location.";
        } else if (errorCode === 'NO_DELIVERY_PARTNER_NEARBY') {
          errorMsg = "All our delivery partners are currently busy. Please try again in a few minutes.";
        }

        setGlobalError(errorMsg);
        setTimeout(() => setGlobalError(null), 4000);
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
    clearCart,
    getCartTotal,
    handleCheckout,
    processPaymentAndOrder,
    setDeliveryAddressId,
    isQuoting,
    quotes
  };
}


