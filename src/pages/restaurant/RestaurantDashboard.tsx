import { Tabs } from '@shared/ui';
import { DeliveryStatus, Order, OrderStatus } from "@/types";
import {
    MessageSquare
} from 'lucide-react';
import { Suspense, lazy, useEffect, useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, useMatch } from 'react-router-dom';

import { CallOverlay } from "@features/communication/components/CallOverlay";
import { CompleteProfileModal, ErrorBoundary } from "@shared/ui";
import { useUserProfile } from '../../hooks/useUserProfile';

import { Button, LoadingSkeleton } from "@shared/ui";

const SharedSettingsView = lazy(() => import("@shared/ui/SharedSettingsView"));

import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { RestaurantHeaderBar } from '@features/restaurant-orders/components/RestaurantHeaderBar';
import { RestaurantChatList } from '@features/restaurant-orders/components/RestaurantChatList';
import { RestaurantOrderChat } from '@features/restaurant-orders/components/RestaurantOrderChat';
import { RestaurantShell } from '@shared/ui';
import { RestaurantTabPanels } from '@features/restaurant-orders/components/RestaurantTabPanels';
import { useBrandKycStream } from '@features/restaurant-orders/model/useBrandKycStream';
import { useRestaurantCatalog } from '@features/restaurant-orders/model/useRestaurantCatalog';
import { useRestaurantOrderActions } from '@features/restaurant-orders/model/useRestaurantOrderActions';
import { useRestaurantOrders } from '@features/restaurant-orders/model/useRestaurantOrders';

import { isActiveOrder } from '@features/customer-orders/model/orderStatus';
import { sumRupees } from '@shared/money';

interface RestaurantDashboardProps {
  restaurantId: string;
  activeOrders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, payload?: { reason?: string }) => void;
  onLogout: () => void;
  onAddApiLog?: (log: unknown) => void;
}

