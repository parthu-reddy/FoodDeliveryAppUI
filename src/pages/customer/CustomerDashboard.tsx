import { useToast } from "@/contexts/ToastContext";
import { DashboardHeader } from "@/pages/customer/DashboardHeader";
import { DeliveryStatus, MenuItem, Order, OrderStatus, PaymentMethodChoice } from "@/types";
import CustomerActiveOrdersCarousel from '@features/customer-orders/components/CustomerActiveOrdersCarousel';
import { CustomerMainView } from '@features/customer-orders/components/CustomerMainView';
import { CustomerCartBar, CustomerGlobalError } from '@features/customer-orders/components/CustomerHomeChrome';
import { CustomerOrderChat } from '@features/customer-orders/components/CustomerOrderChat';
import { CustomerOrderPlacedToast } from '@features/customer-orders/components/CustomerOrderPlacedToast';
import { CustomerModalStack } from '@features/customer-orders/components/CustomerModalStack';
import { useConfirm } from '@shared/ui';

import { AnimatePresence } from 'motion/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useTheme } from "@/contexts/ThemeContext";
import { useRestaurants } from '@features/catalog/model/useRestaurants';
import { CallOverlay } from "@features/communication/components/CallOverlay";
import { type ChatWidgetHandle } from "@features/communication/components/ChatWidget";
import { isActiveOrder, isFailedOrder } from '@features/customer-orders/model/orderStatus';
import { useCustomerReorder } from '@features/customer-orders/model/useCustomerReorder';
import { useCustomerCart } from '@features/customer-orders/model/useCustomerCart';
import { useCustomerStorefront } from '@features/catalog/model/useCustomerStorefront';
import { useCustomerAddresses } from '@features/customer-orders/model/useCustomerAddresses';
import { useCustomerOrders } from '@features/customer-orders/model/useCustomerOrders';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CustomerNavRail } from '@/pages/customer/CustomerNavRail';
import { CustomerLiveOrderRail, RAIL_MEDIA_QUERY } from '@features/customer-orders/components/CustomerLiveOrderRail';
import { useCustomerRoute } from '@features/customer-orders/model/useCustomerRoute';
import { useAddressChangeNotice } from '@features/customer-orders/model/useAddressChangeNotice';
import { CompleteProfileModal } from "@shared/ui";

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
  const { internalOrders, setInternalOrders, activeOrders: internalActiveOrders, isInitialLoad } = useCustomerOrders({
    onUpdateOrder: onUpdateOrder
  });
  const activeOrders = externalOrders ?? internalActiveOrders;

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAddressSelectorOpen, setIsAddressSelectorOpen] = useState(() => !localStorage.getItem('deliveryLat'));

  const addresses = useCustomerAddresses({
    setShowProfileModal,
    setIsAddressSelectorOpen,
    showError,
    showSuccess,
  });
  const {
    deliveryLat, deliveryLng, address, deliveryAddressId,
    } = addresses;

  const { restaurants, isRestaurantsLoading, error: restaurantsError, retry: retryRestaurants } = useRestaurants({
    deliveryLat,
    deliveryLng
  });

  const onPlaceOrder = externalPlaceOrder ?? ((order: Order) => {
    setInternalOrders(prev => [...prev, order]);
  });

  const {
    selectedRestaurant, viewMode, setViewMode,
    settingsTab, setSettingsTab, setSelectedRestaurantRoute,
  } = useCustomerRoute(restaurants);

  const [trackingSelection, setTrackingSelection] = useState<{
    explicitlyChosen: boolean;
    order: Order | null;
  }>({ explicitlyChosen: false, order: null });
  const trackingOrder = trackingSelection.order;
  const setTrackingOrder = useCallback((order: Order | null) => {
    setTrackingSelection({ explicitlyChosen: true, order });
  }, []);
  const [orderSuccessToast, setOrderSuccessToast] = useState<Order | null>(null);

  const chatWidgetRef = useRef<ChatWidgetHandle>(null);

  // Image preloading removed to favor lazy loading and better Time-To-Interactive (TTI).

  const storefront = useCustomerStorefront({
    selectedRestaurant,
    deliveryLat: addresses.deliveryLat,
    deliveryLng: addresses.deliveryLng,
  });

  const locationKey = deliveryAddressId || (deliveryLat !== null && deliveryLng !== null ? `gps:${deliveryLat.toFixed(3)}:${deliveryLng.toFixed(3)}` : address);

  const cart = useCustomerCart({
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
  const {
    carts,
    
    setIsCartOpen,
    
    globalError,
    setGlobalError,
    checkoutRestaurantId,
    addToCart: originalAddToCart,
    removeFromCart: originalRemoveFromCart,
    
    getCartTotal: originalGetCartTotal,
    
    processPaymentAndOrder: originalProcessPaymentAndOrder,
    setDeliveryAddressId: setGlobalDeliveryAddressId,
  } = cart;

  const addToCart = (item: MenuItem) => originalAddToCart(item, selectedRestaurant);
  const removeFromCart = (itemId: string, restaurantId: string) => originalRemoveFromCart(itemId, restaurantId);

  useEffect(() => {
    setGlobalDeliveryAddressId(deliveryAddressId || null);
  }, [deliveryAddressId, setGlobalDeliveryAddressId]);

  const getCartTotal = (restaurantId?: string) => {
    const rId = restaurantId || selectedRestaurant?.id || '';
    return originalGetCartTotal(rId);
  };

  const processPaymentAndOrder = (method: PaymentMethodChoice, tip = 0) => originalProcessPaymentAndOrder(method, deliveryAddressId as string, () => {
    if (checkoutRestaurantId === selectedRestaurant?.id) {
      setSelectedRestaurantRoute(null);
    }
  }, tip);

  const { reorder, pendingOrderId } = useCustomerReorder({
    locationKey, deliveryAddressId: deliveryAddressId || null, carts,
    confirmReplacement: () => confirm({
      title: 'Replace this cart?',
      description: 'Your current items from this kitchen will be replaced with the previous order, using today’s menu and prices.',
      confirmLabel: 'Replace cart', cancelLabel: 'Keep current cart', tone: 'primary',
    }),
    restoreCart: cart.restoreCart,
    selectRestaurant: setSelectedRestaurantRoute,
    openCart: () => setIsCartOpen(true),
    showError,
  });

  const totalCartItems = Object.values(carts).reduce((sum, cart) => sum + cart.items.reduce((s, i) => s + i.quantity, 0), 0);

  useAddressChangeNotice(locationKey, totalCartItems, showInfo);

  const activeCartCount = Object.keys(carts).length;
 
  useEffect(() => {
    if (onAddApiLog) {
       
      onAddApiLog({ id: 'nearby', label: 'GET /api/v1/restaurants/nearby', method: 'GET' });
     
    }
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isOutletSelectorOpen, setIsOutletSelectorOpen] = useState(false);
  
  const [addressSearchQuery, setAddressSearchQuery] = useState('');

  // The poller's first loaded order keeps its position when it completes. Restore from that
  // retained list so removing it from activeOrders cannot hide its receipt or select another job.
  // No historic orders are fetched here: the initial list contains only orders active at login.
  // Explicit tracking/dismissal still wins over this automatic login/reload selection.
  const restoredTrackingOrder = !trackingSelection.explicitlyChosen && !isInitialLoad
    ? internalOrders[0] ?? activeOrders.find(isActiveOrder) ?? null
    : null;
  const currentTrackingOrder = activeOrders.find(o => o.id === trackingOrder?.id)
    // Completed orders leave activeOrders but remain in the poller's full list.
    // Prefer that updated record over the snapshot captured when tracking began.
    || internalOrders.find(o => o.id === trackingOrder?.id)
    || trackingOrder
    || restoredTrackingOrder;

  useEffect(() => {
    if (currentTrackingOrder && (currentTrackingOrder.status === OrderStatus.HANDED_OVER || currentTrackingOrder.deliveryStatus === DeliveryStatus.AT_RESTAURANT || currentTrackingOrder.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY)) {
      if (onAddApiLog) {
        onAddApiLog({ id: 'live_tracking', label: `GET /api/v1/orders/${currentTrackingOrder.id}/live-tracking (SSE)`, method: 'GET' });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackingOrder?.status]);

  // Everything the two view components read. They are splits of one dashboard rather than
  // independent components, so the shared state is handed over as one object instead of
  // eighty-odd props whose names are identical on both sides.
  // From xl the live order sits in its own rail (Desktop.dc.html), so the main column keeps
  // browsing instead of showing the same order a second time.
  // Same query the rail mounts on, so exactly one of the two shows the order.
  const wide = useMediaQuery(RAIL_MEDIA_QUERY);
  const railOrder = currentTrackingOrder && isActiveOrder(currentTrackingOrder) && !isFailedOrder(currentTrackingOrder)
    && currentTrackingOrder.deliveryStatus !== DeliveryStatus.DELIVERED ? currentTrackingOrder : null;

  const view = {
    ...addresses, ...storefront, ...cart,
    onReorder: reorder, pendingReorderId: pendingOrderId,
    // Selection belongs to the address hook. The cart hook's identically named setter
    // only binds its quote requests and must not replace the saved selection setter.
    setDeliveryAddressId: addresses.setDeliveryAddressId,
    // These four override what `...cart` spreads. The hook's versions take the restaurant
    // as an extra argument; these are bound to the one on screen, and passing the raw ones
    // by accident is a real regression the linter caught while this bag was being built.
    addToCart, addToCartForRestaurant: originalAddToCart,
    removeFromCart, getCartTotal, processPaymentAndOrder,
    activeOrders, addressSearchQuery, setAddressSearchQuery,
    chatWidgetRef, confirm, currentTrackingOrder: wide && railOrder ? null : currentTrackingOrder,
    globalError, setGlobalError, isAddressModalOpen, setIsAddressModalOpen,
    isAddressSelectorOpen, setIsAddressSelectorOpen,
    isOutletSelectorOpen, setIsOutletSelectorOpen,
    isRestaurantsLoading, restaurantsError, retryRestaurants, onAddApiLog, onLogout, onUpdateOrder,
    restaurants, selectedRestaurant, setSelectedRestaurant: setSelectedRestaurantRoute,
    setInternalOrders, setTrackingOrder, settingsTab, setSettingsTab,
    showError, theme, view: viewMode, setView: setViewMode,
  };

  return (
    <div className="flex-1 flex w-full min-h-0 h-full">
    <CustomerNavRail hasLiveOrder={activeOrders.some(isActiveOrder)} onLogout={onLogout} />
    {/* Phone: one centred column. lg: the nav rail takes the left, this column the rest.
        xl: the live-order rail takes 344 px on the right while there is a live order. */}
    <div className="flex-1 min-w-0 flex flex-col w-full max-w-3xl lg:max-w-none mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
      <CallOverlay />
      {/* Global Error Toast */}
      <AnimatePresence>
        <CustomerGlobalError message={globalError} />
      </AnimatePresence>

      <AnimatePresence>
        <CustomerOrderPlacedToast
          order={orderSuccessToast}
          onTrack={(order) => { setTrackingOrder(order); setOrderSuccessToast(null); }}
          onDismiss={() => setOrderSuccessToast(null)}
        />
      </AnimatePresence>

      {/* 1. Header Area */}
      <DashboardHeader
        address={address}
        setIsAddressSelectorOpen={setIsAddressSelectorOpen}
      />

      {/* Rendered directly. A catch-all <Routes><Route path="*"> around it made no routing
          decision and is the wrapper that stopped restaurant tabs switching (94036a8). */}
      <CustomerMainView {...view} />

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
        trackingOrder={currentTrackingOrder}
        cartLength={totalCartItems}
        setTrackingOrder={setTrackingOrder}
      />

      {/* Floating Cart bar at bottom */}
      <CustomerCartBar
        totalCartItems={totalCartItems}
        activeCartCount={activeCartCount}
        setIsCartOpen={setIsCartOpen}
      />

      <CustomerModalStack {...view} />

      {/* Chat Widget when tracking an active order or delivered < 2 hrs ago */}
      <CustomerOrderChat
        currentTrackingOrder={currentTrackingOrder}
        chatWidgetRef={chatWidgetRef}
      />

    </div>
    {railOrder && (
      <CustomerLiveOrderRail
        order={railOrder} onAddApiLog={onAddApiLog} onUpdateOrder={onUpdateOrder}
        setInternalOrders={setInternalOrders} setTrackingOrder={setTrackingOrder} showError={showError}
      />
    )}
    </div>
  );
}
