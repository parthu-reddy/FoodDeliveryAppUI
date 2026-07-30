import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, ShoppingBag, LogOut, ChevronRight, Star, Clock, 
  Bike, Plus, Minus, X, Check, Timer, ArrowLeft, ShieldCheck, Heart, Store, Sun, Moon,
  Terminal, Sliders, Code, Send, RefreshCw, Package, User, Navigation, AlertCircle, MapPinOff, XCircle, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoleName, Restaurant, MenuItem, CartItem, Order, OrderStatus, DeliveryStatus } from '../types';
import { apiGet, apiPost } from '../lib/apiClient';
import { getUserProfile } from '../lib/tokenStore';
import LaBouffeLogo from './LaBouffeLogo';
import { getEffectiveMenu } from '../lib/menuStore';
import ImageLoader from './ImageLoader';
import CustomerRestaurantCard from './CustomerRestaurantCard';
import CustomerActiveOrdersCarousel from './CustomerActiveOrdersCarousel';

import CustomerCartDrawer from './CustomerCartDrawer';
import SharedSettingsView from './SharedSettingsView';
import CustomerAddressModal from './CustomerAddressModal';
import CustomerPaymentModal from './CustomerPaymentModal';
import CompleteProfileModal from './CompleteProfileModal';
import OrderTrackingMap from './OrderTrackingMap';


interface CustomerDashboardProps {
  userName: string;
  userPhone: string;
  activeOrders?: Order[];
  onPlaceOrder?: (order: Order) => void;
  onUpdateOrder?: (orderId: string, status: string) => void;
  onLogout: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onAddApiLog?: (log: any) => void;
}


// Utility to determine if order is actively tracked
const isActiveOrder = (status: string) => {
  const s = (status || '').trim().toUpperCase();
  return ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_RESTAURANT, 'cancelled_by_restaurant', OrderStatus.DELIVERY_FAILED].includes(s);
};

const isFailedOrder = (status: string) => {
  const s = (status || '').trim().toUpperCase();
  return [OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_RESTAURANT, 'cancelled_by_restaurant', OrderStatus.DELIVERY_FAILED].includes(s);
};

