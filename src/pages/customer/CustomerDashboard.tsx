import React, { useState, useEffect, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from "@/context/ToastContext";
import { 
  Search, MapPin, ShoppingBag, LogOut, ChevronRight, Star, Clock, 
  Bike, Plus, Minus, X, Check, Timer, ArrowLeft, ShieldCheck, Heart, Store, Sun, Moon,
  Terminal, Sliders, Code, Send, RefreshCw, Package, User, Navigation, AlertCircle, MapPinOff, XCircle, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoleName, Restaurant, MenuItem, CartItem } from "@/types";
import { OrderStatus, DeliveryStatus, Order } from "@/types";
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from "@/lib/zodiosClients";
import { getUserProfile } from "@/lib/tokenStore";
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import { getEffectiveMenu } from '@features/catalog/model/menuStore';
import ImageLoader from '@shared/ui/ImageLoader';
import CustomerRestaurantCard from '@features/catalog/components/customer/CustomerRestaurantCard';
import { CustomerRestaurantBrowser } from '@features/catalog/components/customer/CustomerRestaurantBrowser';
import { CustomerMenuView } from '@features/catalog/components/customer/CustomerMenuView';
import { CustomerOrderTracker } from '@features/customer-orders/components/CustomerOrderTracker';
import CustomerActiveOrdersCarousel from '@features/customer-orders/components/CustomerActiveOrdersCarousel';
import { CustomerFreeDeliveryTracker } from '@features/customer-orders/components/CustomerFreeDeliveryTracker';
import { ErrorBoundary } from "@shared/ui";
import { DashboardHeader } from "@/pages/customer/DashboardHeader";

import CustomerCartDrawer from '@features/customer-orders/components/CustomerCartDrawer';
import { SharedSettingsView } from "@shared/ui";
import CustomerAddressModal from "@features/customer-orders/components/CustomerAddressModal";
import CustomerAddressSelectorModal from "@features/customer-orders/components/CustomerAddressSelectorModal";
import CustomerOutletSelectorModal from '@features/catalog/components/customer/CustomerOutletSelectorModal';
import CustomerPaymentModal from "@features/payments-wallet/components/CustomerPaymentModal";
import { CompleteProfileModal } from "@shared/ui";
import { Button } from '@shared/ui';
const OrderTrackingMap = React.lazy(() => import("@features/maps-tracking/components/OrderTrackingMap"));
import { useCustomerOrders } from '@features/customer-orders/model/useCustomerOrders';
import { useRestaurants } from '@features/catalog/model/useRestaurants';
import { useCustomerCart } from '@features/customer-orders/model/useCustomerCart';
import { isActiveOrder, isFailedOrder } from '@features/customer-orders/model/orderStatus';
import { calculateHaversineDistance } from "@/utils/geo";
import { ChatWidget } from "@features/communication/components/ChatWidget";
import { CallOverlay } from "@features/communication/components/CallOverlay";
import { useTheme } from "@/context/ThemeContext";


interface CustomerDashboardProps {
  userName: string;
  userPhone: string;
  activeOrders?: Order[];
  onPlaceOrder?: (order: Order) => void;
  onUpdateOrder?: (orderId: string, status: string) => void;
  onLogout: () => void;
  onAddApiLog?: (log: any) => void;
}



export default function CustomerDashboard({ 
  userName, 
  userPhone, 
  activeOrders: externalOrders, 
  onPlaceOrder: externalPlaceOrder,
  onUpdateOrder, 
  onLogout,
  onAddApiLog
}: CustomerDashboardProps) {
  const { theme, toggleTheme } = useTheme();
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

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Fetch profile and addresses
  useEffect(() => {
    const profile = getUserProfile();
    if (profile && profile.role === RoleName.CUSTOMER) {
      const profilePromise = (identityApi.user.get(`/api/v1/users/profile`, {})).catch(e => { console.error(e); return { data: null }; });
      const addressesPromise = profile.id ? customerApi.customerAddress.get('/api/v1/customers/:customerId/addresses', { params: { customerId: profile.id } }).catch((e: any) => { console.error(e); return { data: null }; }) : Promise.resolve({ data: null });

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
      customerApi.customerRestaurant.get('/api/v1/restaurants/brands/:brandId/outlets', { params: { brandId: selectedRestaurant.brandId }, queries: { lat: Number(deliveryLat), lng: Number(deliveryLng) } })
        .then(res => {
          if (!ignore && res.data) setBrandOutlets(res.data);
        })
        .catch(console.error);
    } else {
      setBrandOutlets([]);
    }
    return () => { ignore = true; };
  }, [selectedRestaurant?.brandId, deliveryLat, deliveryLng]); // Only refetch outlets when brand changes

  const locationKey = deliveryAddressId || address;

  const {
    carts,
    isCartOpen,
    setIsCartOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentStatus,
    globalError,
    setGlobalError,
    checkoutRestaurantId,
    addToCart: originalAddToCart,
    removeFromCart: originalRemoveFromCart,
    getCartTotal: originalGetCartTotal,
    handleCheckout,
    processPaymentAndOrder: originalProcessPaymentAndOrder
  } = useCustomerCart({ locationKey, onAddApiLog, onPlaceOrder, setTrackingOrder });

  const addToCart = (item: MenuItem) => originalAddToCart(item, selectedRestaurant);
  const removeFromCart = (itemId: string, restaurantId: string) => originalRemoveFromCart(itemId, restaurantId);
  const getCartTotal = (restaurantId?: string) => {
    const rId = restaurantId || selectedRestaurant?.id || '';
    return originalGetCartTotal(rId, deliveryPricingMap[rId]);
  };
  
  const processPaymentAndOrder = () => originalProcessPaymentAndOrder(deliveryAddressId, deliveryLat, deliveryLng, address, () => {
    if (checkoutRestaurantId === selectedRestaurant?.id) {
       setSelectedRestaurant(null);
    }
  });

  const totalCartItems = Object.values(carts).reduce((sum, cart) => sum + cart.items.reduce((s, i) => s + i.quantity, 0), 0);
  const activeCartCount = Object.keys(carts).length;

  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState<boolean | null>(null);
  const [deliveryPricingMap, setDeliveryPricingMap] = useState<Record<string, any>>({});

  // Clear cached delivery pricing when the location changes to prevent stale fees
  useEffect(() => {
    setDeliveryPricingMap({});
  }, [locationKey]);

  useEffect(() => {
    let ignore = false;
    const timeoutId = setTimeout(() => {
        if (!selectedRestaurant) return;
        
        if (deliveryAddressId) {
          customerApi.customerRestaurant.get('/api/v1/restaurants/:id/delivery-pricing', { params: { id: selectedRestaurant.id }, queries: { addressId: deliveryAddressId } })
            .then(res => {
              if (!ignore && res.data) {
                setDeliveryPricingMap(prev => ({ ...prev, [selectedRestaurant.id]: res.data }));
              }
            })
            .catch((err: any) => {
              console.error(err);
            });
        } else if (deliveryLat && deliveryLng) {
          // Fallback if no addressId is selected yet, we only know Haversine distance
          const rLat = Number(selectedRestaurant.lat || 0);
          const rLng = Number(selectedRestaurant.lng || 0);
          const distanceKm = calculateHaversineDistance(Number(deliveryLat), Number(deliveryLng), rLat, rLng);
          // Without an address, we can't get exact delivery pricing from the new combined API,
          // so we'll just set distance and defaults for now.
          setDeliveryPricingMap(prev => ({
            ...prev,
            [selectedRestaurant.id]: {
              distanceKm,
              config: {
                basePrice: 0,
                perKmRate: 0,
                restMaxContributionPercent: 0,
                fixedPlatformFee: 0,
                platformExcessCutPercent: 0,
                sgstPercent: 0,
                cgstPercent: 0
              }
            }
          }));
        }
    }, 500); // 500ms debounce
    return () => { ignore = true; clearTimeout(timeoutId); };
  }, [selectedRestaurant?.id, deliveryAddressId, deliveryLat, deliveryLng]);

  // Fetch delivery pricing for all active carts that don't have it cached yet
  useEffect(() => {
    if (!deliveryAddressId) return; // Only fetch actual pricing if we have a saved address
    
    const activeCartIds = Object.keys(carts);
    activeCartIds.forEach(cartId => {
      if (!deliveryPricingMap[cartId] && cartId !== selectedRestaurant?.id) {
        customerApi.customerRestaurant.get('/api/v1/restaurants/:id/delivery-pricing', { params: { id: cartId }, queries: { addressId: deliveryAddressId } })
          .then(res => {
            if (res.data) {
              setDeliveryPricingMap(prev => ({ ...prev, [cartId]: res.data }));
            }
          })
          .catch(err => console.error(`Failed to fetch pricing for background cart ${cartId}`, err));
      }
    });
  }, [carts, deliveryAddressId, deliveryPricingMap, selectedRestaurant?.id]);


  useEffect(() => {
    let ignore = false;
    if (selectedRestaurant) {
      setIsDeliveryAvailable(null);
      customerApi.customerRestaurant.get('/api/v1/restaurants/:id/delivery-availability', { params: { id: selectedRestaurant.id } })
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
      <DashboardHeader 
        address={address} 
        view={view} 
        setView={setView} 
        setIsAddressSelectorOpen={setIsAddressSelectorOpen} 
      />

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
                      <span>₹{((item.item?.price || item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span>Subtotal</span>
                    <span>₹{(currentTrackingOrder.itemTotal || currentTrackingOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>SGST (2.5%)</span>
                    <span>₹{(currentTrackingOrder.sgst || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>CGST (2.5%)</span>
                    <span>₹{(currentTrackingOrder.cgst || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Delivery Fee</span>
                    <span>₹{(currentTrackingOrder.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Platform Fee</span>
                    <span>₹{(currentTrackingOrder.customerPlatformFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 dark:text-[#f0ede6] pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                    <span>Total Paid</span>
                    <span>₹{(currentTrackingOrder.totalAmount || currentTrackingOrder.total || 0).toFixed(2)}</span>
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
                >
                  Download PDF Invoice
                </Button>
                
                {/* Report Issue / Request Refund Button */}
                {!currentTrackingOrder.refundedAmount && (
                  <Button 
                    onClick={() => {
                      setGlobalError('Issue reported to support. Our team will contact you shortly regarding a refund.');
                      setTimeout(() => setGlobalError(null), 3000);
                    }}
                    variant="outline"
                    className="text-rose-500 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 mt-3"
                    fullWidth
                  >
                    Report Issue / Request Refund
                  </Button>
                )}
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
              getFriendlyStatusMessage={getFriendlyStatusMessage}
            />
          )
        ) : selectedRestaurant ? (
          /* ------------------- RESTAURANT DETAIL & MENU ------------------- */
          <>
            <CustomerFreeDeliveryTracker
              carts={carts}
              getCartTotal={getCartTotal}
              deliveryPricing={selectedRestaurant ? deliveryPricingMap[selectedRestaurant.id] : null}
              selectedRestaurantId={selectedRestaurant?.id}
            />
            <ErrorBoundary fallbackLabel="Menu View">
            <CustomerMenuView
              selectedRestaurant={selectedRestaurant}
              setSelectedRestaurant={setSelectedRestaurant}
              deliveryPricing={selectedRestaurant ? deliveryPricingMap[selectedRestaurant.id] : null}
              carts={carts}
              getCartTotal={getCartTotal}
              isDeliveryAvailable={isDeliveryAvailable}
              brandOutlets={brandOutlets}
              setIsOutletSelectorOpen={setIsOutletSelectorOpen}
              isMenuLoading={isMenuLoading}
              effectiveMenu={effectiveMenu}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
            />
            </ErrorBoundary>
          </>
        ) : (
          /* ------------------- MAIN RESTAURANT FEED ------------------- */
          <ErrorBoundary fallbackLabel="Restaurant Feed">
            <CustomerRestaurantBrowser
              categories={categories}
              restaurants={restaurants}
              isRestaurantsLoading={isRestaurantsLoading}
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
        cartLength={totalCartItems}
        selectedRestaurantId={selectedRestaurant?.id}
        cartRestaurantId={selectedRestaurant?.id && carts[selectedRestaurant.id]?.items.length > 0 ? selectedRestaurant.id : Object.keys(carts).find(id => carts[id]?.items.length > 0)}
        setTrackingOrder={setTrackingOrder}
      />

      {/* Floating Cart bar at bottom */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-[380px] mx-auto">
          <Button
            onClick={() => setIsCartOpen(true)}
            variant="warning"
            fullWidth
            className="justify-between !py-4 !rounded-2xl shadow-2xl border border-white/20 !border-solid bg-orange-500/90 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{totalCartItems} Item{totalCartItems > 1 ? 's' : ''} in Cart{activeCartCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>View Cart</span>
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
        setDeliveryLat={setDeliveryLat}
        setDeliveryLng={setDeliveryLng}
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
        deliveryLat={String(deliveryLat)}
        deliveryLng={String(deliveryLng)}
      />

      <CustomerCartDrawer
        address={address}
        setAddress={setAddress}
        handleCheckout={handleCheckout} 
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        selectedRestaurant={selectedRestaurant}
        carts={carts}
        removeFromCart={removeFromCart}
        addToCart={originalAddToCart}
        getCartTotal={getCartTotal}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        isSubmitting={paymentStatus !== 'idle'}
      />

      <CustomerPaymentModal
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        paymentStatus={paymentStatus}
        getCartTotal={() => getCartTotal(checkoutRestaurantId || '')} 
        cart={checkoutRestaurantId ? (carts[checkoutRestaurantId]?.items || []) : []} 
        cartRestaurant={checkoutRestaurantId ? carts[checkoutRestaurantId]?.restaurant : undefined}
        processPaymentAndOrder={processPaymentAndOrder}
        address={address}
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
      
    </div>
  );
}
