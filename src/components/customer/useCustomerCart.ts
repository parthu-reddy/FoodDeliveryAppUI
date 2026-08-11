import { useState, useRef } from 'react';
import { MenuItem, CartItem, Order, Restaurant } from '../../types';
import { apiGet, apiPost } from '../../lib/apiClient';
import { getUserProfile } from '../../lib/tokenStore';

interface UseCustomerCartOptions {
  onAddApiLog?: (log: any) => void;
  onPlaceOrder?: (order: Order) => void;
  setTrackingOrder?: (order: Order) => void;
}

export function useCustomerCart({ onAddApiLog, onPlaceOrder, setTrackingOrder }: UseCustomerCartOptions = {}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartRestaurant, setCartRestaurant] = useState<Restaurant | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const cartUpdateRef = useRef<number>(0);
  const isSubmittingOrderRef = useRef<boolean>(false);

  const addToCart = (item: MenuItem, selectedRestaurant: Restaurant | null) => {
    const now = Date.now();
    if (now - cartUpdateRef.current < 50) return;
    cartUpdateRef.current = now;

    if (cartRestaurant && selectedRestaurant && cartRestaurant.id !== selectedRestaurant.id) {
      if (window.confirm("Adding items from a new outlet will clear your cart. Continue?")) {
        setCart([{ item, quantity: 1 }]);
        setCartRestaurant(selectedRestaurant);
      }
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (prev.length === 0 && selectedRestaurant) {
        setCartRestaurant(selectedRestaurant);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    const now = Date.now();
    if (now - cartUpdateRef.current < 50) return;
    cartUpdateRef.current = now;
    setCart(prev => {
      const existing = prev.find(i => i.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      const newCart = prev.filter(i => i.item.id !== itemId);
      if (newCart.length === 0) setCartRestaurant(null);
      return newCart;
    });
  };

  const GST_RATE = 0.025;

  const getCartTotal = (selectedRestaurant: Restaurant | null, deliveryPricing: any) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
    const sgst = subtotal * GST_RATE;
    const cgst = subtotal * GST_RATE;
    
    let deliveryFee = (cartRestaurant || selectedRestaurant) ? Number((cartRestaurant || selectedRestaurant)?.deliveryFee || 0) : 0;
    if (deliveryPricing && deliveryPricing.minimumOrderForFreeDelivery < 999999) {
      if (subtotal >= deliveryPricing.minimumOrderForFreeDelivery) {
        deliveryFee = deliveryPricing.fixedPlatformFee;
      } else {
        deliveryFee += deliveryPricing.fixedPlatformFee;
      }
    }
    
    return {
      subtotal,
      sgst,
      cgst,
      deliveryFee,
      total: subtotal + sgst + cgst + deliveryFee
    };
  };

  const handleCheckout = async (selectedRestaurant: Restaurant | null) => {
    const activeRest = cartRestaurant || selectedRestaurant;
    if (!activeRest || cart.length === 0) return;
    
    try {
      const availRes = await apiGet(`/api/v1/restaurants/${activeRest.id}/delivery-availability`);
      if (availRes.data && availRes.data.available === false) {
        setGlobalError("This restaurant is currently out of your delivery zone.");
        setTimeout(() => setGlobalError(null), 3000);
        return;
      }
      if (onAddApiLog) {
        onAddApiLog({ id: 'delivery_avail', label: `GET /api/v1/restaurants/${activeRest.id}/delivery-availability`, method: 'GET' });
      }
    } catch(e: any) {
      console.warn("Availability check failed", e);
      const errorMsg = e?.message || "Delivery partner check failed.";
      setGlobalError(errorMsg);
      setTimeout(() => setGlobalError(null), 3000);
      return;
    }

    if (onAddApiLog) {
      onAddApiLog({ id: 'menu_batch', label: `GET /api/v1/restaurants/${activeRest.id}/menu/batch`, method: 'GET' });
    }

    setPaymentStatus('idle');
    setIsPaymentModalOpen(true);
  };

  const processPaymentAndOrder = async (
    selectedRestaurant: Restaurant | null,
    deliveryAddressId: string,
    deliveryLat: string | number,
    deliveryLng: string | number,
    address: string,
    onSuccessCb: () => void
  ) => {
    if (isSubmittingOrderRef.current || paymentStatus !== 'idle') return;
    const activeRest = cartRestaurant || selectedRestaurant;
    if (!activeRest || cart.length === 0) return;
    
    isSubmittingOrderRef.current = true;
    setPaymentStatus('processing');
    
    if (onAddApiLog) {
      onAddApiLog({ id: 'create_order', label: 'POST /api/v1/orders', method: 'POST' });
    }

    try {
      const items = cart.map(i => ({ menuItemId: i.item.id, quantity: i.quantity }));
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
        restaurantId: activeRest.id,
        deliveryAddressId: finalAddressId,
        items
      };
      
      const res = await apiPost('/api/v1/orders', orderPayload);
      
      setPaymentStatus('success');
      setTimeout(() => {
        if (res.data?.id) {
          onPlaceOrder?.(res.data);
          setTrackingOrder?.(res.data);
          setCart([]);
          setCartRestaurant(null);
          setIsCartOpen(false);
          setIsPaymentModalOpen(false);
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
        const removedItemNames = cart
          .filter(i => unavailableIds.includes(i.item.id))
          .map(i => i.item.name)
          .join(', ');
          
        setCart(prev => {
          const newCart = prev.filter(i => !unavailableIds.includes(i.item.id));
          if (newCart.length === 0) setCartRestaurant(null);
          return newCart;
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
    cart,
    cartRestaurant,
    isCartOpen,
    setIsCartOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentStatus,
    globalError,
    setGlobalError,
    addToCart,
    removeFromCart,
    getCartTotal,
    handleCheckout,
    processPaymentAndOrder
  };
}
