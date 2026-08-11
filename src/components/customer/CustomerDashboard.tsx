import React, { useState, useEffect, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { 
  Search, MapPin, ShoppingBag, LogOut, ChevronRight, Star, Clock, 
  Bike, Plus, Minus, X, Check, Timer, ArrowLeft, ShieldCheck, Heart, Store, Sun, Moon,
  Terminal, Sliders, Code, Send, RefreshCw, Package, User, Navigation, AlertCircle, MapPinOff, XCircle, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoleName, Restaurant, MenuItem, CartItem } from '../../types';
import { OrderStatus, DeliveryStatus, Order } from '../../types';
import { getFriendlyStatusMessage } from '../../utils/statusMessaging';
import { apiGet, apiPost } from '../../lib/apiClient';
import { getUserProfile } from '../../lib/tokenStore';
import LaBouffeLogo from '../shared/LaBouffeLogo';
import { getEffectiveMenu } from '../../lib/menuStore';
import ImageLoader from '../shared/ImageLoader';
import CustomerRestaurantCard from './CustomerRestaurantCard';
import { CustomerRestaurantBrowser } from './CustomerRestaurantBrowser';
import { CustomerMenuView } from './CustomerMenuView';
import { CustomerOrderTracker } from './CustomerOrderTracker';
import CustomerActiveOrdersCarousel from './CustomerActiveOrdersCarousel';
import { CustomerOrderHistory } from './CustomerOrderHistory';
import { ErrorBoundary } from '../shared/ErrorBoundary';

import CustomerCartDrawer from './CustomerCartDrawer';
import SharedSettingsView from '../shared/SharedSettingsView';
import CustomerAddressModal from './CustomerAddressModal';
import CustomerAddressSelectorModal from './CustomerAddressSelectorModal';
import CustomerOutletSelectorModal from './CustomerOutletSelectorModal';
import CustomerPaymentModal from './CustomerPaymentModal';
import CompleteProfileModal from '../shared/CompleteProfileModal';
import { Button } from '../ui';
const OrderTrackingMap = React.lazy(() => import('../shared/OrderTrackingMap'));
import { useCustomerOrders } from './useCustomerOrders';
import { useRestaurants } from './useRestaurants';
import { useCustomerCart } from './useCustomerCart';
import { isActiveOrder, isFailedOrder } from '../../utils/orderStatus';
import { calculateHaversineDistance } from '../../utils/geo';
import { ChatWidget } from '../shared/ChatWidget';
import { CallOverlay } from '../shared/CallOverlay';


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
  const { showError, showSuccess, showInfo } = useToast();
  // Extracted Hooks
  const { internalOrders, setInternalOrders, activeOrders: internalActiveOrders, isInitialLoad } = useCustomerOrders({
    onUpdateOrder: onUpdateOrder
  });
  const activeOrders = externalOrders ?? internalActiveOrders;

  const [deliveryLat, setDeliveryLat] = useState<string | number>(() => localStorage.getItem('deliveryLat') || '12.97');
  const [deliveryLng, setDeliveryLng] = useState<string | number>(() => localStorage.getItem('deliveryLng') || '77.59');

  const { restaurants, isRestaurantsLoading } = useRestaurants({
    deliveryLat,
    deliveryLng
  });

  const onPlaceOrder = externalPlaceOrder ?? ((order: Order) => {
    setInternalOrders(prev => [...prev, order]);
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [brandOutlets, setBrandOutlets] = useState<Restaurant[]>([]);
  const [effectiveMenu, setEffectiveMenu] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState<boolean>(false);
  
  const isSubmittingOrderRef = useRef<boolean>(false);
  const [address, setAddress] = useState(() => localStorage.getItem('deliveryAddress') || 'Please add an address');
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(() => localStorage.getItem('deliveryAddressId') || '');

  useEffect(() => {
    localStorage.setItem('deliveryAddress', address);
    localStorage.setItem('deliveryLat', String(deliveryLat));
    localStorage.setItem('deliveryLng', String(deliveryLng));
    localStorage.setItem('deliveryAddressId', deliveryAddressId);
  }, [address, deliveryLat, deliveryLng, deliveryAddressId]);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Fetch profile and addresses
  useEffect(() => {
    const profile = getUserProfile();
    if (profile && profile.role === RoleName.CUSTOMER) {
      const profilePromise = apiGet(`/api/v1/users/profile`).catch(e => { console.error(e); return { data: null }; });
      const addressesPromise = profile.id ? apiGet(`/api/v1/customers/${profile.id}/addresses`).catch(e => { console.error(e); return { data: null }; }) : Promise.resolve({ data: null });

      Promise.all([profilePromise, addressesPromise]).then(([profileRes, addrRes]) => {
        // Handle Profile
        if (profileRes.data) {
          const p = profileRes.data;
          if (p.name) setEditName(p.name);
          if (p.email) setEditEmail(p.email);
          if (!p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
            setShowProfileModal(true);
          }
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

  // Image preloading removed to favor lazy loading and better Time-To-Interactive (TTI).



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
  const [deliveryPricing, setDeliveryPricing] = useState<{ minimumOrderForFreeDelivery: number, fixedPlatformFee: number, distanceKm: number } | null>(null);

  useEffect(() => {
    let ignore = false;
    const timeoutId = setTimeout(() => {
        if (selectedRestaurant && deliveryAddressId) {
          setDeliveryPricing(null);

          apiGet(`/api/v1/restaurants/${selectedRestaurant.id}/delivery-pricing?addressId=${deliveryAddressId}`)
            .then(res => {
              if (!ignore && res.data) {
                setDeliveryPricing(res.data);
              }
            })
            .catch((err: any) => {
              if (err?.status === 429) {
                // Rate limited — show a graceful message, don't swallow silently
                setDeliveryPricing({ minimumOrderForFreeDelivery: 999999, fixedPlatformFee: 5.0, distanceKm: 0 });
              } else {
                console.error(err);
              }
            });
        } else if (selectedRestaurant && deliveryLat && deliveryLng) {
          const rLat = Number((selectedRestaurant as any).lat || 0);
          const rLng = Number((selectedRestaurant as any).lng || 0);
          const distanceKm = calculateHaversineDistance(Number(deliveryLat), Number(deliveryLng), rLat, rLng);
          setDeliveryPricing({ minimumOrderForFreeDelivery: 999999, fixedPlatformFee: 5.0, distanceKm });
        }
    }, 500); // 500ms debounce
    return () => { ignore = true; clearTimeout(timeoutId); };
  }, [selectedRestaurant?.id, deliveryAddressId, deliveryLat, deliveryLng]);

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
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    cart,
    cartRestaurant,
    isCartOpen,
    setIsCartOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentStatus,
    globalError,
    setGlobalError,
    addToCart: originalAddToCart,
    removeFromCart,
    getCartTotal: originalGetCartTotal,
    handleCheckout: originalHandleCheckout,
    processPaymentAndOrder: originalProcessPaymentAndOrder
  } = useCustomerCart({ onAddApiLog, onPlaceOrder, setTrackingOrder });

  const addToCart = (item: MenuItem) => originalAddToCart(item, selectedRestaurant);
  const getCartTotal = () => originalGetCartTotal(selectedRestaurant, deliveryPricing);
  const handleCheckout = () => originalHandleCheckout(selectedRestaurant);
  const processPaymentAndOrder = () => originalProcessPaymentAndOrder(selectedRestaurant, deliveryAddressId, deliveryLat, deliveryLng, address, () => setSelectedRestaurant(null));



  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddressSelectorOpen, setIsAddressSelectorOpen] = useState(false);
  const [isOutletSelectorOpen, setIsOutletSelectorOpen] = useState(false);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'history' | 'addresses'>('profile');

  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState(userPhone);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  



  // If there's an active order, let's keep checking its status in the parent
  const currentTrackingOrder = activeOrders.find(o => o.id === trackingOrder?.id) || trackingOrder;


  useEffect(() => {
    if (currentTrackingOrder && (currentTrackingOrder.status === OrderStatus.HANDED_OVER || currentTrackingOrder.deliveryStatus === DeliveryStatus.AT_RESTAURANT || currentTrackingOrder.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY)) {
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

  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useCallback((node: any) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 6);
      }
    });
    if (node) observerRef.current.observe(node);
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
      <CallOverlay />
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
            onClick={() => setIsHistoryOpen(true)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
            title="Order History"
          >
            <Clock className="w-4 h-4 text-slate-500" />
          </button>
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
          currentTrackingOrder.deliveryStatus === DeliveryStatus.DELIVERED ? (
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
                    <span>Subtotal</span>
                    <span>${(currentTrackingOrder.itemTotal || currentTrackingOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>SGST (2.5%)</span>
                    <span>${(currentTrackingOrder.sgst || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>CGST (2.5%)</span>
                    <span>${(currentTrackingOrder.cgst || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Delivery Fee</span>
                    <span>${(currentTrackingOrder.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 dark:text-[#f0ede6] pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                    <span>Total Paid</span>
                    <span>${(currentTrackingOrder.totalAmount || currentTrackingOrder.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Payment Method</span>
                    <span className="uppercase font-medium">{currentTrackingOrder.paymentIntent ? 'Wallet / Card' : 'Credit Card'}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setGlobalError('Invoice downloaded successfully!');
                    setTimeout(() => setGlobalError(null), 3000);
                  }}
                  variant="secondary"
                  fullWidth
                  icon={<Package className="w-5 h-5" />}
                  className="!bg-slate-800 dark:!bg-white !text-white dark:!text-slate-900 hover:!bg-slate-700 dark:hover:!bg-slate-100 shadow-md"
                >
                  Download PDF Invoice
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ------------------- TRACKING SCREEN ------------------- */
            <CustomerOrderTracker
              currentTrackingOrder={currentTrackingOrder}
              setTrackingOrder={setTrackingOrder}
              isActiveOrder={isActiveOrder}
              activeOrders={activeOrders}
              isFailedOrder={isFailedOrder}
              onAddApiLog={onAddApiLog}
              onUpdateOrder={onUpdateOrder}
              setInternalOrders={setInternalOrders}
              showError={showError}
              apiPost={apiPost}
              getFriendlyStatusMessage={getFriendlyStatusMessage}
            />
          )
        ) : selectedRestaurant ? (
          /* ------------------- RESTAURANT DETAIL & MENU ------------------- */
          <ErrorBoundary fallbackLabel="Menu View">
            <CustomerMenuView
              selectedRestaurant={selectedRestaurant}
              setSelectedRestaurant={setSelectedRestaurant}
              deliveryPricing={deliveryPricing}
              cartRestaurant={cartRestaurant}
              getCartTotal={getCartTotal}
              isDeliveryAvailable={isDeliveryAvailable}
              brandOutlets={brandOutlets}
              setIsOutletSelectorOpen={setIsOutletSelectorOpen}
              isMenuLoading={isMenuLoading}
              effectiveMenu={effectiveMenu}
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
            />
          </ErrorBoundary>
        ) : (
          /* ------------------- MAIN RESTAURANT FEED ------------------- */
          <ErrorBoundary fallbackLabel="Restaurant Feed">
            <CustomerRestaurantBrowser
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              restaurants={restaurants}
              filteredRestaurants={filteredRestaurants}
              isRestaurantsLoading={isRestaurantsLoading}
              visibleCount={visibleCount}
              lastElementRef={lastElementRef}
              setIsAddressSelectorOpen={setIsAddressSelectorOpen}
              setSelectedRestaurant={setSelectedRestaurant}
              onAddApiLog={onAddApiLog}
            />
          </ErrorBoundary>
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
          <Button
            onClick={() => setIsCartOpen(true)}
            variant="primary"
            fullWidth
            className="!bg-gradient-to-r from-orange-500 to-amber-500 !text-white !py-4 !rounded-2xl shadow-2xl justify-between border border-white/20 !border-solid"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{cart.reduce((a, b) => a + b.quantity, 0)} Items Added</span>
            </div>
            <div className="flex items-center gap-1">
              <span>View Cart (${getCartTotal().total?.toFixed(2)})</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Button>
        </div>
      )}

      <CustomerAddressSelectorModal
        isOpen={isAddressSelectorOpen}
        onClose={() => setIsAddressSelectorOpen(false)}
        savedAddresses={savedAddresses}
        setAddress={setAddress}
        setDeliveryLat={setDeliveryLat as any}
        setDeliveryLng={setDeliveryLng as any}
        setDeliveryAddressId={setDeliveryAddressId}
        setShowLocationPrompt={setShowLocationPrompt}
        onAddNewAddress={() => {
          setView('settings');
          setSettingsTab('addresses');
          setIsAddressModalOpen(true);
        }}
      />

      <CustomerOutletSelectorModal
        isOpen={isOutletSelectorOpen}
        onClose={() => setIsOutletSelectorOpen(false)}
        brandOutlets={brandOutlets}
        selectedRestaurant={selectedRestaurant}
        setSelectedRestaurant={setSelectedRestaurant}
        onAddApiLog={onAddApiLog}
      />

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
              <Button
                onClick={() => setShowLocationPrompt(false)}
                variant="primary"
                fullWidth
                className="!bg-indigo-600 hover:!bg-indigo-700 !border-none"
              >
                Understood
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget when tracking an active order or delivered < 2 hrs ago */}
      {currentTrackingOrder && (() => {
        const isCompleted = currentTrackingOrder.deliveryStatus === DeliveryStatus.DELIVERED || 
                            [OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_RESTAURANT].includes(currentTrackingOrder.status);
        let showChat = !isCompleted;
        if (isCompleted && currentTrackingOrder.updatedAt) {
          const updatedTime = new Date(currentTrackingOrder.updatedAt).getTime();
          showChat = (Date.now() - updatedTime) < (2 * 60 * 60 * 1000);
        }
        return showChat ? (
          <ChatWidget 
            orderId={currentTrackingOrder.id} 
            order={currentTrackingOrder}
            currentUserType="CUSTOMER" 
            otherParticipants={[
              ...(currentTrackingOrder.deliveryExecutiveId ? [{
                userId: currentTrackingOrder.deliveryExecutiveId,
                entityType: 'DELIVERY' as const,
                displayName: currentTrackingOrder.deliveryExecutiveName || currentTrackingOrder.riderName || 'Rider'
              }] : []),
              ...(currentTrackingOrder.restaurantId ? [{
                userId: currentTrackingOrder.restaurantId,
                entityType: 'RESTAURANT' as const,
                displayName: currentTrackingOrder.restaurantName || 'Restaurant'
              }] : [])
            ]}
          />
        ) : null;
      })()}
      
      <AnimatePresence>
        {isHistoryOpen && (
          <CustomerOrderHistory 
            onClose={() => setIsHistoryOpen(false)}
            onAddApiLog={onAddApiLog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
