import { useToast } from "@/contexts/ToastContext";
import { getUserProfile } from "@/lib/tokenStore";
import { customerApi, identityApi } from "@/lib/zodiosClients";
import { DashboardHeader } from "@/pages/customer/DashboardHeader";
import { DeliveryStatus, MenuItem, Order, OrderStatus, PaymentMethodChoice, Restaurant, RoleName } from "@/types";
import { CustomerMenuView } from '@features/catalog/components/customer/CustomerMenuView';
import { CustomerRestaurantBrowser } from '@features/catalog/components/customer/CustomerRestaurantBrowser';
import { getEffectiveMenu } from '@features/catalog/model/menuStore';
import CustomerActiveOrdersCarousel from '@features/customer-orders/components/CustomerActiveOrdersCarousel';
import { CustomerFreeDeliveryTracker } from '@features/customer-orders/components/CustomerFreeDeliveryTracker';
import { CustomerOrderTracker } from '@features/customer-orders/components/CustomerOrderTracker';
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { ErrorBoundary, Overlay, Surface, useConfirm } from '@shared/ui';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  MapPinOff,
  Package,
  ShoppingBag,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useTheme } from "@/contexts/ThemeContext";
import CustomerOutletSelectorModal from '@features/catalog/components/customer/CustomerOutletSelectorModal';
import { useRestaurants } from '@features/catalog/model/useRestaurants';
import { CallOverlay } from "@features/communication/components/CallOverlay";
import { ChatWidget, type ChatWidgetHandle } from "@features/communication/components/ChatWidget";
import CustomerAddressSelectorModal from "@features/customer-orders/components/CustomerAddressSelectorModal";
import CustomerCartDrawer from '@features/customer-orders/components/CustomerCartDrawer';
import { isActiveOrder, isFailedOrder } from '@features/customer-orders/model/orderStatus';
import { useCustomerCart } from '@features/customer-orders/model/useCustomerCart';
import { useCustomerOrders } from '@features/customer-orders/model/useCustomerOrders';
import CustomerPaymentModal from "@features/payments-wallet/components/CustomerPaymentModal";
import { Button, CompleteProfileModal, SharedSettingsView } from "@shared/ui";
import { formatINR } from '@shared/money';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const OrderTrackingMap = React.lazy(() => import("@features/maps-tracking/components/OrderTrackingMap"));


interface CustomerDashboardProps {
  userName: string;
  userPhone: string;
  activeOrders?: Order[];
  onPlaceOrder?: (order: Order) => void;
  onUpdateOrder?: (orderId: string, status: string) => void;
  onLogout: () => void;
  onAddApiLog?: (log: unknown) => void;
}



