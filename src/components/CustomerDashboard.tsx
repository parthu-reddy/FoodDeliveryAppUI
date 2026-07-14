import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, ShoppingBag, LogOut, ChevronRight, Star, Clock, 
  Bike, Plus, Minus, X, Check, Timer, ArrowLeft, ShieldCheck, Heart, Store, Sun, Moon,
  Terminal, Sliders, Code, Send, RefreshCw, Package, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Restaurant, MenuItem, CartItem, Order, OrderStatus } from '../types';
import { apiGet, apiPost } from '../lib/apiClient';
import { getUserProfile } from '../lib/authStore';
import LaBouffeLogo from './LaBouffeLogo';
import { getEffectiveMenu } from '../lib/menuStore';
import ImageLoader from './ImageLoader';

import CustomerCartDrawer from './CustomerCartDrawer';
import SharedSettingsView from './SharedSettingsView';
import CustomerAddressModal from './CustomerAddressModal';
import CustomerPaymentModal from './CustomerPaymentModal';
import CompleteProfileModal from './CompleteProfileModal';


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
  const [effectiveMenu, setEffectiveMenu] = useState<MenuItem[]>([]);
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // Fetch active orders and nearby restaurants
  useEffect(() => {
    const profile = getUserProfile();
    if (profile && profile.role === 'customer') {
      // Always fetch backend profile first to check completeness
      apiGet(`/api/v1/users/profile`)
        .then(res => {
          if (res.data) {
            const p = res.data;
            if (p.name) setEditName(p.name);
            if (p.email) setEditEmail(p.email);
            if (!p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
              setShowProfileModal(true);
            }
          }
        })
        .catch(console.error);

      // We still need orders and addresses if profile is active
      apiGet(`/api/v1/orders`)
        .then(res => {
          if (res.data) setInternalOrders(res.data);
        })
        .catch(console.error);
        
      // Fetch addresses - actually they need ID, wait, API gateway handles X-User-Id. 
      // But previous code was `/api/v1/customers/${profile.id}/addresses`.
      // Let's keep it as it was if authStore somehow had id, or use the sub/phone.
      // Wait, profile.id is undefined from authStore. Let's just fetch without id if gateway handles it?
      // Actually `apiGet('/api/v1/customers/addresses')` is standard. Let's stick to the old code for addresses to not break it:
      if (profile.id) {
        apiGet(`/api/v1/customers/${profile.id}/addresses`)
          .then(res => {
            if (res.data) setSavedAddresses(res.data);
          })
          .catch(console.error);
      }
    }

    apiGet(`/api/v1/restaurants/nearby?lat=12.97&lng=77.59&radius=5.0`)
      .then(res => {
        if (res.data) setRestaurants(res.data);
      })
      .catch(console.error);
  }, []);

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
    if (selectedRestaurant) {
      getEffectiveMenu(selectedRestaurant.id).then(menu => {
        setEffectiveMenu(menu);
      });
    } else {
      setEffectiveMenu([]);
    }
  }, [selectedRestaurant]);


  useEffect(() => {
    if (onAddApiLog) {
      onAddApiLog({ id: 'nearby', label: 'GET /api/v1/restaurants/nearby', method: 'GET' });
    }
  }, []);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [address, setAddress] = useState('Flat 402, Highrise Apartments, Sector 62');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [accountTab, setAccountTab] = useState<"profile" | "orders" | "addresses">("profile");
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState(userPhone);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  // States for API Interactive Playground
  const [isApiPlaygroundOpen, setIsApiPlaygroundOpen] = useState(false);
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'address' | 'availability' | 'nearby' | 'tracking' | 'delay'>('address');
  
  const [apiAddrLabel, setApiAddrLabel] = useState('Home');
  const [apiAddrLine1, setApiAddrLine1] = useState('123 Main St');
  const [apiAddrLine2, setApiAddrLine2] = useState('Apt 4B');
  const [apiCity, setApiCity] = useState('Bangalore');
  const [apiState, setApiState] = useState('KA');
  const [apiZipCode, setApiZipCode] = useState('560001');
  const [apiAddrLat, setApiAddrLat] = useState('12.9716');
  const [apiAddrLng, setApiAddrLng] = useState('77.5946');

  const [apiAvailRest, setApiAvailRest] = useState('22222222-2222-2222-2222-222222222222');
  const [apiAvailLat, setApiAvailLat] = useState('12.9716');
  const [apiAvailLng, setApiAvailLng] = useState('77.5946');

  const [apiNearLat, setApiNearLat] = useState('12.97');
  const [apiNearLng, setApiNearLng] = useState('77.59');
  const [apiNearRadius, setApiNearRadius] = useState('5.0');

  const [apiDelayOrderId, setApiDelayOrderId] = useState('55555555-5555-5555-5555-555555555555');
  const [apiDelayApproved, setApiDelayApproved] = useState('true');
  const [apiDelayMinutes, setApiDelayMinutes] = useState('15');

  const [apiTrackOrderId, setApiTrackOrderId] = useState('77777777-7777-7777-7777-777777777777');
  const [isSseActive, setIsSseActive] = useState(false);
  const [sseTicks, setSseTicks] = useState<any[]>([]);

  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [apiResponseHeaders, setApiResponseHeaders] = useState<any | null>(null);
  const [apiResponseStatus, setApiResponseStatus] = useState<number | null>(null);
  const [apiResponseEndpoint, setApiResponseEndpoint] = useState<string | null>(null);

  // Auto-initialize selected order for tracking/delay tabs when order is placed

  React.useEffect(() => {
    if (activeOrders.length > 0) {
      const latestId = activeOrders[activeOrders.length - 1].id;
      if (!apiDelayOrderId) setApiDelayOrderId(latestId);
      if (!apiTrackOrderId) setApiTrackOrderId(latestId);
    }
  }, [activeOrders]);

  // Handle SSE coordinate streaming ticks simulation

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSseActive && apiTrackOrderId) {
      let tickCount = 1;
      interval = setInterval(() => {
        const lat = 12.9716 + (Math.random() - 0.5) * 0.005;
        const lng = 77.5946 + (Math.random() - 0.5) * 0.005;
        const tick = {
          event: "gps_update",
          data: {
            orderId: apiTrackOrderId,
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lng.toFixed(6)),
            speedMps: parseFloat((5 + Math.random() * 5).toFixed(1)),
            tickIndex: tickCount
          },
          timestamp: new Date().toLocaleTimeString()
        };
        setSseTicks(prev => [...prev.slice(-4), tick]);
        tickCount++;
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSseActive, apiTrackOrderId]);

  const handleAddAddressApi = (e: React.FormEvent) => {
    e.preventDefault();
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'X-Device-Id': 'web-browser-user',
      'X-App-Version': '1.0.0',
      'Authorization': 'Bearer la-bouffe-jwt-token-customer'
    };
    const body = {
      label: apiAddrLabel,
      addressLine1: apiAddrLine1,
      addressLine2: apiAddrLine2,
      city: apiCity,
      state: apiState,
      zipCode: apiZipCode,
      latitude: parseFloat(apiAddrLat),
      longitude: parseFloat(apiAddrLng)
    };
    const responseBody = {
      success: true,
      message: "Customer address registered successfully.",
      data: {
        id: 'addr-' + Math.floor(Math.random() * 9000 + 1000),
        customerId: "cust-alex-9821",
        ...body,
        isDefault: true,
        createdAt: new Date().toISOString()
      }
    };
    setApiResponseStatus(201);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/customers/cust-alex-9821/addresses`);
    setAddress(`${apiAddrLabel}: ${apiAddrLine1}, ${apiCity}`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/customers/cust-alex-9821/addresses`,
        headers,
        payload: body,
        response: responseBody,
        status: 201,
        duration: Math.floor(95 + Math.random() * 45),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleCheckAvailabilityApi = (e: React.FormEvent) => {
    e.preventDefault();
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'X-Request-Id': requestId,
      'X-Device-Id': 'web-browser-user',
      'X-App-Version': '1.0.0'
    };
    const responseBody = {
      success: true,
      data: {
        restaurantId: apiAvailRest,
        available: true,
        deliveryFeasibility: {
          deliverable: true,
          distanceKm: 3.4,
          estimatedTimeMinutes: 22,
          deliveryFee: 3.99,
          reason: "Within operational radius and dispatch capacity."
        }
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`GET /api/v1/restaurants/${apiAvailRest}/delivery-availability?lat=${apiAvailLat}&lng=${apiAvailLng}`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'GET',
        endpoint: `/api/v1/restaurants/${apiAvailRest}/delivery-availability?lat=${apiAvailLat}&lng=${apiAvailLng}`,
        headers,
        response: responseBody,
        status: 200,
        duration: Math.floor(60 + Math.random() * 30),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleNearbyRestaurantsApi = (e: React.FormEvent) => {
    e.preventDefault();
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'X-Request-Id': requestId,
      'X-Device-Id': 'web-browser-user'
    };
    const responseBody = {
      success: true,
      message: "Fetched restaurants in nearby radius.",
      data: [
        { id: "11111111-1111-1111-1111-111111111111", name: "Burger Bistro & Fries", distanceKm: 1.2, rating: 4.6, deliveryTime: 18 },
        { id: "22222222-2222-2222-2222-222222222222", name: "Local Pizzeria", distanceKm: 2.4, rating: 4.8, deliveryTime: 25 },
        { id: "33333333-3333-3333-3333-333333333333", name: "Sushi Sakurako Premium", distanceKm: 3.7, rating: 4.9, deliveryTime: 30 }
      ]
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`GET /api/v1/restaurants/nearby?lat=${apiNearLat}&lng=${apiNearLng}&radius=${apiNearRadius}`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'GET',
        endpoint: `/api/v1/restaurants/nearby?lat=${apiNearLat}&lng=${apiNearLng}&radius=${apiNearRadius}`,
        headers,
        response: responseBody,
        status: 200,
        duration: Math.floor(110 + Math.random() * 40),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleToggleSse = () => {
    if (isSseActive) {
      setIsSseActive(false);
      setSseTicks([]);
      return;
    }
    if (!apiTrackOrderId) {
      alert("Please select or place an order first!");
      return;
    }
    setIsSseActive(true);
    setSseTicks([
      { event: "connection_established", message: "SSE Connection opened with Gateway API", timestamp: new Date().toLocaleTimeString() }
    ]);
    
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = { 'Accept': 'text/event-stream', 'X-Request-Id': requestId };
    const responseBody = { event: "connected", streamUrl: `/api/v1/orders/${apiTrackOrderId}/live-tracking` };

    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`GET /api/v1/orders/${apiTrackOrderId}/live-tracking`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'SSE',
        endpoint: `/api/v1/orders/${apiTrackOrderId}/live-tracking`,
        headers,
        response: responseBody,
        status: 200,
        duration: 0,
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleDelayApprovalApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiDelayOrderId) {
      alert("Please select an active order to approve delay!");
      return;
    }
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'Authorization': 'Bearer la-bouffe-jwt-token-customer'
    };
    const body = {
      approved: apiDelayApproved === 'true',
      expectedDelayMinutes: parseInt(apiDelayMinutes)
    };
    const responseBody = {
      success: true,
      message: `Delay compensation of $2.00 voucher dispatched. Customer choice: ${apiDelayApproved === 'true' ? 'APPROVED' : 'REJECTED'}.`,
      data: {
        orderId: apiDelayOrderId,
        status: "PROCESSING_WITH_DELAY",
        compensated: true,
        voucherCode: "COMP-DELAY-2USD"
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/orders/${apiDelayOrderId}/delay-approval`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/orders/${apiDelayOrderId}/delay-approval`,
        headers,
        payload: body,
        response: responseBody,
        status: 200,
        duration: Math.floor(80 + Math.random() * 25),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  // If there's an active order, let's keep checking its status in the parent
  const currentTrackingOrder = activeOrders.find(o => o.id === trackingOrder?.id) || trackingOrder;


  useEffect(() => {
    if (currentTrackingOrder && (currentTrackingOrder.status === 'dispatched' || currentTrackingOrder.status === 'picked_up')) {
      if (onAddApiLog) {
        onAddApiLog({ id: 'live_tracking', label: `GET /api/v1/orders/${currentTrackingOrder.id}/live-tracking (SSE)`, method: 'GET' });
      }
    }
  }, [currentTrackingOrder?.status]);

  // Categories
  const categories = ['All', 'Burgers', 'Pizza', 'Sushi', 'Salads', 'Desserts'];

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || 
                            restaurant.tags.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
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
      return prev.filter(i => i.item.id !== itemId);
    });
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
    const deliveryFee = selectedRestaurant ? selectedRestaurant.deliveryFee : 0;
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    };
  };

  const handleCheckout = async () => {
    if (!selectedRestaurant || cart.length === 0) return;
    
    // Delivery Availability Check
    try {
      const availRes = await apiGet(`/api/v1/restaurants/${selectedRestaurant.id}/delivery-availability?lat=12.97&lng=77.59`);
      if (availRes.data && availRes.data.available === false) {
        alert("This restaurant is currently out of your delivery zone.");
        return;
      }
      if (onAddApiLog) {
        onAddApiLog({ id: 'delivery_avail', label: `GET /api/v1/restaurants/${selectedRestaurant.id}/delivery-availability`, method: 'GET' });
      }
    } catch(e) {
      console.warn("Availability check failed, proceeding anyway", e);
    }

    if (onAddApiLog) {
      onAddApiLog({ id: 'menu_batch', label: `GET /api/v1/restaurants/${selectedRestaurant.id}/menu/batch`, method: 'GET' });
    }

    setPaymentStatus('idle');
    setIsPaymentModalOpen(true);
  };

  const processPaymentAndOrder = async () => {
    if (!selectedRestaurant || cart.length === 0) return;
    
    setPaymentStatus('processing');
    
    if (onAddApiLog) {
      onAddApiLog({ id: 'create_order', label: 'POST /api/v1/orders', method: 'POST' });
    }

    try {
      const items = cart.map(i => ({ menuItemId: i.item.id, quantity: i.quantity }));
      const profile = getUserProfile();
      
      const orderPayload = {
        customerId: profile?.id,
        restaurantId: selectedRestaurant.id,
        // Since we don't have a real address ID in the simple frontend flow, we pass a dummy UUID 
        // assuming the backend validates it if it enforces FK. Wait, customerId is in token.
        deliveryAddressId: "00000000-0000-0000-0000-000000000001",
        items
      };
      
      const res = await apiPost('/api/v1/orders', orderPayload);
      
      setPaymentStatus('success');
      setTimeout(() => {
        if (res.data) {
          onPlaceOrder(res.data);
          setTrackingOrder(res.data);
        }
        setCart([]);
        setIsCartOpen(false);
        setIsPaymentModalOpen(false);
        setSelectedRestaurant(null);
      }, 800);
    } catch (err) {
      console.error(err);
      setPaymentStatus('idle');
      alert("Failed to create order");
    }
  };

  // Get stage index for order tracking
  const getStatusIndex = (status: OrderStatus) => {
    const statuses: OrderStatus[] = ['placed', 'accepted', 'preparing', 'dispatched', 'picked_up', 'delivered'];
    return statuses.indexOf(status);
  };

  // Simulated GPS Path Coordinate (translating step status to percentage of route progress)
  const getDeliveryProgress = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 5;
      case 'accepted': return 20;
      case 'preparing': return 40;
      case 'dispatched': return 60;
      case 'picked_up': return 80;
      case 'delivered': return 100;
      default: return 0;
    }
  };



  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
      
      {/* 1. Header Area */}
      <header className="sticky top-0 bg-white/40 dark:bg-white/5 backdrop-blur-xl px-5 py-3 flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
        <div className="flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8 shrink-0" textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs" subColorClass="text-rose-500 text-[8px]" />
          <div className="flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />
          <button 
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-center gap-2 min-w-0 flex-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 p-1.5 -ml-1.5 rounded-2xl transition-colors cursor-pointer text-left"
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
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
            title="Account Info"
            onClick={() => setView('settings')}
          >
            <User className="w-4 h-4" />
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
          activeOrders={activeOrders}
          setTrackingOrder={(order) => {
             setTrackingOrder(order);
             setView('home');
          }}
          savedAddresses={savedAddresses}
          setIsAddressModalOpen={setIsAddressModalOpen}
          onAddApiLog={onAddApiLog}
          onLogout={onLogout}
        />
      ) : (
        <AnimatePresence mode="wait">
        {currentTrackingOrder && activeOrders.some(o => o.id === currentTrackingOrder.id) ? (
          currentTrackingOrder.status === 'delivered' ? (
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

              <div className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-3xl">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-rose-500/10">
                  <span className="font-bold text-slate-800 dark:text-[#f0ede6]">Digital Invoice</span>
                  <span className="text-xs font-mono text-slate-500">#{currentTrackingOrder.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="space-y-3 mb-6">
                  {currentTrackingOrder.items.map(item => (
                    <div key={item.item.id} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>{item.quantity}x {item.item.name}</span>
                      <span>${(item.item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span>Delivery Fee</span>
                    <span>${currentTrackingOrder.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 dark:text-[#f0ede6] pt-2">
                    <span>Total Paid</span>
                    <span>${currentTrackingOrder.total.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => alert('Invoice downloaded successfully!')}
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
                  Order Tracking
                  {activeOrders.filter(o => o.status !== 'delivered').length > 1 ? (
                    <select
                      className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-500 dark:text-slate-300 border-none outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-semibold hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
                      value={currentTrackingOrder.id}
                      onChange={(e) => {
                        const order = activeOrders.find((o) => o.id === e.target.value);
                        if (order) setTrackingOrder(order);
                      }}
                    >
                      {activeOrders.filter(o => o.status !== 'delivered').map((o) => (
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

              {/* Immersive Delivery map (Vector path simulation) */}
              <div className="relative w-full h-44 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl overflow-hidden shadow-inner">
                {/* Grids and elements resembling maps */}
                <div className="absolute inset-0 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                
                {/* SSE Live Tracking Indicator */}
                {(currentTrackingOrder.status === 'dispatched' || currentTrackingOrder.status === 'picked_up') && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full backdrop-blur-md z-10 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold font-mono tracking-wider">LIVE GPS (SSE)</span>
                  </div>
                )}

                {/* Animated Map Line/Road */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path 
                    d="M 15 50 Q 50 20 85 50" 
                    fill="none" 
                    stroke="#334155" 
                    strokeWidth="2" 
                    strokeDasharray="4 4"
                  />
                  <path 
                    d="M 15 50 Q 50 20 85 50" 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="2" 
                    strokeDasharray="100"
                    strokeDashoffset={100 - getDeliveryProgress(currentTrackingOrder.status)}
                    className="transition-all duration-1000 ease-in-out"
                  />
                </svg>

                {/* Restaurant Node */}
                <div className="absolute left-[15%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-amber-500 flex items-center justify-center shadow-lg">
                    <Store className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-[9px] font-bold mt-1 max-w-[80px] text-center truncate">{currentTrackingOrder.restaurantName}</span>
                </div>

                {/* Customer Node */}
                <div className="absolute right-[15%] top-[50%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500 flex items-center justify-center shadow-lg">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-[9px] font-bold mt-1">Your Home</span>
                </div>

                {/* Moving Rider on Path */}
                <div 
                  className="absolute transition-all duration-1000 ease-in-out flex flex-col items-center"
                  style={{
                    left: `${15 + (70 * getDeliveryProgress(currentTrackingOrder.status)) / 100}%`,
                    top: `${50 - Math.sin((getDeliveryProgress(currentTrackingOrder.status) / 100) * Math.PI) * 20}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="bg-amber-500 text-slate-950 p-2 rounded-full shadow-lg ring-4 ring-amber-500/20 animate-bounce">
                    <Bike className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] bg-slate-950 text-amber-400 font-mono px-1 rounded border border-rose-500/30 mt-1">Rider</span>
                </div>
              </div>

              {/* Active Status Display Card */}
              <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">
                      {currentTrackingOrder.status === 'placed' && 'Waiting for Restaurant...'}
                      {currentTrackingOrder.status === 'on_hold' && 'Restaurant Requested Delay'}
                      {currentTrackingOrder.status === 'accepted' && 'Order Confirmed!'}
                      {currentTrackingOrder.status === 'preparing' && 'Kitchen is Cooking...'}
                      {currentTrackingOrder.status === 'dispatched' && 'Waiting for Rider Pickup...'}
                      {currentTrackingOrder.status === 'picked_up' && 'Rider is on the Way!'}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-300">
                      {currentTrackingOrder.status === 'on_hold' 
                        ? 'The restaurant is experiencing high volume and needs more time. Do you wish to continue?'
                        : 'Estimated delivery: 15-20 mins'}
                    </p>
                  </div>
                  <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-2xl">
                    {currentTrackingOrder.status === 'on_hold' ? <Clock className="w-5 h-5 text-red-500" /> : <Timer className="w-5 h-5" />}
                  </div>
                </div>

                {currentTrackingOrder.status === 'on_hold' && (
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
                          if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, 'accepted');
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
                          onAddApiLog({ id: 'order_cancel_delay', label: `POST /api/v1/orders/${currentTrackingOrder.id}/delay-approval`, method: 'POST' });
                        }
                        
                        try {
                          await apiPost(`/api/v1/orders/${currentTrackingOrder.id}/delay-approval`, {
                            approved: false,
                            expectedDelayMinutes: 15
                          });
                          if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, 'cancelled');
                          setTrackingOrder(null);
                        } catch (e) {
                          console.error("Failed to reject delay", e);
                        }
                      }}
                      className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-[#f0ede6] rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors border border-rose-500/30 dark:border-rose-500/30"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {/* OTP Code Card */}
                {currentTrackingOrder.status !== 'on_hold' && (
                  <div className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex items-center justify-between">
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
                <div className="space-y-3 pt-2">
                  {[
                    { status: 'placed', label: 'Order Received' },
                    { status: 'accepted', label: 'Accepted by Kitchen' },
                    { status: 'preparing', label: 'Cooking & Packaging' },
                    { status: 'picked_up', label: 'Picked up by Delivery Executive' },
                    { status: 'delivered', label: 'Handed Over & Verified' },
                  ].map((step, idx) => {
                    const isDone = getStatusIndex(currentTrackingOrder.status) >= getStatusIndex(step.status as OrderStatus);
                    const isCurrent = currentTrackingOrder.status === step.status;
                    
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                            : 'border-rose-500/30 dark:border-rose-500/30 text-slate-400 dark:text-slate-300'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span className={`text-sm ${isDone ? 'font-semibold text-slate-800 dark:text-[#f0ede6]' : 'text-slate-400 dark:text-slate-300'} ${isCurrent ? 'text-amber-500 font-bold' : ''}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

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
                className="absolute top-4 left-4 p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-sm cursor-pointer border border-rose-500/30"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Restaurant Info Panel */}
            <div className="p-5 border-b border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md space-y-3">
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

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-300 font-mono">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {selectedRestaurant.deliveryTime} mins</span>
                <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-emerald-500" /> ${selectedRestaurant.deliveryFee} Delivery</span>
                <span>•</span>
                <span>{selectedRestaurant.distance} km away</span>
              </div>
            </div>

            {/* Dishes Menu List */}
            <div className="p-5 space-y-4">
              <h4 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Menu items</h4>
              
              <div className="space-y-4">
                {effectiveMenu.map(dish => {
                  const cartQty = cart.find(i => i.item.id === dish.id)?.quantity || 0;
                  
                  return (
                    <div 
                      key={dish.id}
                      className="bg-white/40 dark:bg-white/5 border border-rose-500/20 dark:border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/60 dark:hover:bg-white/10 hover:border-orange-400/30 dark:hover:border-orange-500/50 hover:shadow-[0_8px_30px_rgb(249,115,22,0.1)] dark:hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] backdrop-blur-md rounded-[2rem] p-4 flex gap-4 transition-all duration-300 relative text-left hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
                    >
                      <div className="w-20 h-20 rounded-xl bg-transparent overflow-hidden shrink-0">
                        <ImageLoader 
                          src={dish.image} 
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
                          <span className="text-base font-black text-amber-500">${dish.price}</span>
                          
                          {dish.isAvailable === false ? (
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-200/20">
                              Out of Stock
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
                              className="px-4 py-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-rose-500/20 dark:border-rose-500/30 hover:border-orange-500 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
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
                        : 'bg-white/40 dark:bg-white/5 backdrop-blur-sm border-rose-500/20 dark:border-rose-500/30 text-slate-500 dark:text-[#f0ede6] hover:border-orange-500/30 dark:hover:border-orange-500/50 hover:bg-white/60 dark:hover:bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="sticky top-[69px] z-20 flex items-center bg-white/40 dark:bg-white/5 border border-rose-500/20 dark:border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/60 dark:hover:bg-white/10 focus-within:bg-white/60 dark:focus-within:bg-white/10 backdrop-blur-md rounded-[2rem] px-4 py-3 focus-within:border-orange-500/50 dark:focus-within:border-orange-500/50 transition-all hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all">
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

              {filteredRestaurants.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 rounded-3xl">
                  <p className="text-sm">No kitchens matched your search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRestaurants.map(restaurant => (
                    <div
                      key={restaurant.id}
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        if (onAddApiLog) {
                          onAddApiLog({ id: 'delivery_check', label: `GET /api/v1/restaurants/${restaurant.id}/delivery-availability`, method: 'GET' });
                          onAddApiLog({ id: 'catalog', label: `GET /api/v1/restaurants/${restaurant.id}/catalog/items`, method: 'GET' });
                        }
                      }}
                      className="group flex flex-col rounded-3xl transition-all duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 bg-white/12 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all dark:bg-slate-900/40 dark:hover:bg-slate-900/60 dark:border-rose-500/30 dark:shadow-[0_15px_35px_rgba(0,0,0,0.35)]  text-left"
                    >
                      <div className="h-44 w-full relative overflow-hidden bg-transparent">
                        <ImageLoader
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          containerClassName="w-full h-full"
                        />
                        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-sm p-1.5 rounded-full text-white/80 hover:text-red-500 border border-rose-500/30">
                          <Heart className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="p-4.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-base text-slate-900 dark:text-[#f0ede6] group-hover:text-amber-500 transition-colors">{restaurant.name}</h5>
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
                  ))}
                </div>
              )}

              {/* CUSTOMER API INTERACTIVE PLAYGROUND */}
              <div className="mt-10 border border-rose-500/20 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-lg">
                <button
                  onClick={() => setIsApiPlaygroundOpen(!isApiPlaygroundOpen)}
                  className="w-full px-6 py-5 flex items-center justify-between font-black text-sm tracking-wide text-slate-800 dark:text-[#f0ede6] cursor-pointer hover:bg-slate-500/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <Terminal className="w-4.5 h-4.5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm flex items-center gap-2">
                        <span>Customer API Interactive Forms</span>
                        <span className="text-[9px] font-mono bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20">
                          LIVE GATEWAY
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-300 font-normal">Execute and monitor the Ecosystem Customer API references in real-time</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-300">
                    {isApiPlaygroundOpen ? 'COLLAPSE ▴' : 'EXPAND ▾'}
                  </span>
                </button>

                <AnimatePresence>
                  {isApiPlaygroundOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-rose-500/20 dark:border-rose-500/30 p-5 space-y-5"
                    >
                      {/* Tabs */}
                      <div className="flex flex-wrap gap-1.5 border-b border-rose-500/20 dark:border-rose-500/30 pb-3 text-xs font-bold">
                        {[
                          { id: 'address', label: 'Add Address', method: 'POST' },
                          { id: 'availability', label: 'Delivery Feasibility', method: 'GET' },
                          { id: 'nearby', label: 'Nearby Outlets', method: 'GET' },
                          { id: 'tracking', label: 'SSE Tracking', method: 'SSE' },
                          { id: 'delay', label: 'Delay Approval', method: 'POST' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setActivePlaygroundTab(t.id as any);
                              setApiResponse(null);
                            }}
                            className={`px-3 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-1.5 ${
                              activePlaygroundTab === t.id
                                ? 'bg-rose-500 border-transparent text-white shadow-sm shadow-rose-500/10 font-extrabold'
                                : 'bg-white/40 dark:bg-slate-950/45 border-rose-500/20 dark:border-rose-500/30 text-slate-400 dark:text-slate-300 hover:text-slate-200'
                            }`}
                          >
                            <span className={`text-[8px] font-mono font-black px-1 py-0.2 rounded ${
                              t.method === 'POST' ? 'bg-indigo-500/10 text-indigo-400' :
                              t.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {t.method}
                            </span>
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Playground Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        
                        {/* Form Inputs Panel (Left) */}
                        <div className="lg:col-span-6 space-y-4">
                          
                          {activePlaygroundTab === 'address' && (
                            <form onSubmit={handleAddAddressApi} className="space-y-3.5">
                              <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                                <strong>POST /api/v1/customers/&#123;id&#125;/addresses</strong>: Adds a new delivery coordinate location to the user's secure address book and updates current delivery session location.
                              </p>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Address Title</label>
                                  <input 
                                    type="text"
                                    value={apiAddrLabel}
                                    onChange={(e) => setApiAddrLabel(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500 focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Coordinate Lat/Lng</label>
                                  <div className="grid grid-cols-2 gap-1">
                                    <input 
                                      type="text"
                                      value={apiAddrLat}
                                      onChange={(e) => setApiAddrLat(e.target.value)}
                                      className="w-full px-2 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                                      required
                                    />
                                    <input 
                                      type="text"
                                      value={apiAddrLng}
                                      onChange={(e) => setApiAddrLng(e.target.value)}
                                      className="w-full px-2 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Address Line 1</label>
                                  <input 
                                    type="text"
                                    value={apiAddrLine1}
                                    onChange={(e) => setApiAddrLine1(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500 focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Address Line 2</label>
                                  <input 
                                    type="text"
                                    value={apiAddrLine2}
                                    onChange={(e) => setApiAddrLine2(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500 focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">City</label>
                                  <input 
                                    type="text"
                                    value={apiCity}
                                    onChange={(e) => setApiCity(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500 focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">State</label>
                                  <input 
                                    type="text"
                                    value={apiState}
                                    onChange={(e) => setApiState(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500 focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Zip Code</label>
                                  <input 
                                    type="text"
                                    value={apiZipCode}
                                    onChange={(e) => setApiZipCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500 focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                                    required
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-rose-500/10"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Register & Apply Address API</span>
                              </button>
                            </form>
                          )}

                          {activePlaygroundTab === 'availability' && (
                            <form onSubmit={handleCheckAvailabilityApi} className="space-y-3.5">
                              <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                                <strong>GET /api/v1/restaurants/&#123;id&#125;/delivery-availability</strong>: Queries if a kitchen outlet is operational and capable of dispatching a courier to the specific longitude and latitude coordinates.
                              </p>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Select Target Restaurant</label>
                                <select 
                                  value={apiAvailRest}
                                  onChange={(e) => setApiAvailRest(e.target.value)}
                                  className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                                >
                                  {restaurants.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Customer Latitude</label>
                                  <input 
                                    type="text"
                                    value={apiAvailLat}
                                    onChange={(e) => setApiAvailLat(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Customer Longitude</label>
                                  <input 
                                    type="text"
                                    value={apiAvailLng}
                                    onChange={(e) => setApiAvailLng(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                                    required
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Check Availability API</span>
                              </button>
                            </form>
                          )}

                          {activePlaygroundTab === 'nearby' && (
                            <form onSubmit={handleNearbyRestaurantsApi} className="space-y-3.5">
                              <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                                <strong>GET /api/v1/restaurants/nearby</strong>: Compiles active kitchens within a geographical perimeter bounding sphere centered on user location latitude/longitude coordinates.
                              </p>

                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Latitude</label>
                                  <input 
                                    type="text"
                                    value={apiNearLat}
                                    onChange={(e) => setApiNearLat(e.target.value)}
                                    className="w-full px-2 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Longitude</label>
                                  <input 
                                    type="text"
                                    value={apiNearLng}
                                    onChange={(e) => setApiNearLng(e.target.value)}
                                    className="w-full px-2 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Radius (KM)</label>
                                  <input 
                                    type="text"
                                    value={apiNearRadius}
                                    onChange={(e) => setApiNearRadius(e.target.value)}
                                    className="w-full px-2 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                                    required
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Search Nearby API</span>
                              </button>
                            </form>
                          )}

                          {activePlaygroundTab === 'tracking' && (
                            <div className="space-y-3.5">
                              <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                                <strong>GET /api/v1/orders/&#123;id&#125;/live-tracking</strong>: Establish a live Server-Sent Events (SSE) stream to receive coordinate telemetry ticks of the courier in real-time.
                              </p>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Select Active Order to Stream</label>
                                {activeOrders.length === 0 ? (
                                  <div className="text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl font-medium">
                                    ⚠️ No active orders available. Place an order to stream tracking coordinates!
                                  </div>
                                ) : (
                                  <select 
                                    value={apiTrackOrderId}
                                    onChange={(e) => {
                                      setApiTrackOrderId(e.target.value);
                                      setIsSseActive(false);
                                      setSseTicks([]);
                                    }}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                                  >
                                    {activeOrders.map(o => (
                                      <option key={o.id} value={o.id}>Order #{o.id} ({o.restaurantName})</option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <button
                                onClick={handleToggleSse}
                                disabled={activeOrders.length === 0}
                                className={`w-full py-2.5 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isSseActive 
                                    ? 'bg-rose-600 text-white hover:bg-rose-500' 
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                }`}
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSseActive ? 'animate-spin' : ''}`} />
                                <span>{isSseActive ? 'Disconnect SSE Telemetry Channel' : 'Connect SSE Telemetry Channel'}</span>
                              </button>

                              {isSseActive && sseTicks.length > 0 && (
                                <div className="p-3.5 bg-slate-950 border border-rose-500/30 rounded-xl max-h-32 overflow-y-auto overflow-x-hidden font-mono text-[9.5px] text-emerald-400 space-y-1 scrollbar-thin">
                                  <div className="text-slate-500 dark:text-slate-300 border-b border-rose-500/30 pb-1 font-bold">
                                    📡 SSE EVENT STREAM TUNNEL LISTENING...
                                  </div>
                                  {sseTicks.map((t, index) => (
                                    <div key={index}>
                                      <span className="text-slate-600 dark:text-slate-300">[{t.timestamp}]</span>{' '}
                                      <span className="text-amber-500">event: {t.event}</span>{' '}
                                      <span>data: {JSON.stringify(t.data || t.message)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {activePlaygroundTab === 'delay' && (
                            <form onSubmit={handleDelayApprovalApi} className="space-y-3.5">
                              <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                                <strong>POST /api/v1/orders/&#123;id&#125;/delay-approval</strong>: Approves or Rejects a kitchen-reported delivery delay. Approving yields automated credit compensation directly back to the customer.
                              </p>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Select Target Order</label>
                                {activeOrders.length === 0 ? (
                                  <div className="text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl font-medium">
                                    ⚠️ No active orders found. Place an order to test delay compensations.
                                  </div>
                                ) : (
                                  <select 
                                    value={apiDelayOrderId}
                                    onChange={(e) => setApiDelayOrderId(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                                  >
                                    {activeOrders.map(o => (
                                      <option key={o.id} value={o.id}>Order #{o.id} ({o.restaurantName})</option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Your Decision</label>
                                  <select 
                                    value={apiDelayApproved}
                                    onChange={(e) => setApiDelayApproved(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                                  >
                                    <option value="true">APPROVE ETA DELAY & SAVE CODES</option>
                                    <option value="false">REJECT & TRIGGER REDIRECTION</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Proposed Delay Duration</label>
                                  <input 
                                    type="number"
                                    value={apiDelayMinutes}
                                    onChange={(e) => setApiDelayMinutes(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                                    min="5"
                                    max="60"
                                    required
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={activeOrders.length === 0}
                                className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit Delay Response</span>
                              </button>
                            </form>
                          )}

                        </div>

                        {/* Response Visualizer (Right) */}
                        <div className="lg:col-span-6 flex flex-col justify-between min-h-[220px]">
                          <div className="p-4 bg-slate-950 border border-rose-500/30 rounded-[1.5rem] flex-1 flex flex-col justify-between h-full space-y-3">
                            <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                              <span className="text-[9.5px] font-mono font-bold text-slate-500 dark:text-slate-300">API GATEWAY RESPONSE OUTPUT</span>
                              {apiResponseStatus && (
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-black ${
                                  apiResponseStatus < 300 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  STATUS: {apiResponseStatus}
                                </span>
                              )}
                            </div>

                            {apiResponse ? (
                              <div className="flex-1 flex flex-col space-y-3.5">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-300 block">HTTP ENDPOINT:</span>
                                  <span className="text-xs font-mono font-semibold text-rose-400 block break-all">{apiResponseEndpoint}</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-300 block">HEADERS DISPATCHED:</span>
                                  <pre className="text-[9px] font-mono text-slate-400 dark:text-slate-300 p-2 bg-slate-900/60 rounded-xl overflow-x-auto scrollbar-thin max-h-24">
                                    {JSON.stringify(apiResponseHeaders, null, 2)}
                                  </pre>
                                </div>
                                <div className="space-y-1 flex-1 flex flex-col">
                                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-300 block">RESPONSE PAYLOAD JSON:</span>
                                  <pre className="text-[10px] font-mono text-amber-400 p-3 bg-slate-900 rounded-xl overflow-x-auto flex-1 scrollbar-thin max-h-32">
                                    {JSON.stringify(apiResponse, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-slate-500 dark:text-slate-300 space-y-2">
                                <Code className="w-8 h-8 text-slate-700" />
                                <p className="text-xs font-mono">Gateway Listener Ready</p>
                                <p className="text-[10px] text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                                  Fill in parameters and click "Send Request" or "Stream Channel" to display physical network packets here.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
      {activeOrders.filter(o => o.status !== 'delivered').length > 0 && !trackingOrder && (
        <div className={`fixed left-0 right-0 max-w-3xl mx-auto z-30 pointer-events-none transition-all duration-300 ${cart.length > 0 && selectedRestaurant ? 'bottom-24' : 'bottom-4'}`}>
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none px-5 gap-4 pb-2 pointer-events-auto">
            {activeOrders.filter(o => o.status !== 'delivered').slice().reverse().map((order) => (
              <button 
                key={order.id} 
                onClick={() => setTrackingOrder(order)}
                className="shrink-0 w-[85%] sm:w-[340px] snap-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[20px] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-rose-500/20 dark:border-rose-500/30 p-3.5 text-left cursor-pointer transition-all active:scale-[0.98] hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="shrink-0 text-[10px] font-mono font-bold text-slate-600 dark:text-[#f0ede6] bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded-full">#{order.id}</span>
                  <h5 className="font-extrabold text-[14px] text-slate-900 dark:text-[#f0ede6] line-clamp-1 flex-1">{order.restaurantName}</h5>
                  <span className="shrink-0 text-[9px] font-black px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider">
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Cart bar at bottom */}
      {cart.length > 0 && selectedRestaurant && (
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
              <span>View Cart (${getCartTotal().total.toFixed(2)})</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

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
        setIsPaymentModalOpen={setIsPaymentModalOpen}
      />
      
      <CustomerAddressModal
        isAddressModalOpen={isAddressModalOpen}
        setIsAddressModalOpen={setIsAddressModalOpen}
        addressSearchQuery={addressSearchQuery}
        setAddressSearchQuery={setAddressSearchQuery}
        address={address}
        setAddress={setAddress}
        savedAddresses={savedAddresses}
        onAddApiLog={onAddApiLog}
      />
      <CustomerPaymentModal
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        paymentStatus={paymentStatus}
        getCartTotal={getCartTotal}
        processPaymentAndOrder={processPaymentAndOrder}
      />
    </div>
  );
}
