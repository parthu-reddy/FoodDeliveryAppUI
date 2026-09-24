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
import { isActiveOrder } from '@features/customer-orders/model/orderStatus';
import { useCustomerCart } from '@features/customer-orders/model/useCustomerCart';
import { useCustomerStorefront } from '@features/catalog/model/useCustomerStorefront';
import { useCustomerAddresses } from '@features/customer-orders/model/useCustomerAddresses';
import { useCustomerOrders } from '@features/customer-orders/model/useCustomerOrders';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const { restaurants, isRestaurantsLoading } = useRestaurants({
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

  const processPaymentAndOrder = (method: PaymentMethodChoice) => originalProcessPaymentAndOrder(method, deliveryAddressId as string, () => {
    if (checkoutRestaurantId === selectedRestaurant?.id) {
      setSelectedRestaurantRoute(null);
    }
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

  // Before the customer makes an explicit tracker choice, derive the initial selection from the
  // asynchronously loaded active orders. This restores the delivery OTP after login/reload without
  // an effect-driven state update. Once the customer selects or closes a tracker, preserve that
  // choice instead of automatically reopening it.
  const restoredTrackingOrder = !trackingSelection.explicitlyChosen && !isInitialLoad
    ? activeOrders.find(isActiveOrder) || null
    : null;
  const currentTrackingOrder = activeOrders.find(o => o.id === trackingOrder?.id)
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
  const view = {
    ...addresses, ...storefront, ...cart,
    // These four override what `...cart` spreads. The hook's versions take the restaurant
    // as an extra argument; these are bound to the one on screen, and passing the raw ones
    // by accident is a real regression the linter caught while this bag was being built.
    addToCart, removeFromCart, getCartTotal, processPaymentAndOrder,
    activeOrders, addressSearchQuery, setAddressSearchQuery,
    chatWidgetRef, confirm, currentTrackingOrder,
    globalError, setGlobalError, isAddressModalOpen, setIsAddressModalOpen,
    isAddressSelectorOpen, setIsAddressSelectorOpen,
    isOutletSelectorOpen, setIsOutletSelectorOpen,
    isRestaurantsLoading, onAddApiLog, onLogout, onUpdateOrder,
    restaurants, selectedRestaurant, setSelectedRestaurant: setSelectedRestaurantRoute,
    setInternalOrders, setTrackingOrder, settingsTab, setSettingsTab,
    showError, theme, view: viewMode, setView: setViewMode,
  };

  return (
    // max-w-3xl (768px) capped this at every size, so on a 1440px screen the app used 53% of
    // the width and showed background either side. The restaurant grid was already
    // `lg:grid-cols-3` -- those three columns were being crammed into 768px rather than given
    // room. Widening to 7xl (1280px) at lg matches the desktop board and lets the grid breathe.
    <div className="flex-1 flex flex-col w-full max-w-3xl lg:max-w-7xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
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
  );
}