export default function CustomerDashboard({ 
  userName, 
  userPhone, 
  activeOrders: externalOrders, 
  onPlaceOrder: externalPlaceOrder,
  onUpdateOrder, 
  onLogout,
  theme = 'light',
  onToggleTheme,
  onAddApiLog
}: CustomerDashboardProps) {
  // Internal order state — falls back to parent prop if provided
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const activeOrders = externalOrders ?? internalOrders;

  const onPlaceOrder = externalPlaceOrder ?? ((order: Order) => {
    setInternalOrders(prev => [...prev, order]);
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [brandOutlets, setBrandOutlets] = useState<Restaurant[]>([]);
  const [effectiveMenu, setEffectiveMenu] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState<boolean>(false);
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState<boolean>(false);
  const isSubmittingOrderRef = useRef<boolean>(false);
  const [address, setAddress] = useState(() => localStorage.getItem('deliveryAddress') || 'Please add an address');
  const [deliveryLat, setDeliveryLat] = useState<string | number>(() => localStorage.getItem('deliveryLat') || '12.97');
  const [deliveryLng, setDeliveryLng] = useState<string | number>(() => localStorage.getItem('deliveryLng') || '77.59');
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(() => localStorage.getItem('deliveryAddressId') || '');

  useEffect(() => {
    localStorage.setItem('deliveryAddress', address);
    localStorage.setItem('deliveryLat', String(deliveryLat));
    localStorage.setItem('deliveryLng', String(deliveryLng));
    localStorage.setItem('deliveryAddressId', deliveryAddressId);
  }, [address, deliveryLat, deliveryLng, deliveryAddressId]);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Fetch active orders and nearby restaurants
  useEffect(() => {
    const profile = getUserProfile();
    if (profile && profile.role === RoleName.CUSTOMER) {
      const profilePromise = apiGet(`/api/v1/users/profile`).catch(e => { console.error(e); return { data: null }; });
      const ordersPromise = apiGet(`/api/v1/orders/active?page=0&size=10`).catch(e => { console.error(e); return { data: null }; });
      const addressesPromise = profile.id ? apiGet(`/api/v1/customers/${profile.id}/addresses`).catch(e => { console.error(e); return { data: null }; }) : Promise.resolve({ data: null });

      Promise.all([profilePromise, ordersPromise, addressesPromise]).then(([profileRes, ordersRes, addrRes]) => {
        // Handle Profile
        if (profileRes.data) {
          const p = profileRes.data;
          if (p.name) setEditName(p.name);
          if (p.email) setEditEmail(p.email);
          if (!p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
            setShowProfileModal(true);
          }
        }
        
        // Handle Orders
        if (ordersRes.data) {
          const content = ordersRes.data.content || (Array.isArray(ordersRes.data) ? ordersRes.data : []);
          const mapped = content.map((o: any) => {
            let s = o.status?.toUpperCase() || '';
            if (s === 'ON_HOLD') s = OrderStatus.AWAITING_DELAY_APPROVAL;
            if (s === OrderStatus.PENDING_ACCEPTANCE || s === OrderStatus.CREATED) s = OrderStatus.PENDING_ACCEPTANCE;
            return { ...o, status: s };
          });
          setInternalOrders(mapped);
        }

        // Handle Addresses
        if (addrRes.data) {
          setSavedAddresses(addrRes.data);
          if (addrRes.data.length === 0) {
            setAddress('Please add an address');
            setDeliveryAddressId('');
            localStorage.removeItem('deliveryAddress');
            localStorage.removeItem('deliveryAddressId');
          } else {
            const currentId = localStorage.getItem('deliveryAddressId');
            const exists = addrRes.data.some((a: any) => a.id === currentId);
            if (!exists && addrRes.data.length > 0) {
              const first = addrRes.data[0];
              setAddress(`${first.label || 'Address'}: ${first.addressLine1 || ''}, ${first.city || ''}`);
              setDeliveryAddressId(first.id);
            }
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (deliveryLat && deliveryLng) {
      setIsRestaurantsLoading(true);
      apiGet(`/api/v1/restaurants/nearby?lat=${deliveryLat}&lng=${deliveryLng}&radius=10.0`)
        .then(res => {
          if (!ignore && res.data) setRestaurants(res.data);
        })
        .catch(console.error)
        .finally(() => {
          if (!ignore) setIsRestaurantsLoading(false);
        });
    }
    return () => { ignore = true; };
  }, [deliveryLat, deliveryLng]);

  // Smart polling for active orders only (every 60s)
  const activeOrderIdsStr = internalOrders
    .filter(o => [OrderStatus.CREATED, OrderStatus.PENDING_ACCEPTANCE, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP].includes(o.status?.toUpperCase() || ''))
    .map(o => o.id)
    .sort()
    .join(',');

  useEffect(() => {
    // Stop polling if no active orders
    if (!activeOrderIdsStr) return;

    const intervalId = setInterval(() => {
      apiGet(`/api/v1/orders/active?page=0&size=50`)
        .then(res => {
          if (!res.data) return;
          const content = res.data.content || (Array.isArray(res.data) ? res.data : []);
          const updatedOrders = content.map((o: any) => {
            let s = o.status?.toUpperCase() || '';
            if (s === 'ON_HOLD' || s === 'awaiting_delay_approval') s = OrderStatus.AWAITING_DELAY_APPROVAL;
            if (s === OrderStatus.PENDING_ACCEPTANCE || s === OrderStatus.CREATED) s = OrderStatus.PENDING_ACCEPTANCE;
            return { ...o, status: s };
          });
          
          setInternalOrders(prev => {
            const newOrders = [...prev];
            let changed = false;
            updatedOrders.forEach((updated: any) => {
              const idx = newOrders.findIndex(o => o.id === updated.id);
              if (idx !== -1 && JSON.stringify(newOrders[idx]) !== JSON.stringify(updated)) {
                newOrders[idx] = updated;
                changed = true;
              }
            });
            return changed ? newOrders : prev;
          });
        })
        .catch(console.error);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [activeOrderIdsStr]);

  // Pre-cache restaurant and menu images for smoother scrolling (caches 20 restaurants & 20 menu items)
  useEffect(() => {
    const preloadImages = () => {
      const imagesToPreload = [
        ...restaurants.slice(0, 20).map(r => r.image)
      ];
      imagesToPreload.forEach(src => {
        if (src) {
          const img = new Image();
          img.src = src;
        }
      });
    };
    preloadImages();
  }, []);



  useEffect(() => {
    let ignore = false;
    if (selectedRestaurant) {
      setIsMenuLoading(true);
      getEffectiveMenu(selectedRestaurant.id).then(menu => {
        if (!ignore) {
          setEffectiveMenu(menu);
          setIsMenuLoading(false);
        }
      }).catch(() => {
        if (!ignore) setIsMenuLoading(false);
      });
    } else {
      setEffectiveMenu([]);
      setIsMenuLoading(false);
    }
    return () => { ignore = true; };
  }, [selectedRestaurant?.id]); // Only refetch menu when outlet ID changes

  useEffect(() => {
    let ignore = false;
    if (selectedRestaurant?.brandId) {
      apiGet(`/api/v1/restaurants/brands/${selectedRestaurant.brandId}/outlets?lat=${deliveryLat}&lng=${deliveryLng}&radius=10.0`)
        .then(res => {
          if (!ignore && res.data) setBrandOutlets(res.data);
        })
        .catch(console.error);
    } else {
      setBrandOutlets([]);
    }
    return () => { ignore = true; };
  }, [selectedRestaurant?.brandId, deliveryLat, deliveryLng]); // Only refetch outlets when brand changes

  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let ignore = false;
    if (selectedRestaurant) {
      setIsDeliveryAvailable(null);
      apiGet(`/api/v1/restaurants/${selectedRestaurant.id}/delivery-availability`)
        .then(res => {
          if (!ignore && res.data && typeof res.data.available === 'boolean') {
            setIsDeliveryAvailable(res.data.available);
          }
        })
        .catch(console.error);
    }
    return () => { ignore = true; };
  }, [selectedRestaurant?.id]);


  useEffect(() => {
    if (onAddApiLog) {
      onAddApiLog({ id: 'nearby', label: 'GET /api/v1/restaurants/nearby', method: 'GET' });
    }
  }, []);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartRestaurant, setCartRestaurant] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);


  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddressSelectorOpen, setIsAddressSelectorOpen] = useState(false);
  const [isOutletSelectorOpen, setIsOutletSelectorOpen] = useState(false);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'history' | 'addresses'>('profile');

  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState(userPhone);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');



  // If there's an active order, let's keep checking its status in the parent
  const currentTrackingOrder = activeOrders.find(o => o.id === trackingOrder?.id) || trackingOrder;


  useEffect(() => {
    if (currentTrackingOrder && (currentTrackingOrder.status === OrderStatus.PICKED_UP || currentTrackingOrder.deliveryStatus === DeliveryStatus.AT_RESTAURANT || currentTrackingOrder.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY)) {
      if (onAddApiLog) {
        onAddApiLog({ id: 'live_tracking', label: `GET /api/v1/orders/${currentTrackingOrder.id}/live-tracking (SSE)`, method: 'GET' });
      }
    }
  }, [currentTrackingOrder?.status]);

  // Categories
  const categories = ['All', 'Burgers', 'Pizza', 'Sushi', 'Salads', 'Desserts'];

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = (restaurant.name || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                          (restaurant.cuisine || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || 
                            (restaurant.tags || []).includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [debouncedSearchQuery, selectedCategory, restaurants]);

  const observerRef = React.useRef<IntersectionObserver>();
  const lastElementRef = React.useCallback((node: any) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 6);
      }
    });
    if (node) observerRef.current.observe(node);
  }, []);

  const addToCart = (item: MenuItem) => {
    if (cartRestaurant && cartRestaurant.id !== selectedRestaurant.id) {
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
      if (prev.length === 0) {
        setCartRestaurant(selectedRestaurant);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
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

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
    const sgst = subtotal * 0.025;
    const cgst = subtotal * 0.025;
    const deliveryFee = (cartRestaurant || selectedRestaurant) ? (cartRestaurant || selectedRestaurant).deliveryFee : 0;
    return {
      subtotal,
      sgst,
      cgst,
      deliveryFee,
      total: subtotal + sgst + cgst + deliveryFee
    };
  };

  const handleCheckout = async () => {
    const activeRest = cartRestaurant || selectedRestaurant;
    if (!activeRest || cart.length === 0) return;
    
    // Delivery Availability Check
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

  const processPaymentAndOrder = async () => {
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

      const orderPayload = {
        customerId: profile?.id,
        restaurantId: activeRest.id,
        deliveryAddressId: finalAddressId || "00000000-0000-0000-0000-000000000001",
        items
      };
      
      const res = await apiPost('/api/v1/orders', orderPayload);
      
      setPaymentStatus('success');
      setTimeout(() => {
        if (res.data?.id) {
          onPlaceOrder(res.data);
          setTrackingOrder(res.data);
          setCart([]);
          setCartRestaurant(null);
          setIsCartOpen(false);
          setIsPaymentModalOpen(false);
          setSelectedRestaurant(null);
        }
        isSubmittingOrderRef.current = false;
      }, 800);
    } catch (err: any) {
      console.error(err);
      isSubmittingOrderRef.current = false;
      setPaymentStatus('idle');
      setIsPaymentModalOpen(false); // Close payment modal on error

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

  // Get stage index for order tracking
  const getStatusIndex = (status: OrderStatus | string) => {
    let effectiveStatus = status;
    if (status === OrderStatus.AWAITING_DELAY_APPROVAL) effectiveStatus = OrderStatus.PENDING_ACCEPTANCE;
    if (status === OrderStatus.PENDING_ACCEPTANCE || status === OrderStatus.CREATED) effectiveStatus = OrderStatus.PENDING_ACCEPTANCE;
    if (status === OrderStatus.AWAITING_DELAY_APPROVAL) effectiveStatus = OrderStatus.PENDING_ACCEPTANCE;
    
    const statuses: string[] = [
      OrderStatus.PENDING_ACCEPTANCE, 
      OrderStatus.ACCEPTED, 
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP, 
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERED
    ];
    return statuses.indexOf(effectiveStatus as string);
  };

  // Simulated GPS Path Coordinate (translating step status to percentage of route progress)
  const getDeliveryProgress = (order: Order) => {
    switch (order.status) {
      case OrderStatus.PENDING_ACCEPTANCE: return 5;
      case OrderStatus.ACCEPTED: return 20;
      case OrderStatus.PREPARING: return 40;
      case OrderStatus.READY_FOR_PICKUP: return 50;
      case OrderStatus.PICKED_UP: 
        if (order.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY) return 80;
        if (order.deliveryStatus === DeliveryStatus.AT_RESTAURANT) return 70;
        return 60;
      case OrderStatus.DELIVERED: return 100;
      default: return 0;
    }
  };



  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
      
      {/* Global Error Toast */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-12 left-0 right-0 mx-auto max-w-sm z-[100] px-4"
            >
              <div className="bg-rose-500/90 backdrop-blur-xl border border-rose-500/50 shadow-2xl rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-white shrink-0" />
                <p className="text-white font-medium text-sm pt-0.5">{globalError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* 1. Header Area */}
      <header className="sticky top-0 bg-white/20 dark:bg-white/5 backdrop-blur-xl px-5 py-3 flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
        <div className="flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8 shrink-0" textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs" subColorClass="text-rose-500 text-[8px]" />
          <div className="flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />
          <button 
            onClick={() => {
              setIsAddressSelectorOpen(true);
            }}
            className="flex items-center gap-2 min-w-0 flex-1 hover:bg-slate-50 dark:hover:bg-slate-900/20 p-1.5 -ml-1.5 rounded-2xl transition-colors cursor-pointer text-left"
          >
            <div className="w-8 h-8 shrink-0 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <MapPin className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-300 block truncate">Deliver to</span>
              <span className="text-xs font-bold truncate block w-full">{address}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-300 shrink-0" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => view === 'settings' ? setView('home') : setView('settings')}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              view === 'settings' 
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6]'
            }`}
            title="Profile Settings"
          >
            <User className="w-4 h-4 text-indigo-500" />
          </button>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
              title="Toggle Light/Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          )}
        </div>
      </header>

      {view === 'settings' ? (
        <SharedSettingsView
            onBack={() => setView('home')}
            theme={theme}
            showCustomerTabs={true}
            setTrackingOrder={(order) => {
              setTrackingOrder(order);
              setView('home');
            }}
            savedAddresses={savedAddresses}
            initialTab={settingsTab}
            isAddressModalOpen={isAddressModalOpen}
            setIsAddressModalOpen={setIsAddressModalOpen}
            addressSearchQuery={addressSearchQuery}
            setAddressSearchQuery={setAddressSearchQuery}
            address={address}
            setAddress={setAddress}
            onAddApiLog={onAddApiLog}
            onLogout={onLogout}
            customerId={getUserProfile()?.id}
            onSelectDeliveryLocation={(addr: string, lat?: string | number, lng?: string | number) => {
              setAddress(addr);
              if (lat !== undefined && lng !== undefined) {
                setDeliveryLat(lat);
                setDeliveryLng(lng);
              }
              setIsAddressSelectorOpen(false);
              setView('home');
            }}
          />
      ) : (
        <AnimatePresence mode="wait">
        {currentTrackingOrder ? (
          currentTrackingOrder.status === OrderStatus.DELIVERED ? (
            /* ------------------- DELIVERED SUMMARY SCREEN ------------------- */
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-5 space-y-5"
            >
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:text-[#f0ede6] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Order Summary
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300">#{currentTrackingOrder.id}</span>
                </h3>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">Order Delivered! 🎉</h4>
                <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70">
                  Enjoy your food from {currentTrackingOrder.restaurantName}.
                </p>
              </div>

              <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-3xl">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-rose-500/10">
                  <span className="font-bold text-slate-800 dark:text-[#f0ede6]">Digital Invoice</span>
                  <span className="text-xs font-mono text-slate-500">#{currentTrackingOrder.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="space-y-3 mb-6">
                  {currentTrackingOrder.items.map((item: any, idx: number) => (
                    <div key={item.item?.id || idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>{item.quantity || 1}x {item.item?.name || item.name || 'Item'}</span>
                      <span>${((item.item?.price || item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span>Delivery Fee</span>
                    <span>${(currentTrackingOrder.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 dark:text-[#f0ede6] pt-2">
                    <span>Total Paid</span>
                    <span>${(currentTrackingOrder.totalAmount || currentTrackingOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setGlobalError('Invoice downloaded successfully!');
                    setTimeout(() => setGlobalError(null), 3000);
                  }}
                  className="w-full py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-700 dark:hover:bg-slate-100 shadow-md active:scale-[0.98] cursor-pointer text-sm"
                >
                  <Package className="w-5 h-5" /> Download PDF Invoice
                </button>
              </div>
            </motion.div>
          ) : (
            /* ------------------- TRACKING SCREEN ------------------- */
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-5 space-y-5"
            >
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:text-[#f0ede6] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {isActiveOrder(currentTrackingOrder.status) ? 'Order Tracking' : 'Order Details'}
                  {activeOrders.filter(o => isActiveOrder(o.status)).length > 1 ? (
                    <select
                      className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-500 dark:text-slate-300 border-none outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-semibold hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
                      value={currentTrackingOrder.id}
                      onChange={(e) => {
                        const order = activeOrders.find((o) => o.id === e.target.value);
                        if (order) setTrackingOrder(order);
                      }}
                    >
                      {activeOrders.filter(o => isActiveOrder(o.status)).map((o) => (
                        <option key={o.id} value={o.id}>
                          #{o.id} - {o.status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300">#{currentTrackingOrder.id}</span>
                  )}
                </h3>
              </div>

              {isActiveOrder(currentTrackingOrder.status) && !isFailedOrder(currentTrackingOrder.status) ? (
                <>
              {/* Immersive Delivery map (Vector path simulation) */}
              <div className="relative w-full h-44 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl overflow-hidden shadow-inner">
                <OrderTrackingMap order={currentTrackingOrder} enableLiveTracking={true} />
              </div>

              {/* Active Status Display Card */}
              <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">
                      {currentTrackingOrder.status === OrderStatus.PENDING_ACCEPTANCE && 'Waiting for Restaurant...'}
                      {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL && 'Restaurant Requested Delay'}
                      {currentTrackingOrder.status === OrderStatus.ACCEPTED && 'Order Confirmed!'}
                      {currentTrackingOrder.status === OrderStatus.PREPARING && 'Kitchen is Cooking...'}
                      {currentTrackingOrder.status === OrderStatus.READY_FOR_PICKUP && 'Order is Ready!'}
                      {currentTrackingOrder.status === OrderStatus.PICKED_UP && currentTrackingOrder.deliveryStatus === DeliveryStatus.AT_RESTAURANT && 'Rider is Waiting at Restaurant...'}
                      {currentTrackingOrder.status === OrderStatus.PICKED_UP && currentTrackingOrder.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY && 'Rider is on the Way!'}
                      {currentTrackingOrder.status === OrderStatus.PICKED_UP && !currentTrackingOrder.deliveryStatus && 'Picked Up by Rider!'}
                      {currentTrackingOrder.status === OrderStatus.DELIVERED && 'Order Delivered!'}
                      {isFailedOrder(currentTrackingOrder.status) && 'Order Failed / Cancelled'}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-300">
                      {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL 
                        ? 'The restaurant is experiencing high volume and needs more time. Do you wish to continue?'
                        : isFailedOrder(currentTrackingOrder.status)
                        ? 'Your order could not be completed and will be refunded.'
                        : 'Estimated delivery: 15-20 mins'}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-2xl ${isFailedOrder(currentTrackingOrder.status) ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL || isFailedOrder(currentTrackingOrder.status) ? <Clock className="w-5 h-5 text-red-500" /> : <Timer className="w-5 h-5" />}
                  </div>
                </div>

                {currentTrackingOrder.status === OrderStatus.AWAITING_DELAY_APPROVAL && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={async () => {
                        if (onAddApiLog) {
                          onAddApiLog({ id: 'order_approve_delay', label: `POST /api/v1/orders/${currentTrackingOrder.id}/delay-approval`, method: 'POST' });
                        }
                        
                        try {
                          await apiPost(`/api/v1/orders/${currentTrackingOrder.id}/delay-approval`, {
                            approved: true,
                            expectedDelayMinutes: 15
                          });
                          if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, OrderStatus.ACCEPTED);
                          setInternalOrders(prev => prev.map(o => o.id === currentTrackingOrder.id ? { ...o, status: OrderStatus.ACCEPTED } : o));
                        } catch (e) {
                          console.error("Failed to approve delay", e);
                        }
                      }}
                      className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                    >
                      Approve Delay
                    </button>
                    <button
                      onClick={async () => {
                        if (onAddApiLog) {
                          onAddApiLog({ id: 'order_reject_delay', label: `POST /api/v1/orders/${currentTrackingOrder.id}/delay-approval`, method: 'POST' });
                        }
                        
                        try {
                          await apiPost(`/api/v1/orders/${currentTrackingOrder.id}/delay-approval`, {
                            approved: false
                          });
                          if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, OrderStatus.CANCELLED);
                          setInternalOrders(prev => prev.map(o => o.id === currentTrackingOrder.id ? { ...o, status: OrderStatus.CANCELLED } : o));
                        } catch (e) {
                          console.error("Failed to reject delay", e);
                        }
                      }}
                      className="flex-1 py-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-200 dark:hover:bg-red-500/20 transition-all text-sm"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
                
                {isFailedOrder(currentTrackingOrder.status) && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        // Dismiss from local UI state
                        setInternalOrders(prev => prev.filter(o => o.id !== currentTrackingOrder.id));
                        setTrackingOrder(null);
                      }}
                      className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all text-sm shadow-xl shadow-red-500/20"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                
                {(currentTrackingOrder.status === OrderStatus.PENDING_ACCEPTANCE || currentTrackingOrder.status === OrderStatus.CREATED) && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={async () => {
                        if (onAddApiLog) {
                          onAddApiLog({ id: 'cancel_order', label: `POST /api/v1/orders/${currentTrackingOrder.id}/cancel`, method: 'POST' });
                        }
                        try {
                          await apiPost(`/api/v1/orders/${currentTrackingOrder.id}/cancel`);
                          if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, OrderStatus.CANCELLED);
                          else {
                            setInternalOrders(prev => {
                              const newOrders = [...prev];
                              const idx = newOrders.findIndex(o => o.id === currentTrackingOrder.id);
                              if (idx !== -1) {
                                newOrders[idx].status = OrderStatus.CANCELLED;
                              }
                              return newOrders;
                            });
                          }
                        } catch (e: any) {
                          console.error("Failed to cancel order", e);
                          alert(e.response?.data?.message || "Failed to cancel order");
                        }
                      }}
                      className="flex-1 py-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-200 dark:hover:bg-red-500/20 transition-all text-sm"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {currentTrackingOrder.status !== OrderStatus.AWAITING_DELAY_APPROVAL && !isFailedOrder(currentTrackingOrder.status) && (
                  <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono tracking-wider">Secure Delivery Verification</span>
                      <span className="text-sm font-semibold">Share OTP with Rider at delivery</span>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-mono text-xl font-black px-4 py-2 rounded-xl tracking-wider shadow-md">
                      {currentTrackingOrder.otp}
                    </div>
                  </div>
                )}

                {/* Step checklist */}
                {isFailedOrder(currentTrackingOrder.status) ? (
                  <div className="bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 mt-4 mx-2">
                    <XCircle className="w-10 h-10 text-rose-500 mb-1" />
                    <h3 className="font-black text-rose-600 dark:text-rose-400">Order Cancelled</h3>
                    <p className="text-xs font-semibold text-rose-500/80">This order was cancelled. Any payments made will be refunded automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-0 pt-4 px-2">
                    {[
                      { status: OrderStatus.PENDING_ACCEPTANCE, label: 'Order Received' },
                    { status: OrderStatus.ACCEPTED, label: 'Accepted by Kitchen' },
                    { status: OrderStatus.PREPARING, label: 'Cooking & Packaging' },
                    { status: OrderStatus.PICKED_UP, label: 'Picked up by Delivery Executive' },
                    { status: OrderStatus.DELIVERED, label: 'Handed Over & Verified' },
                  ].map((step, idx, arr) => {
                    // For UI steps, OrderStatus.READY_FOR_PICKUP acts as OrderStatus.ACCEPTED being done but OrderStatus.PICKED_UP not yet done
                    const stepStatusIndex = getStatusIndex(step.status as OrderStatus);
                    const currentStatusIndex = getStatusIndex(currentTrackingOrder.status);
                    
                    const isDone = currentStatusIndex > stepStatusIndex || (currentStatusIndex === stepStatusIndex && step.status !== OrderStatus.DELIVERED);
                    const isCurrent = currentStatusIndex === stepStatusIndex || (step.status === OrderStatus.PREPARING && [OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP].includes(currentTrackingOrder.status as OrderStatus));
                    const isLast = idx === arr.length - 1;
                    
                    return (
                      <div key={idx} className="flex items-start gap-4 relative">
                        {/* Vertical line connector */}
                        {!isLast && (
                          <div className={`absolute left-3 top-6 bottom-[-6px] w-[2px] -ml-[1px] ${
                            isDone ? 'bg-emerald-500' : 'bg-rose-500/10 dark:bg-rose-500/20'
                          }`} />
                        )}
                        
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border text-[10px] font-bold z-10 transition-colors ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                            : isCurrent
                              ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)] ring-4 ring-amber-500/20'
                              : 'bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border-rose-500/30 dark:border-rose-500/30 text-slate-400 dark:text-slate-500'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        
                        <div className={`pb-6 ${isLast ? 'pb-2' : ''}`}>
                          <span className={`text-sm tracking-wide ${
                            isDone 
                              ? 'font-extrabold text-slate-800 dark:text-[#f0ede6]' 
                              : isCurrent 
                                ? 'font-black text-amber-500'
                                : 'font-semibold text-slate-400 dark:text-slate-500'
                          }`}>
                            {step.label}
                          </span>
                          {isCurrent && currentTrackingOrder.status !== OrderStatus.DELIVERED && (
                            <p className="text-[11px] text-amber-500/80 mt-0.5 font-bold uppercase tracking-wider">
                              {currentTrackingOrder.status === OrderStatus.READY_FOR_PICKUP 
                                ? 'Waiting for Driver...' 
                                : 'Currently in progress...'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
              
              {/* Active Order Details */}
              <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl mt-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6] mb-4">Order Details</h3>
                {currentTrackingOrder.restaurantName && (
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
                    From: {currentTrackingOrder.restaurantName}
                  </div>
                )}
                <div className="space-y-3">
                  {currentTrackingOrder.items && currentTrackingOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <span>{item.quantity || 1}x {item.item?.name || item.name || 'Item'}</span>
                      <span>${((item.item?.price || item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 mt-4 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                    <span>Items Total</span>
                    <span>${currentTrackingOrder.items ? currentTrackingOrder.items.reduce((sum: number, item: any) => sum + ((item.item?.price || item.price || 0) * (item.quantity || 1)), 0).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                    <span>Delivery Fee</span>
                    <span>${currentTrackingOrder.deliveryFee !== undefined ? currentTrackingOrder.deliveryFee.toFixed(2) : (currentTrackingOrder.items ? ((currentTrackingOrder.totalAmount || currentTrackingOrder.total || 0) - currentTrackingOrder.items.reduce((sum: number, item: any) => sum + ((item.item?.price || item.price || 0) * (item.quantity || 1)), 0)).toFixed(2) : '0.00')}</span>
                  </div>
                  {currentTrackingOrder.sgst !== undefined && (
                    <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                      <span>SGST</span>
                      <span>${currentTrackingOrder.sgst.toFixed(2)}</span>
                    </div>
                  )}
                  {currentTrackingOrder.cgst !== undefined && (
                    <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                      <span>CGST</span>
                      <span>${currentTrackingOrder.cgst.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Total Paid</span>
                    <span>${(currentTrackingOrder.totalAmount || currentTrackingOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

                </>
              ) : (
                <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-6 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-6">
                  <div className="text-center pb-4 border-b border-rose-500/10 dark:border-slate-800">
                    <div className="inline-flex w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 items-center justify-center mb-3">
                      {currentTrackingOrder.status.toUpperCase() === OrderStatus.DELIVERED ? <Check className="w-6 h-6 text-emerald-500" /> : <X className="w-6 h-6 text-red-500" />}
                    </div>
                    <h2 className="text-2xl font-black mb-1 capitalize">{currentTrackingOrder.status.toUpperCase() === OrderStatus.DELIVERED ? 'Order Delivered' : 'Order ' + currentTrackingOrder.status.replace(/_/g, ' ')}</h2>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">#{currentTrackingOrder.id.substring(0, 8)}</p>
                    
                    {/* Invoice Details */}
                    <div className="mt-4 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {currentTrackingOrder.restaurantName && (
                        <div className="flex justify-between">
                          <span>Restaurant</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{currentTrackingOrder.restaurantName}</span>
                        </div>
                      )}
                      {currentTrackingOrder.createdAt && (
                        <div className="flex justify-between">
                          <span>Date</span>
                          <span className="text-slate-700 dark:text-slate-300 font-mono">{new Date(currentTrackingOrder.createdAt).toLocaleString()}</span>
                        </div>
                      )}
                      {currentTrackingOrder.deliveryAddress && (
                        <div className="flex justify-between mt-2 pt-2 border-t border-rose-500/10 dark:border-slate-700/50">
                          <span>Delivery To</span>
                          <span className="text-slate-700 dark:text-slate-300 text-right max-w-[200px] leading-tight truncate">{currentTrackingOrder.deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-[#f0ede6]">{currentTrackingOrder.restaurantName}</h3>
                    <div className="space-y-3">
                      {currentTrackingOrder.items && currentTrackingOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <span>{item.quantity || 1}x {item.item?.name || item.name || 'Item'}</span>
                          <span>${((item.item?.price || item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-dashed border-rose-500/20 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                        <span>Items Total</span>
                        <span>${currentTrackingOrder.items ? currentTrackingOrder.items.reduce((sum: number, item: any) => sum + ((item.item?.price || item.price || 0) * (item.quantity || 1)), 0).toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                        <span>Delivery Fee</span>
                        <span>${currentTrackingOrder.deliveryFee !== undefined ? currentTrackingOrder.deliveryFee.toFixed(2) : (currentTrackingOrder.items ? ((currentTrackingOrder.totalAmount || currentTrackingOrder.total || 0) - currentTrackingOrder.items.reduce((sum: number, item: any) => sum + ((item.item?.price || item.price || 0) * (item.quantity || 1)), 0)).toFixed(2) : '0.00')}</span>
                      </div>
                      {currentTrackingOrder.sgst !== undefined && (
                        <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                          <span>SGST</span>
                          <span>${currentTrackingOrder.sgst.toFixed(2)}</span>
                        </div>
                      )}
                      {currentTrackingOrder.cgst !== undefined && (
                        <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                          <span>CGST</span>
                          <span>${currentTrackingOrder.cgst.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-rose-500/20 dark:border-slate-700">
                        <span>{isFailedOrder(currentTrackingOrder.status) ? 'Total Refunded' : 'Total Paid'}</span>
                        <span className={isFailedOrder(currentTrackingOrder.status) ? 'text-red-500' : ''}>${(currentTrackingOrder.totalAmount || currentTrackingOrder.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick action / note */}
              <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-center">
                <p className="text-xs text-amber-500 leading-relaxed">
                  👉 <strong>How to complete?</strong> You can switch roles from the top menu, navigate to the <strong>Restaurant View</strong> to accept/cook, then to the <strong>Delivery Partner View</strong> to navigate and insert the OTP!
                </p>
              </div>
            </motion.div>
          )
        ) : selectedRestaurant ? (
          /* ------------------- RESTAURANT DETAIL & MENU ------------------- */
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

              {isDeliveryAvailable === false && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm">
                  <MapPinOff className="w-5 h-5 shrink-0" />
                  <span>Out of Serviceable Area</span>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-300 font-mono">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {selectedRestaurant.deliveryTime} mins</span>
                <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-emerald-500" /> ${selectedRestaurant.deliveryFee} Delivery</span>
                <span>•</span>
                <span>{selectedRestaurant.distance} km away</span>
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
                    <span>{selectedRestaurant.name} ({selectedRestaurant.distance} km away)</span>
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
                  const cat = dish.categoryName || 'Food';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(dish);
                  return acc;
                }, {} as Record<string, MenuItem[]>)).map(([category, dishes]) => (
                  <div key={category} className="space-y-4">
                    <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-300 uppercase tracking-widest">{category}</h5>
                    <div className="space-y-4">
                      {(dishes as any[]).map(dish => {
                        const cartQty = cart.find(i => i.item.id === dish.id)?.quantity || 0;
                        
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
                                  <span className="text-base font-black text-amber-500">${dish.price}</span>
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
                                      onClick={() => removeFromCart(dish.id)}
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
        ) : (
          /* ------------------- MAIN RESTAURANT FEED ------------------- */
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 space-y-6"
          >
            {/* Promo banner */}
            <div className="bg-gradient-to-r from-orange-500/90 to-amber-500/90 border border-white/25 backdrop-blur-md text-white p-5 rounded-3xl relative overflow-hidden shadow-lg shadow-orange-500/10">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle,_transparent_30%,_rgba(0,0,0,0.1)_70%)] pointer-events-none" />
              <div className="relative z-10 space-y-2 max-w-[240px]">
                <span className="text-[9px] uppercase font-bold tracking-wider bg-white/30 text-white px-2 py-0.5 rounded-full border border-white/20">FLAT 50% OFF</span>
                <h3 className="text-xl font-black tracking-tight leading-none text-white">Craving pizza or juicy burgers?</h3>
                <p className="text-xs text-orange-50 font-semibold">Free delivery on your first three gourmet meals.</p>
              </div>
            </div>

            {/* Categories Selector */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm tracking-wide text-slate-400 dark:text-slate-300 uppercase font-mono">Filter by Cravings</h4>
              <div className="flex overflow-x-auto scrollbar-none gap-2 pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                      (cat === 'All' && !selectedCategory) || selectedCategory === cat
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-transparent text-white shadow-md shadow-orange-500/15'
                        : 'bg-white/20 dark:bg-white/5 backdrop-blur-sm border-rose-500/20 dark:border-rose-500/30 text-slate-500 dark:text-[#f0ede6] hover:border-orange-500/30 dark:hover:border-orange-500/50 hover:bg-white/20 dark:hover:bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="sticky top-[69px] z-20 flex items-center bg-white/20 dark:bg-white/5 border border-rose-500/20 dark:border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/20 dark:hover:bg-white/10 focus-within:bg-white/20 dark:focus-within:bg-white/10 backdrop-blur-md rounded-[2rem] px-4 py-3 focus-within:border-orange-500/50 dark:focus-within:border-orange-500/50 transition-all hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all">
              <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-300 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search restaurants, dishes, cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm outline-none w-full text-slate-800 dark:text-[#f0ede6] placeholder-slate-400"
              />
            </div>

            {/* Restaurants Feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Premium Kitchens</h4>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-300">{filteredRestaurants.length} open</span>
              </div>

              {restaurants.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 rounded-3xl bg-white/5 backdrop-blur-sm">
                  <div className="flex justify-center mb-4">
                    <MapPinOff className="w-12 h-12 text-rose-500/50" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-[#f0ede6] mb-2">Out of Range</h3>
                  <p className="text-sm">We don't have any partner kitchens in your delivery area yet.</p>
                  <button 
                    onClick={() => setIsAddressSelectorOpen(true)}
                    className="mt-4 px-4 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors"
                  >
                    Change Address
                  </button>
                </div>
              ) : isRestaurantsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-64 rounded-3xl bg-white/20 dark:bg-slate-900/45 border border-rose-500/20 dark:border-rose-500/30 p-4 animate-pulse flex flex-col justify-between">
                      <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
                      <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl mb-2" />
                      <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 rounded-3xl bg-white/5 backdrop-blur-sm">
                  <div className="flex justify-center mb-4">
                    <AlertCircle className="w-12 h-12 text-rose-500/50" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-[#f0ede6] mb-2">No Kitchens Found</h3>
                  <p className="text-sm">We couldn't find any kitchens matching your search criteria.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                    className="mt-4 px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-500/20 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
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
          )}
        </AnimatePresence>
      )}


      <CompleteProfileModal
        isOpen={showProfileModal}
        theme={theme}
        profileId=""
        onComplete={(p) => {
          setShowProfileModal(false);
          setEditName(p.name);
          setEditEmail(p.email);
          // Assuming App.tsx passes down some handlers, but we can just dismiss the modal here.
        }}
      />

      {/* Floating Active Orders Slider at bottom */}
      <CustomerActiveOrdersCarousel
        activeOrders={activeOrders}
        isActiveOrder={isActiveOrder}
        trackingOrder={trackingOrder}
        cartLength={cart.length}
        selectedRestaurantId={selectedRestaurant?.id}
        cartRestaurantId={cartRestaurant?.id}
        setTrackingOrder={setTrackingOrder}
      />

      {/* Floating Cart bar at bottom */}
      {cart.length > 0 && (!selectedRestaurant || cartRestaurant?.id === selectedRestaurant.id) && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-[380px] mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold hover:brightness-110 cursor-pointer active:scale-[0.98] transition-all border border-white/20"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{cart.reduce((a, b) => a + b.quantity, 0)} Items Added</span>
            </div>
            <div className="flex items-center gap-1">
              <span>View Cart (${getCartTotal().total?.toFixed(2)})</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Address Selector Modal */}
      <AnimatePresence>
        {isAddressSelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setIsAddressSelectorOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/20 dark:bg-slate-900/20 backdrop-blur-md z-10 sticky top-0">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Select Delivery Location</h2>
                <button onClick={() => setIsAddressSelectorOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto space-y-3 pb-8">
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        try {
                          const apiKey = (import.meta as any).env.VITE_OLA_MAPS_API_KEY || '';
                          const res = await fetch(`https://api.olamaps.io/places/v1/reverse-geocode?latlng=${pos.coords.latitude},${pos.coords.longitude}&api_key=${apiKey}`);
                          const data = await res.json();
                          if (data.results && data.results.length > 0) {
                            setAddress(`Current Location: ${data.results[0].formatted_address}`);
                          } else {
                            setAddress('Current Location');
                          }
                          setDeliveryLat(pos.coords.latitude);
                          setDeliveryLng(pos.coords.longitude);
                          setDeliveryAddressId('');
                          setIsAddressSelectorOpen(false);
                        } catch (e) {
                          setAddress('Current Location');
                          setDeliveryLat(pos.coords.latitude);
                          setDeliveryLng(pos.coords.longitude);
                          setDeliveryAddressId('');
                          setIsAddressSelectorOpen(false);
                        }
                      }, (err) => {
                        if (err.code === err.PERMISSION_DENIED) {
                          setIsAddressSelectorOpen(false);
                          setShowLocationPrompt(true);
                        }
                      });
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors text-left cursor-pointer"
                >
                  <Navigation className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">Use Current Location</p>
                    <p className="text-xs text-indigo-500/80 dark:text-indigo-400/80">Using GPS</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddressSelectorOpen(false);
                    setView('settings');
                    setSettingsTab('addresses');
                    setIsAddressModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/10 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors text-left cursor-pointer"
                >
                  <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <p className="font-bold text-rose-600 dark:text-rose-400">Add New Address</p>
                    <p className="text-xs text-rose-500/80 dark:text-rose-400/80">Search or pick from map</p>
                  </div>
                </button>
                
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 px-1 uppercase tracking-wider">Saved Addresses</p>
                  {savedAddresses.length > 0 ? (
                    <div className="space-y-2">
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          onClick={() => {
                            setAddress(`${addr.label}: ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}`);
                            if (addr.latitude !== undefined && addr.longitude !== undefined) {
                              setDeliveryLat(addr.latitude);
                              setDeliveryLng(addr.longitude);
                            }
                            setDeliveryAddressId(addr.id);
                            setIsAddressSelectorOpen(false);
                          }}
                          className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left group cursor-pointer"
                        >
                          <MapPin className="w-5 h-5 text-slate-400 mt-0.5 group-hover:text-rose-500 transition-colors shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{addr.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                              {addr.addressLine1}{addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, {addr.city}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 px-1">No saved addresses found.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outlet Selector Modal */}
      <AnimatePresence>
        {isOutletSelectorOpen && brandOutlets && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setIsOutletSelectorOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/20 dark:bg-slate-900/20 backdrop-blur-md z-10 sticky top-0">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Select Outlet Location</h2>
                <button onClick={() => setIsOutletSelectorOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto space-y-3 pb-8">
                {brandOutlets.map(outlet => (
                  <button
                    key={outlet.id}
                    onClick={() => {
                      setSelectedRestaurant(outlet);
                      if (onAddApiLog) {
                        onAddApiLog({ id: 'catalog', label: `GET /api/v1/restaurants/${outlet.id}/catalog/items`, method: 'GET' });
                      }
                      setIsOutletSelectorOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left cursor-pointer ${
                      selectedRestaurant?.id === outlet.id
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-500/10'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-sm ${selectedRestaurant?.id === outlet.id ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {outlet.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {outlet.distance} km away
                      </p>
                    </div>
                    {selectedRestaurant?.id === outlet.id && (
                      <Check className="w-5 h-5 text-rose-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomerCartDrawer
        address={address}
        setAddress={setAddress}
        handleCheckout={handleCheckout} 
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        selectedRestaurant={selectedRestaurant}
        cart={cart}
        removeFromCart={removeFromCart}
        addToCart={addToCart}
        getCartTotal={getCartTotal}
        restaurantName={(cartRestaurant || selectedRestaurant)?.name || ''}
        restaurantId={(cartRestaurant || selectedRestaurant)?.id || ''}
        subtotal={getCartTotal().subtotal}
        deliveryFee={getCartTotal().deliveryFee}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        isSubmitting={paymentStatus !== 'idle'}
      />

      <CustomerPaymentModal
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        paymentStatus={paymentStatus}
        getCartTotal={getCartTotal}
        processPaymentAndOrder={processPaymentAndOrder}
      />

      <AnimatePresence>
        {showLocationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinOff className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Location Required</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Please enable location permissions in your browser settings to automatically find your address.
              </p>
              <button
                onClick={() => setShowLocationPrompt(false)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
