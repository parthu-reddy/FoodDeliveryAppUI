import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { 
  Store, TrendingUp, CheckCircle, Package, RefreshCw, LogOut, 
  ToggleLeft, ToggleRight, DollarSign, Calendar, Eye, MapPin, Sun, Moon,
  Terminal, Sliders, Code, Send, CheckCircle2, AlertCircle,
  ChefHat, Flame, Clock, Info, Shield, HelpCircle, User, Bike, Play, ArrowRight, Sparkles,
  Check, Truck, Settings, Plus, Trash2, Edit3, ChevronLeft, Layers, Utensils, History, ChevronDown, ChevronUp, XCircle, MessageSquare, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, MenuItem, VerificationStatus } from '../../types';

import LaBouffeLogo from '../shared/LaBouffeLogo';
import { ChatWidget } from "../shared/ChatWidget";
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { EmptyState } from '../shared/EmptyState';
import { CallOverlay } from '../shared/CallOverlay';
import CompleteProfileModal from '../shared/CompleteProfileModal';
import { getUserProfile } from '../../lib/tokenStore';
import { useUserProfile } from '../../hooks/useUserProfile';

import { LoadingSkeleton } from '../shared/Skeleton';
import { RestaurantMenuTogglesView } from './RestaurantMenuTogglesView';
import { Button, Badge } from '../ui';

const CampaignManagement = lazy(() => import('./CampaignManagement'));
const SharedSettingsView = lazy(() => import('../shared/SharedSettingsView'));
const RestaurantSettingsShell = lazy(() => 
  import('./RestaurantSettingsShell').then(module => ({ default: module.RestaurantSettingsShell }))
);

import { apiGet, apiPost, apiPut } from '../../lib/apiClient';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useToast } from '../../context/ToastContext';
import ImageLoader from '../shared/ImageLoader';
import { useRestaurantOrders } from './useRestaurantOrders';
import { RestaurantOrderQueue } from './RestaurantOrderQueue';
import { RestaurantStatsBar } from './RestaurantStatsBar';
import { RestaurantBrandSelector } from './RestaurantBrandSelector';
import { z } from 'zod';

const delaySchema = z.object({
  additionalPrepTime: z.number().int().positive().max(120, 'Delay cannot exceed 120 minutes'),
  delayReason: z.string().max(255, 'Reason must be under 255 characters').optional()
});
import { getFriendlyStatusMessage, getFriendlyDeliveryStatusMessage } from '../../utils/statusMessaging';
import { useTheme } from '../../context/ThemeContext';

import { isActiveOrder, isFailedOrder } from '../../utils/orderStatus';
import { 
  getBrands, getOutlets, 
  getMasterMenuItems, 
  getOutletOverrides, getEffectiveMenu 
} from '../../lib/menuStore';

interface RestaurantDashboardProps {
  restaurantId: string;
  activeOrders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, payload?: any) => void;
  onLogout: () => void;
  onAddApiLog?: (log: any) => void;
}