export default function RestaurantDashboard({
  restaurantId,
  activeOrders: externalOrders,
  onUpdateOrderStatus: externalUpdateStatus,
  onLogout,
  onAddApiLog
}: RestaurantDashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const { showError, showSuccess } = useToast();

  const { internalOrders, setInternalOrders, activeOrders, onUpdateOrderStatus, refundRequests } = useRestaurantOrders({
    restaurantId: localStorage.getItem('restaurant_selectedOutletId') || '',
    onAddApiLog,
    showError,
    externalOrders,
    externalUpdateStatus
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Derive state from route
  const isSettingsView = location.pathname.includes('/restaurant/settings');
  const view = isSettingsView ? 'settings' : 'home';
  const showSettings = isSettingsView;

  const chatMatch = useMatch('/restaurant/chat/:orderId');
  const chatOrderId = chatMatch?.params?.orderId;
  
  let activeTab: 'orders' | 'menu' | 'campaigns' | 'earnings' | 'reviews' = 'orders';
  if (location.pathname.includes('/menu')) activeTab = 'menu';
  else if (location.pathname.includes('/campaigns')) activeTab = 'campaigns';
  else if (location.pathname.includes('/earnings')) activeTab = 'earnings';
  else if (location.pathname.includes('/reviews')) activeTab = 'reviews';

  const setActiveTab = (tab: typeof activeTab) => navigate(`/restaurant/${tab}`);
  const setView = (v: 'home' | 'settings') => navigate(v === 'settings' ? '/restaurant/settings' : '/restaurant');
  const setShowSettings = (show: boolean) => navigate(show ? '/restaurant/settings' : '/restaurant');

  const [, setApiPrepSeconds] = useState('15');

  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    return localStorage.getItem('restaurant_selectedOutletId') || '';
  });

  useEffect(() => {
    if (selectedOutletId) {
      localStorage.setItem('restaurant_selectedOutletId', selectedOutletId);
    }
  }, [selectedOutletId]);

  const {
    menuList, brands, outlets, setBrands,
    stockStatus, hasOutlets, isCurrentOutletAcceptingOrders, myRestaurantName,
    loadData, toggleOutletStatus, toggleStock,
  } = useRestaurantCatalog({ selectedOutletId, setSelectedOutletId, setApiPrepSeconds, showError });

  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [, setEditName] = useState('');
  const [, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Filter orders meant for this restaurant
  const allRestaurantOrders = activeOrders.filter(o => o.restaurantId === selectedOutletId);

  // Separate into active and history
  const myOrders = allRestaurantOrders.filter(o => isActiveOrder(o));
  const historyOrders = allRestaurantOrders.filter(o => !isActiveOrder(o));

  const pendingOrders = myOrders.filter(o => o.status === OrderStatus.PENDING_ACCEPTANCE || o.status === OrderStatus.CREATED);
  const activePreparing = myOrders.filter(o => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING);
  // HANDED_OVER means the rider collected the food, not that it arrived. Everything in
  // historyOrders has a terminal deliveryStatus by construction (isActiveOrder), so filtering on
  // status alone counted DELIVERY_FAILED and cancelled deliveries as completed. The restaurant's
  // "completed" tile was therefore always at least as large as the truth.
  const completedOrders = historyOrders.filter(
    o => o.status === OrderStatus.HANDED_OVER && o.deliveryStatus === DeliveryStatus.DELIVERED);

  // Chat state
  const showChatList = location.search.includes('chat=list');
  const setShowChatList = (show: boolean) => {
    if (show) {
      navigate(location.pathname + '?chat=list');
    } else {
      navigate(location.pathname);
    }
  };

  const selectedChatOrder = useMemo(() => {
    if (!chatOrderId || !myOrders) return null;
    return myOrders.find(o => o.id === chatOrderId) || null;
  }, [chatOrderId, myOrders]);

  const setSelectedChatOrder = (order: Order | null) => {
    if (order) {
      navigate(`/restaurant/chat/${order.id}`);
    } else {
      navigate('/restaurant');
    }
  };

  // Unified profile hook — replaces inline fetch pattern
  const { profile: fetchedProfile, isProfileIncomplete, localProfile } = useUserProfile();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localProfile) setEditPhone(localProfile.phoneNumber || '');
  }, [localProfile]);

  useEffect(() => {
    if (fetchedProfile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (fetchedProfile.name) setEditName(fetchedProfile.name);
      if (fetchedProfile.email) setEditEmail(fetchedProfile.email);
    }
    if (isProfileIncomplete) setShowCompleteProfileModal(true);
  }, [fetchedProfile, isProfileIncomplete]);

  // Function to load all data

  useBrandKycStream(brands, setBrands);



  // Compute stats
  const totalRevenue = sumRupees(...myOrders.map((o) => {
    if (o.earnings?.netPayout == null) {
      // It's possible some active orders don't have earnings computed yet.
      return 0;
    }
    return o.earnings.netPayout;
  }));

  // States for inline delay requests on Kanban cards
        const [cardDelayStatus, setCardDelayStatus] = useState<Record<string, { minutes: number; reason: string }>>({});

  const {
    handleStatusTransition,
    handleCardCancelSubmit,
    handleCardPartialRefundSubmit,
    handleCardDelaySubmit,
  } = useRestaurantOrderActions({
    selectedOutletId,
    internalOrders,
    setInternalOrders,
    setCardDelayStatus,
    onUpdateOrderStatus,
    externalUpdateStatus,
    onAddApiLog,
    showError,
    showSuccess,
  });

  return (
    <RestaurantShell
      header={<RestaurantHeaderBar
        myRestaurantName={myRestaurantName}
        hasOutlets={hasOutlets}
        selectedOutletId={selectedOutletId}
        setSelectedOutletId={setSelectedOutletId}
        outlets={outlets}
        acceptingOrders={isCurrentOutletAcceptingOrders}
        onToggleAccepting={toggleOutletStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
        inProfile={view === 'settings'}
        onToggleProfile={() => {
          if (view === 'settings') setView('home');
          else setView('settings'); // same double-navigate as the tabs: it bounced Profile
          // settings back to Live Kitchen, so Log Out was unreachable.
        }}
        inSettings={showSettings}
        // `setView` and `setShowSettings` are the same navigation; one call is enough.
        onToggleSettings={() => setShowSettings(!showSettings)}
      />}
      nav={!showSettings && view !== 'settings' ? (
        <Tabs
          label="Restaurant sections"
          orientation="responsive"
          className="lg:flex-col lg:gap-1 lg:p-3"
          value={activeTab}
          // One navigation only. This was `{ setActiveTab(key); setShowSettings(false); }` --
          // both are navigate() calls, so the second cancelled the first and every tab landed
          // back on Live Kitchen. See Phase7_PendingDefectClosure/plan.md.
          onChange={(key: typeof activeTab) => setActiveTab(key)}
          items={[
            { key: 'orders', label: `Live Kitchen Feed (${myOrders.length})` },
            { key: 'menu', label: 'Menu Stock Toggles' },
            { key: 'campaigns', label: 'Ad Campaigns' },
            { key: 'earnings', label: 'Earnings' },
            { key: 'reviews', label: 'Reviews' },
          ]}
        />
      ) : undefined}
    >
      {view === 'settings' ? (
        <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 text-slate-800 dark:text-[#f0ede6] h-full mt-4">
          <ErrorBoundary fallbackLabel="Profile Settings">
            <Suspense fallback={<LoadingSkeleton />}>
              <SharedSettingsView
                onBack={() => setView('home')}
                theme={theme}
                onLogout={onLogout}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : (
        <>
          <Routes>
        <Route path="*" element={<RestaurantTabPanels
          activeTab={activeTab}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          restaurantId={restaurantId}
          selectedOutletId={selectedOutletId}
          menuList={menuList}
          brands={brands}
          outlets={outlets}
          stockStatus={stockStatus}
          toggleStock={toggleStock}
          activeOrders={activeOrders}
          refundRequests={refundRequests}
          internalOrders={internalOrders}
          pendingOrders={pendingOrders}
          activePreparing={activePreparing}
          completedOrders={completedOrders}
          cardDelayStatus={cardDelayStatus}
          totalRevenue={totalRevenue}
          loadData={loadData}
          setSelectedChatOrder={setSelectedChatOrder}
          handleStatusTransition={handleStatusTransition}
          handleCardCancelSubmit={handleCardCancelSubmit}
          handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
          handleCardDelaySubmit={handleCardDelaySubmit}
        />} />
      </Routes>

      <CompleteProfileModal 
        isOpen={showCompleteProfileModal} 
        theme={theme} 
        profileId={editPhone}
        onComplete={(p) => {
          setEditName(p.name);
          setEditEmail(p.email);
          setShowCompleteProfileModal(false);
        }} 
      />

      {selectedChatOrder && (
        <RestaurantOrderChat
          order={selectedChatOrder}
          onClose={() => setSelectedChatOrder(null)}
          onBack={() => { setSelectedChatOrder(null); setShowChatList(true); }}
        />
      )}

      {!selectedChatOrder && (
        <Button
          onClick={() => setShowChatList(true)}
          variant="secondary"
          className="fixed bottom-6 right-6 !bg-slate-800 hover:!bg-slate-700 !text-white px-5 !py-4 !rounded-full transition-transform hover:scale-105 z-40 flex items-center justify-center space-x-2"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="font-bold hidden sm:inline">Messages</span>
        </Button>
      )}

      {showChatList && !selectedChatOrder && (
        <RestaurantChatList
          orders={myOrders}
          onSelect={setSelectedChatOrder}
          onClose={() => setShowChatList(false)}
        />
      )}

      <CallOverlay />
        </>
      )}
    </RestaurantShell>
  );
}