export default function CustomerDashboard({
  activeOrders: externalOrders,
  onPlaceOrder: externalPlaceOrder,
  onUpdateOrder,
  onLogout,
  onAddApiLog
}: CustomerDashboardProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme, toggleTheme } = useTheme();
  const { showError, showSuccess, showInfo } = useToast();
  const confirm = useConfirm();
  // Extracted Hooks
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { internalOrders, setInternalOrders, activeOrders: internalActiveOrders, isInitialLoad } = useCustomerOrders({
    onUpdateOrder: onUpdateOrder
  });
  const activeOrders = externalOrders ?? internalActiveOrders;

  const [deliveryLat, setDeliveryLat] = useState<number | null>(() => {
    const lat = localStorage.getItem('deliveryLat');
    return lat && !isNaN(Number(lat)) ? Number(lat) : null;
  });
  const [deliveryLng, setDeliveryLng] = useState<number | null>(() => {
    const lng = localStorage.getItem('deliveryLng');
    return lng && !isNaN(Number(lng)) ? Number(lng) : null;
  });

  const { restaurants, isRestaurantsLoading } = useRestaurants({
    deliveryLat,
    deliveryLng
  });

  const onPlaceOrder = externalPlaceOrder ?? ((order: Order) => {
    setInternalOrders(prev => [...prev, order]);
  });
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Sync to localStorage whenever delivery location changes and new restaurants are fetched
  useEffect(() => {
    if (selectedRestaurant && restaurants && restaurants.length > 0) {
      const updated = restaurants.find(r => r.id === selectedRestaurant.id);
      if (updated) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedRestaurant(updated);
      }
    }
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants]);

  const [brandOutlets, setBrandOutlets] = useState<Restaurant[]>([]);
  const [effectiveMenu, setEffectiveMenu] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState<boolean>(false);
 


  const [address, setAddress] = useState(() => localStorage.getItem('deliveryAddress') || 'Please add an address');
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(() => localStorage.getItem('deliveryAddressId') || '');

  const refreshAddresses = useCallback(() => {
    const profile = getUserProfile();
    if (!profile?.id) return;

    customerApi.customerAddress.get('/api/v1/customers/:customerId/addresses', {
      params: { customerId: profile.id }
     
    })
      .then((addrRes: { data?: Array<Record<string, unknown>> }) => {
        if (addrRes.data) {
          // eslint-disable-next-line react-hooks/immutability
          setSavedAddresses(addrRes.data);
        }
      })
      .catch((err: unknown) => console.error(err));
  }, []);

  const handleDeleteAddress = useCallback(async (addressId: string) => {
    const profile = getUserProfile();
    if (!profile?.id) return;
    try {
      await customerApi.customerAddress.deleteAddress(undefined, {
        params: { customerId: profile.id, addressId }
      });
      showSuccess('Address deleted successfully');
      refreshAddresses();
      if (deliveryAddressId === addressId) {
        setDeliveryAddressId('');
        setAddress('Please select an address');
        setDeliveryLat(null);
        setDeliveryLng(null);
        localStorage.removeItem('deliveryAddress');
         
        localStorage.removeItem('deliveryAddressId');
        localStorage.removeItem('deliveryLat');
        localStorage.removeItem('deliveryLng');
        // eslint-disable-next-line react-hooks/immutability
        setIsAddressSelectorOpen(true);
      }
    } catch (error) {
      console.error(error);
      showError('Failed to delete address');
    }
  }, [refreshAddresses, showSuccess, showError, deliveryAddressId]);

  useEffect(() => {
    localStorage.setItem('deliveryAddress', address);
    if (deliveryLat !== null) localStorage.setItem('deliveryLat', String(deliveryLat));
    else localStorage.removeItem('deliveryLat');
     
    if (deliveryLng !== null) localStorage.setItem('deliveryLng', String(deliveryLng));
    else localStorage.removeItem('deliveryLng');
    localStorage.setItem('deliveryAddressId', deliveryAddressId);
  }, [address, deliveryLat, deliveryLng, deliveryAddressId]);
  const [savedAddresses, setSavedAddresses] = useState<Record<string, unknown>[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [orderSuccessToast, setOrderSuccessToast] = useState<Order | null>(null);

  
  const chatWidgetRef = useRef<ChatWidgetHandle>(null);

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Fetch profile and addresses
  useEffect(() => {
    const profile = getUserProfile();
    if (profile && profile.role === RoleName.CUSTOMER) {
      const profilePromise = (identityApi.user.get(`/api/v1/users/profile`, { headers: { "X-User-Id": "" } })).catch(e => { console.error(e); return { data: null }; });
      const addressesPromise = profile.id ? customerApi.customerAddress.get('/api/v1/customers/:customerId/addresses', { params: { customerId: profile.id } }).catch((e: unknown) => { console.error(e); return { data: null }; }) : Promise.resolve({ data: null });
 

       
      Promise.all([profilePromise, addressesPromise]).then(([profileRes, addrRes]) => {
        // Handle Profile
         
        if (profileRes.data) {
          const p = profileRes.data;
          if (!p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
            // eslint-disable-next-line react-hooks/immutability
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
            const exists = addrRes.data.some((a: Record<string, unknown>) => a.id === currentId);
            if (!exists && addrRes.data.length > 0) {
              const first = addrRes.data[0];
              setAddress(`${first.label || 'Address'}: ${first.addressLine1 || ''}, ${first.city || ''}`);
              setDeliveryAddressId(first.id ?? '');
            }
          }
        }
      });
    }
   
  }, []);

  // Image preloading removed to favor lazy loading and better Time-To-Interactive (TTI).



  useEffect(() => {
    let ignore = false;
    if (selectedRestaurant && selectedRestaurant.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant?.id]); // Only refetch menu when outlet ID changes
 

  useEffect(() => {
    let ignore = false;
    if (selectedRestaurant?.brandId) {
      customerApi.customerRestaurant.getBrandOutlets({
        params: { brandId: selectedRestaurant.brandId },
        queries: { lat: deliveryLat ?? 0, lng: deliveryLng ?? 0 }
      })
        .then(res => {
          if (!ignore && res && res.data) setBrandOutlets(res.data);
        })
        .catch(console.error);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBrandOutlets([]);
    }
    return () => { ignore = true; };
  }, [selectedRestaurant?.brandId, deliveryLat, deliveryLng]); // Only refetch outlets when brand changes

  const locationKey = deliveryAddressId || (deliveryLat !== null && deliveryLng !== null ? `gps:${deliveryLat.toFixed(3)}:${deliveryLng.toFixed(3)}` : address);

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
    clearCart,
    getCartTotal: originalGetCartTotal,
    handleCheckout,
    processPaymentAndOrder: originalProcessPaymentAndOrder,
    setDeliveryAddressId: setGlobalDeliveryAddressId,
    isQuoting,
    quotes
  } = useCustomerCart({
    locationKey,
    onAddApiLog,
    onPlaceOrder,
    setTrackingOrder: (order) => {
      if (!selectedRestaurant || selectedRestaurant.id === order.restaurantId) {
        setTrackingOrder(order);
      } else {
        setOrderSuccessToast(order);
      }
    },
    selectedRestaurantId: selectedRestaurant?.id || null
  });

  const addToCart = (item: MenuItem) => originalAddToCart(item, selectedRestaurant);
  const removeFromCart = (itemId: string, restaurantId: string) => originalRemoveFromCart(itemId, restaurantId);

  useEffect(() => {
    setGlobalDeliveryAddressId(deliveryAddressId || null);
  }, [deliveryAddressId, setGlobalDeliveryAddressId]);

  const getCartTotal = (restaurantId?: string) => {
    const rId = restaurantId || selectedRestaurant?.id || '';
    return originalGetCartTotal(rId);
  };

  const processPaymentAndOrder = (method: PaymentMethodChoice) => originalProcessPaymentAndOrder(method, deliveryAddressId as string, () => {
    if (checkoutRestaurantId === selectedRestaurant?.id) {
      setSelectedRestaurant(null);
    }
  });

  const totalCartItems = Object.values(carts).reduce((sum, cart) => sum + cart.items.reduce((s, i) => s + i.quantity, 0), 0);

  const prevLocationKeyRef = useRef(locationKey);
  const prevCartItemsRef = useRef(totalCartItems);

  useEffect(() => {
    prevCartItemsRef.current = totalCartItems;
  }, [totalCartItems]);

  useEffect(() => {
    if (prevLocationKeyRef.current !== locationKey) {
      if (prevCartItemsRef.current > 0) {
        showInfo("Address changed. Your cart items from the previous address are saved.");
      }
      prevLocationKeyRef.current = locationKey;
    }
  }, [locationKey, showInfo]);

  const activeCartCount = Object.keys(carts).length;
 

  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState<boolean | null>(null);
  const [deliveryAvailabilityError, setDeliveryAvailabilityError] = useState<string | null>(null);




  useEffect(() => {
    let ignore = false;
    if (selectedRestaurant && selectedRestaurant.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDeliveryAvailable(null);
      setDeliveryAvailabilityError(null);
      customerApi.customerRestaurant.get('/api/v1/restaurants/:id/delivery-availability', { params: { id: selectedRestaurant.id } })
        .then(res => {
          if (!ignore && typeof res === 'boolean') {
            setIsDeliveryAvailable(res);
           
          }
        })
        .catch(err => {
          console.error(err);
          if (!ignore && err.response && (err.response.status === 409 || err.response.status === 400)) {
            setIsDeliveryAvailable(false);
            setDeliveryAvailabilityError(err.response.data?.errorCode || err.response.data?.message || 'OUT_OF_SERVICE_AREA');
          }
         
        });
    }
    return () => { ignore = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant?.id]);


  useEffect(() => {
    if (onAddApiLog) {
       
      onAddApiLog({ id: 'nearby', label: 'GET /api/v1/restaurants/nearby', method: 'GET' });
     
    }
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddressSelectorOpen, setIsAddressSelectorOpen] = useState(() => !localStorage.getItem('deliveryLat'));
  const [isOutletSelectorOpen, setIsOutletSelectorOpen] = useState(false);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'history' | 'addresses'>('profile');

  const [addressSearchQuery, setAddressSearchQuery] = useState('');


 


  // If there's an active order, let's keep checking its status in the parent
  const currentTrackingOrder = activeOrders.find(o => o.id === trackingOrder?.id) || trackingOrder;


  useEffect(() => {
    if (currentTrackingOrder && (currentTrackingOrder.status === OrderStatus.HANDED_OVER || currentTrackingOrder.deliveryStatus === DeliveryStatus.AT_RESTAURANT || currentTrackingOrder.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY)) {
      if (onAddApiLog) {
        onAddApiLog({ id: 'live_tracking', label: `GET /api/v1/orders/${currentTrackingOrder.id}/live-tracking (SSE)`, method: 'GET' });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <AnimatePresence>
        {orderSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-12 left-0 right-0 mx-auto max-w-sm z-[100] px-4"
          >
            <div className="bg-amber-500/95 backdrop-blur-xl border border-amber-500/50 shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Order Placed Successfully!</p>
                    <p className="text-amber-100 text-[10px] mt-0.5">{orderSuccessToast.restaurantName}</p>
                  </div>
                </div>
                <button onClick={() => setOrderSuccessToast(null)} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => {
                    setTrackingOrder(orderSuccessToast);
                    setOrderSuccessToast(null);
                  }}
                  className="px-4 py-2 bg-white text-amber-600 rounded-lg text-xs font-bold shadow-sm hover:shadow transition hover:bg-amber-50 w-full"
                >
                  Track Order
                </button>
              </div>
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
          onAddressAdded={refreshAddresses}
          onDeleteAddress={handleDeleteAddress}
          deliveryLat={deliveryLat ?? undefined}
          deliveryLng={deliveryLng ?? undefined}
          onSelectDeliveryLocation={async (addr: string, lat?: string | number, lng?: string | number) => {
            if (addr !== address) {
              const hasItems = Object.values(carts || {}).some((cart) => cart.items && cart.items.length > 0);
              if (hasItems) {
                const proceed = await confirm({
                  title: 'Change delivery address?',
                  description: 'Your active cart is tied to your current address and will be cleared.',
                  confirmLabel: 'Change address',
                  tone: 'danger',
                });
                if (!proceed) return;
                Object.keys(carts).forEach(restaurantId => {
                  if (carts[restaurantId]?.items?.length > 0) {
                    clearCart(restaurantId);
                  }
                });
              }
            }
            setAddress(addr);
            if (lat !== undefined && lng !== undefined) {
              setDeliveryLat(Number(lat));
              setDeliveryLng(Number(lng));
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

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 text-center space-y-2">
                  <div className="w-16 h-16 bg-amber-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-2xl text-amber-600 dark:text-amber-400">Order Delivered! 🎉</h4>
                  <p className="text-sm text-amber-700/70 dark:text-amber-400/70">
                    Enjoy your food from {currentTrackingOrder.restaurantName}.
                  </p>
                </div>

                <div className="bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-3xl">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-rose-500/10">
                    <span className="font-bold text-slate-800 dark:text-[#f0ede6]">Digital Invoice</span>
                    <span className="text-xs font-mono text-slate-500">#{currentTrackingOrder.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    {currentTrackingOrder.items?.map((item: { item?: { id?: string, name?: string, price?: number }, name?: string, price?: number, quantity?: number }, idx: number) => (
                      <div key={item.item?.id || idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>{item.quantity || 1}x {item.item?.name || item.name || 'Item'}</span>
                        <span>{formatINR(((item.item?.price || item.price || 0) * (item.quantity || 1)))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <span>Subtotal</span>
                      <span>{formatINR((currentTrackingOrder.itemTotal || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>SGST (2.5%)</span>
                      <span>{formatINR((currentTrackingOrder.sgst || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>CGST (2.5%)</span>
                      <span>{formatINR((currentTrackingOrder.cgst || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>Delivery Fee</span>
                      <span>{formatINR((currentTrackingOrder.deliveryFee || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>Platform Fee</span>
                      <span>{formatINR((currentTrackingOrder.customerPlatformFee || 0))}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-slate-900 dark:text-[#f0ede6] pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                      <span>Total Paid</span>
                      <span>{formatINR((currentTrackingOrder.totalAmount || 0))}</span>
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
                  {currentTrackingOrder.status !== OrderStatus.CANCELLED && (
                    <Button
                      onClick={() => {
                        chatWidgetRef.current?.openAndRequestRefundQuote();
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
                deliveryPricing={((selectedRestaurant ? quotes[selectedRestaurant.id as string] : null))?.data as { total: number } || { total: 0 }}
                selectedRestaurantId={selectedRestaurant?.id}
                isQuoting={isQuoting}
              />
              <ErrorBoundary fallbackLabel="Menu View">
                <CustomerMenuView
                  selectedRestaurant={selectedRestaurant}
                  setSelectedRestaurant={setSelectedRestaurant}
                  deliveryPricing={(() => {
                    const q = selectedRestaurant ? quotes[selectedRestaurant.id as string] : null;
                    if (!q) return null;
                    return {
                      isDeliverable: q.isDeliverable,
                      error: q.error,
                      minAmountForFreeDelivery: q.data?.minAmountForFreeDelivery,
                      distanceKm: q.data?.distanceKm,
                      total: q.data?.total
                    };
                  })()}
                  carts={carts}
                  getCartTotal={getCartTotal}
                  isDeliveryAvailable={isDeliveryAvailable}
                  deliveryAvailabilityError={deliveryAvailabilityError}
                  brandOutlets={brandOutlets}
                  setIsOutletSelectorOpen={setIsOutletSelectorOpen}
                   
                  isMenuLoading={isMenuLoading}
                  effectiveMenu={effectiveMenu}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  isQuoting={isQuoting}
                  deliveryAddressId={deliveryAddressId}
                  setIsAddressSelectorOpen={setIsAddressSelectorOpen}
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
        onComplete={() => {
          setShowProfileModal(false);
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
            className="justify-between !py-4 !rounded-2xl shadow-2xl border border-white/20 !border-solid bg-amber-500/90 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="font-bold">{totalCartItems} Item{totalCartItems > 1 ? 's' : ''} in Cart</span>
                {activeCartCount > 1 && (
                  <span className="text-xs text-amber-100/90 font-medium">{activeCartCount} restaurants</span>
                )}
              </div>
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
        savedAddresses={savedAddresses as import('@/types').Address[]}
        address={address}
        setAddress={setAddress}
         
        setDeliveryLat={setDeliveryLat}
        setDeliveryLng={setDeliveryLng}
        setDeliveryAddressId={setDeliveryAddressId}
        currentAddressId={deliveryAddressId}
         
        setShowLocationPrompt={setShowLocationPrompt}
        carts={carts}
        clearCart={clearCart}
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
        deliveryLat={deliveryLat ?? undefined}
        deliveryLng={deliveryLng ?? undefined}
        carts={carts}
        clearCart={clearCart}
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
        clearCart={clearCart}
        addToCart={originalAddToCart}
        getCartTotal={getCartTotal}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        isSubmitting={paymentStatus !== 'idle'}
        setIsAddressModalOpen={setIsAddressModalOpen}
        deliveryAddressId={deliveryAddressId}
      />

      <CustomerPaymentModal
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        paymentStatus={paymentStatus}
        getCartTotal={() => getCartTotal(checkoutRestaurantId || '')}
        cart={checkoutRestaurantId ? (carts[checkoutRestaurantId]?.items || []) : []}
        cartRestaurant={checkoutRestaurantId ? (carts[checkoutRestaurantId]?.restaurant as { name: string }) : { name: 'Restaurant' }}
        processPaymentAndOrder={processPaymentAndOrder}
        address={deliveryAddressId || ''}
        deliveryLat={deliveryLat ?? 0}
        deliveryLng={deliveryLng ?? 0}
        error={globalError}
      />

      <Overlay
        open={showLocationPrompt}
        onClose={() => setShowLocationPrompt(false)}
        label="Location required"
        className="w-full max-w-sm"
      >
            <Surface variant="glass-overlay" elevation={4} radius="xl" className="p-6 w-full text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinOff className="w-8 h-8 text-rose-500" />
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
            </Surface>
      </Overlay>

      {/* Chat Widget when tracking an active order or delivered < 2 hrs ago */}
      {currentTrackingOrder && (() => {
        // One definition of "finished", not a second hand-listed array: this one omitted
        // CANCELLED_BY_PLATFORM and DELIVERY_FAILED, so a platform cancellation kept offering chat
        // forever instead of for two hours.
        const isCompleted = !isActiveOrder(currentTrackingOrder);
        let showChat = !isCompleted;
        if (isCompleted && currentTrackingOrder.updatedAt) {
          const updatedTime = new Date(currentTrackingOrder.updatedAt).getTime();
          // eslint-disable-next-line react-hooks/purity
          showChat = (Date.now() - updatedTime) < (2 * 60 * 60 * 1000);
        }
        return showChat ? (
          <ChatWidget
            ref={chatWidgetRef}
            orderId={currentTrackingOrder.id}
            order={currentTrackingOrder}
            currentUserType="CUSTOMER"
            otherParticipants={[
              ...(currentTrackingOrder.deliveryExecutiveId ? [{
                userId: currentTrackingOrder.deliveryExecutiveId,
                entityType: 'DELIVERY' as const,
                displayName: 'Rider'
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