export default function RestaurantDashboard({
  restaurantId,
  activeOrders: externalOrders,
  onUpdateOrderStatus: externalUpdateStatus,
  onLogout,
  onAddApiLog
}: RestaurantDashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const { showError, showSuccess, showInfo } = useToast();

  const { internalOrders, setInternalOrders, activeOrders, onUpdateOrderStatus } = useRestaurantOrders({
    selectedOutletId: localStorage.getItem('restaurant_selectedOutletId') || '',
    onAddApiLog,
    showError,
    externalOrders,
    externalUpdateStatus
  });
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'campaigns'>('orders');
  const [apiPrepSeconds, setApiPrepSeconds] = useState('15');


  const [showSettings, setShowSettings] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    return localStorage.getItem('restaurant_selectedOutletId') || '';
  });

  useEffect(() => {
    if (selectedOutletId) {
      localStorage.setItem('restaurant_selectedOutletId', selectedOutletId);
    }
  }, [selectedOutletId]);

  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

    
        
  // Chat state
  const [selectedChatOrder, setSelectedChatOrder] = useState<Order | null>(null);
  const [showChatList, setShowChatList] = useState(false);

  // Unified profile hook — replaces inline fetch pattern
  const { profile: fetchedProfile, isProfileIncomplete, localProfile } = useUserProfile();

  useEffect(() => {
    if (localProfile) setEditPhone(localProfile.phoneNumber || '');
  }, [localProfile]);

  useEffect(() => {
    if (fetchedProfile) {
      if (fetchedProfile.name) setEditName(fetchedProfile.name);
      if (fetchedProfile.email) setEditEmail(fetchedProfile.email);
    }
    if (isProfileIncomplete) setShowCompleteProfileModal(true);
  }, [fetchedProfile, isProfileIncomplete]);


  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);

  // Function to load all data
  const loadData = async () => {
    try {
      const [_brands, _outlets] = await Promise.all([
        getBrands(),
        getOutlets()
      ]);
      setBrands(_brands);
      setOutlets(_outlets);
      
      const newAcceptingState: Record<string, boolean> = {};
      _outlets.forEach((o: any) => {
        newAcceptingState[o.id] = o.isActive !== false;
      });
      setIsAcceptingOrders(newAcceptingState);

      if (_outlets.length === 0) {
        if (selectedOutletId) {
          setSelectedOutletId('');
          localStorage.removeItem('restaurant_selectedOutletId');
          return;
        }
      }
      if (!selectedOutletId && _outlets.length > 0) {
        setSelectedOutletId(_outlets[0].id);
        localStorage.setItem('restaurant_selectedOutletId', _outlets[0].id);
        return; // will re-trigger useEffect
      } else if (selectedOutletId && _outlets.length > 0 && !_outlets.find((o: any) => o.id === selectedOutletId)) {
        setSelectedOutletId(_outlets[0].id);
        localStorage.setItem('restaurant_selectedOutletId', _outlets[0].id);
        return; // replace stale id with first available
      } else if (selectedOutletId && _outlets.length === 0) {
        setSelectedOutletId('');
        localStorage.removeItem('restaurant_selectedOutletId');
        return;
      } else if (selectedOutletId) {
        localStorage.setItem('restaurant_selectedOutletId', selectedOutletId);
      }

      if (selectedOutletId) {
        const [_effective, _overrides] = await Promise.all([
          getEffectiveMenu(selectedOutletId),
          getOutletOverrides(selectedOutletId)
        ]);
        setMenuList(_effective);
        setOverrides(_overrides);

        const _outlet = _outlets.find((o: any) => o.id === selectedOutletId);
        if (_outlet) {
          const _masterItems = await getMasterMenuItems(_outlet.brandId);
          setMasterItems(_masterItems);
          
          if (_outlet.defaultPrepTimeSeconds) {
            setApiPrepSeconds(_outlet.defaultPrepTimeSeconds.toString());
          }
        } else {
          setMasterItems([]);
        }
      }
    } catch(e) {}
  };

  // Listen for brand updates (KYC status) via SSE
  useEffect(() => {
    let abortController = new AbortController();
    const hasPendingVerifications = brands.some(
      b => b.kycStatus === VerificationStatus.PENDING || b.pennyDropStatus === VerificationStatus.PENDING
    );

    if (hasPendingVerifications) {
      const startSse = async () => {
        try {
          const url = `${(import.meta as any).env.VITE_API_BASE_URL || ''}/api/v1/brands/stream`;
          await fetchEventSource(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Accept': 'text/event-stream'
            },
            signal: abortController.signal,
            onmessage(msg) {
              if (msg.event === 'brands-update') {
                try {
                  const _brands = JSON.parse(msg.data);
                  setBrands(_brands);
                } catch (e) {
                  console.error('Error parsing brand SSE data', e);
                }
              }
            },
            onclose() {
              console.log('SSE connection closed');
            },
            onerror(err) {
              console.error('SSE connection error:', err);
              // Avoid auto-reconnecting on unrecoverable errors like 401/403
              throw err; 
            }
          });
        } catch (e) {
          console.error("Failed to start SSE for brand updates:", e);
        }
      };
      
      startSse();
    }

    return () => {
      abortController.abort();
    };
  }, [brands]);

  useEffect(() => {
    loadData();
  }, [selectedOutletId]);

  const [stockStatus, setStockStatus] = useState<Record<string, boolean>>({});
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<Record<string, boolean>>({});
  const hasOutlets = outlets.length > 0;
  const isCurrentOutletAcceptingOrders = hasOutlets && (isAcceptingOrders[selectedOutletId] ?? true);

  const toggleOutletStatus = async () => {
    if (!selectedOutletId) return;
    const newStatus = !isCurrentOutletAcceptingOrders;
    // Optimistic UI update
    setIsAcceptingOrders(prev => ({ ...prev, [selectedOutletId]: newStatus }));
    try {
        await apiPut(`/api/v1/outlets/${selectedOutletId}/status`, { isActive: newStatus });
    } catch (err: any) {
        // Revert on error
        setIsAcceptingOrders(prev => ({ ...prev, [selectedOutletId]: !newStatus }));
        showError(err.message || "Failed to update outlet status");
    }
  };

  // Filter orders meant for this restaurant
  const allRestaurantOrders = activeOrders.filter(o => o.restaurantId === selectedOutletId);
  
  // Separate into active and history
  const myOrders = allRestaurantOrders.filter(o => isActiveOrder(o));
  const historyOrders = allRestaurantOrders.filter(o => !isActiveOrder(o));

  const pendingOrders = myOrders.filter(o => o.status === OrderStatus.PENDING_ACCEPTANCE || o.status === OrderStatus.CREATED);
  const activePreparing = myOrders.filter(o => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING);
  const completedOrders = historyOrders.filter(o => o.status === OrderStatus.HANDED_OVER);

  // Compute stats
  const totalRevenue = myOrders.reduce((acc, curr) => acc + curr.subtotal, 0);

  const toggleStock = async (dishId: string, currentStatus: boolean) => {
    const key = `${selectedOutletId}_${dishId}`;
    const newStockStatus = !currentStatus;
    
    setStockStatus(prev => ({
      ...prev,
      [key]: newStockStatus
    }));

    try {
      const endpoint = `/api/v1/outlets/${selectedOutletId}/menu-overrides/${dishId}`;
      await apiPost(endpoint, {
        isAvailable: newStockStatus
      });
    } catch (e) {
      console.error('Failed to update stock', e);
      setStockStatus(prev => ({
        ...prev,
        [key]: currentStatus
      }));
      showError('Failed to update stock status.');
    }
  };


  // States for inline delay requests on Kanban cards
        const [cardDelayStatus, setCardDelayStatus] = useState<Record<string, { minutes: number; reason: string }>>({});


  const handleStatusTransition = useCallback((order: Order) => {
    if (order.status === OrderStatus.PENDING_ACCEPTANCE || order.status === OrderStatus.AWAITING_DELAY_APPROVAL || order.status === OrderStatus.CREATED) {
      onUpdateOrderStatus(order.id, OrderStatus.ACCEPTED);
    } else if (order.status as any === OrderStatus.ACCEPTED) {
      onUpdateOrderStatus(order.id, OrderStatus.PREPARING);
    } else if (order.status as any === OrderStatus.PREPARING) {
      onUpdateOrderStatus(order.id, OrderStatus.READY_FOR_PICKUP);
    }
  }, [onUpdateOrderStatus]);

  const handleCardCancelSubmit = async (orderId: string, reason: string) => {
    const orderStatus = internalOrders.find(o => o.id === orderId)?.status;
    const targetStatus = (orderStatus === OrderStatus.PENDING_ACCEPTANCE || orderStatus === OrderStatus.AWAITING_DELAY_APPROVAL || orderStatus === OrderStatus.CREATED) 
      ? OrderStatus.CANCELLED_BY_RESTAURANT 
      : OrderStatus.CANCELLED;
    
    try {
      // cleared locally in card component
      await onUpdateOrderStatus(orderId, targetStatus as any, { reason });
    } catch (e: any) {
      console.error('Failed to cancel order', e);
      showError('Failed to cancel order: ' + (e.response?.data?.message || e.message || 'Unknown error'));
    }
  };

  const handleCardPartialRefundSubmit = async (orderId: string, amountStr: string, reason: string) => {
    const amount = amountStr ? parseFloat(amountStr) : 0;
    
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid positive refund amount');
      return;
    }
    
    try {
      // cleared locally in card component
      await apiPost(`/api/v1/restaurants/orders/${orderId}/refund/partial`, {
        partialAmount: amount,
        reason: reason
      });
      showSuccess(`Partial refund of $${amount.toFixed(2)} initiated successfully`);
      // Let polling refresh the order, or manually trigger refresh if available.
    } catch (e: any) {
      console.error('Failed to initiate partial refund', e);
      showError('Failed to refund: ' + (e.response?.data?.message || e.message || 'Unknown error'));
    }
  };


  const handleCardDelaySubmit = async (orderId: string, minutesStr: string, reason: string) => {
    const minutes = parseInt(minutesStr || '15', 10);
    const seconds = minutes * 60;

    const endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/accept`;
    const body = {
      additionalPrepTime: minutes,
      delayReason: reason
    };

    const validation = delaySchema.safeParse(body);
    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }

    try {
      // cleared locally in card component
      setCardDelayStatus(prev => ({
        ...prev,
        [orderId]: { minutes, reason }
      }));
      
      if (minutes > 10) {
        // Optimistic update
        setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.AWAITING_DELAY_APPROVAL } : o));
        if (externalUpdateStatus) externalUpdateStatus(orderId, OrderStatus.AWAITING_DELAY_APPROVAL);
      } else {
        // Accept right away if <= 10 mins
        setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.ACCEPTED } : o));
        if (externalUpdateStatus) externalUpdateStatus(orderId, OrderStatus.ACCEPTED);
      }

      await apiPost(endpoint, body);
      
      if (onAddApiLog) {
        onAddApiLog({
          id: `api-${Date.now()}`,
          method: 'POST',
          endpoint,
          payload: body,
          status: 200,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e: any) {
      console.error('Failed to submit delay request', e);
      showError('Failed to submit delay request: ' + (e.response?.data?.message || e.message || 'Unknown error'));
    }
    
    // handled locally in card
  };

  const myRestaurantName = outlets.length > 0 
    ? (outlets.find(r => r.id === selectedOutletId)?.name || 'My Restaurant') 
    : 'No Outlet Registered';

  const selectedOutletBrandId = brands.length > 0 ? brands[0].id : null;

  return (
    <div className="flex-1 flex flex-col w-full overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
      
      {/* Header Area */}
      <header className="sticky top-0 bg-white/20 dark:bg-white/5 backdrop-blur-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
        <RestaurantBrandSelector 
          myRestaurantName={myRestaurantName}
          hasOutlets={hasOutlets}
          selectedOutletId={selectedOutletId}
          setSelectedOutletId={setSelectedOutletId}
          outlets={outlets}
          isCurrentOutletAcceptingOrders={isCurrentOutletAcceptingOrders}
        />

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={toggleOutletStatus}

            className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Toggle Outlet Status"
          >
            {isCurrentOutletAcceptingOrders ? (
              <>
                <ToggleRight className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-[#f0ede6] uppercase tracking-wide">Active</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-[#f0ede6] uppercase tracking-wide">Inactive</span>
              </>
            )}
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
            title="Toggle Light/Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-550" />}
          </button>

          <button
            onClick={() => {
              if (view === 'settings') {
                setView('home');
              } else {
                setView('settings');
                setShowSettings(false);
              }
            }}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              view === 'settings' 
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6]'
            }`}
            title="Profile Settings"
          >
            <User className="w-4 h-4 text-indigo-500" />
          </button>

          <button
            onClick={() => {
              setShowSettings(!showSettings);
              if (view === 'settings') setView('home');
            }}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              showSettings 
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm shadow-rose-500/15' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6]'
            }`}
            title="Restaurant Registration & Menu Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </header>

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
          {/* Tabs Switcher */}
          {!showSettings && (
            <div className="px-5 pt-4">
          <div className="flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-1 rounded-xl border border-rose-500/20 dark:border-rose-500/30 gap-1.5">
            <button
              onClick={() => {
                setActiveTab('orders');
                setShowSettings(false);
              }}
              className={`flex-1 py-2 text-[10.5px] font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'orders' && !showSettings
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm shadow-rose-500/15' 
                  : 'text-slate-500 dark:text-[#f0ede6] hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Live Kitchen Feed ({myOrders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('menu');
                setShowSettings(false);
              }}
              className={`flex-1 py-2 text-[10.5px] font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'menu' && !showSettings
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm shadow-rose-500/15' 
                  : 'text-slate-500 dark:text-[#f0ede6] hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Menu Stock Toggles
            </button>
            <button
              onClick={() => {
                setActiveTab('campaigns');
                setShowSettings(false);
              }}
              className={`flex-1 py-2 text-[10.5px] font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'campaigns' && !showSettings
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm shadow-rose-500/15' 
                  : 'text-slate-500 dark:text-[#f0ede6] hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Ad Campaigns
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!showSettings && activeTab === 'orders' && (
          <motion.div
            key="orders-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 space-y-5"
          >
            <RestaurantStatsBar 
              totalRevenue={totalRevenue} 
              completedOrdersCount={completedOrders.length} 
            />
            <ErrorBoundary fallbackLabel="Order Queue">
              <RestaurantOrderQueue 
                totalRevenue={totalRevenue}
                completedOrders={completedOrders}
                pendingOrders={pendingOrders}
                activePreparing={activePreparing}
                myOrders={internalOrders}
                cardDelayStatus={cardDelayStatus}
                handleCardCancelSubmit={handleCardCancelSubmit}
                handleCardDelaySubmit={handleCardDelaySubmit}
                handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
                handleStatusTransition={handleStatusTransition}
                setSelectedChatOrder={setSelectedChatOrder}
              />
            </ErrorBoundary>
          </motion.div>
        )}

        {!showSettings && activeTab === 'menu' && (
          /* ------------------- MENU STOCK TOGGLES ------------------- */
          <ErrorBoundary fallbackLabel="Menu Stock Toggles">
            <RestaurantMenuTogglesView
              menuList={menuList}
              stockStatus={stockStatus}
              toggleStock={toggleStock}
              selectedOutletId={selectedOutletId}
            />
          </ErrorBoundary>
        )}

        {!showSettings && activeTab === 'campaigns' && (
          <motion.div
            key="campaigns-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ErrorBoundary fallbackLabel="Campaigns">
              <Suspense fallback={<LoadingSkeleton />}>
                <CampaignManagement restaurantId={selectedOutletId} />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}

        {showSettings && (
          /* ------------------- RESTAURANT SETTINGS CONSOLE ------------------- */
          <ErrorBoundary fallbackLabel="Restaurant Settings">
            <Suspense fallback={<LoadingSkeleton />}>
              <RestaurantSettingsShell
                brands={brands}
                outlets={outlets}
                menuList={menuList}
                selectedOutletId={selectedOutletId}
                restaurantId={restaurantId}
                loadData={loadData}
                activeOrders={activeOrders}
                setSelectedChatOrder={setSelectedChatOrder}
                setShowSettings={setShowSettings}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </AnimatePresence>


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
        <ChatWidget 
          orderId={selectedChatOrder.id} 
          order={selectedChatOrder}
          currentUserType="RESTAURANT" 
          otherParticipants={[
            ...(selectedChatOrder.customerId ? [{
              userId: selectedChatOrder.customerId,
              entityType: 'CUSTOMER' as const,
              displayName: selectedChatOrder.customerName || 'Customer'
            }] : []),
            ...(selectedChatOrder.deliveryExecutiveId ? [{
              userId: selectedChatOrder.deliveryExecutiveId,
              entityType: 'DELIVERY' as const,
              displayName: selectedChatOrder.deliveryExecutiveName || selectedChatOrder.riderName || 'Rider'
            }] : [])
          ]}
          onClose={() => setSelectedChatOrder(null)}
          onBack={() => {
            setSelectedChatOrder(null);
            setShowChatList(true);
          }}
        />
      )}
      
      {!selectedChatOrder && (
        <Button
          onClick={() => setShowChatList(true)}
          variant="secondary"
          className="fixed bottom-6 right-6 !bg-slate-800 hover:!bg-slate-700 !text-white px-5 !py-4 !rounded-full shadow-lg transition-transform hover:scale-105 z-40 flex items-center justify-center space-x-2"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="font-bold hidden sm:inline">Messages</span>
        </Button>
      )}

      {showChatList && !selectedChatOrder && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[100dvh] sm:h-[500px] max-h-[100dvh] sm:max-h-[calc(100vh-6rem)] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[50] sm:border sm:border-gray-200">
          <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-lg">Active Chats</h3>
            <Button variant="ghost" onClick={() => setShowChatList(false)} size="icon" className="!text-white hover:!bg-slate-700">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
            {myOrders.length === 0 ? (
              <div className="h-full pt-10">
                <EmptyState 
                  title="No active orders"
                  description="Chats will appear here when you have active orders."
                  icon={<MessageSquare className="w-12 h-12" />}
                />
              </div>
            ) : (
              myOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedChatOrder(order);
                    setShowChatList(false);
                  }}
                  className="w-full text-left bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group"
                >
                  <div className="flex flex-col overflow-hidden pr-2">
                    <span className="font-bold text-slate-800">Order #{order.id.substring(0,8)}</span>
                    <span className="text-sm text-slate-500 truncate">{order.customerName || 'Customer'}</span>
                  </div>
                  <Badge variant="warning" className="group-hover:!bg-amber-600 group-hover:!text-white transition-colors">
                    Chat
                  </Badge>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      
      <CallOverlay />
    </>
      )}
    </div>
  );
}
