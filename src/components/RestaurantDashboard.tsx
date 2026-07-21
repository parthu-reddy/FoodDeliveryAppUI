import React, { useState, useEffect } from 'react';
import { 
  Store, TrendingUp, CheckCircle, Package, RefreshCw, LogOut, 
  ToggleLeft, ToggleRight, DollarSign, Calendar, Eye, MapPin, Sun, Moon,
  Terminal, Sliders, Code, Send, CheckCircle2, AlertCircle,
  ChefHat, Flame, Clock, Info, Shield, HelpCircle, User, Bike, Play, ArrowRight, Sparkles,
  Check, Truck, Settings, Plus, Trash2, Edit3, ChevronLeft, Layers, Utensils, History, ChevronDown, ChevronUp, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, MenuItem } from '../types';

import LaBouffeLogo from './LaBouffeLogo';
import OutletMenuEditor from './OutletMenuEditor';
import OutletRegistration from "./OutletRegistration";
import BrandRegistration from "./BrandRegistration";
import OutletShiftEditor from "./OutletShiftEditor";
import OutletSettingsEditor from "./OutletSettingsEditor";
import BrandMasterMenu from "./BrandMasterMenu";

import { OrderHistory } from "./OrderHistory";

import CompleteProfileModal from './CompleteProfileModal';
import SharedSettingsView from './SharedSettingsView';
import { getUserProfile } from '../lib/tokenStore';

import { apiGet, apiPost, apiPut } from '../lib/apiClient';
import { z } from 'zod';

const delaySchema = z.object({
  additionalPrepTime: z.number().int().positive().max(120, 'Delay cannot exceed 120 minutes'),
  delayReason: z.string().max(255, 'Reason must be under 255 characters').optional()
});
import { toFrontendStatus, toBackendStatus } from '../lib/statusMapper';
import { 
  getBrands, getOutlets, 
  getMasterMenuItems, 
  getOutletOverrides, getEffectiveMenu 
} from '../lib/menuStore';

interface RestaurantDashboardProps {
  restaurantId: string;
  activeOrders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, payload?: any) => void;
  onLogout: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onAddApiLog?: (log: any) => void;
}

// Utility to determine if order is actively tracked
const isActiveOrder = (status: string) => {
  const s = (status || '').trim().toUpperCase();
  return ![OrderStatus.DELIVERED, OrderStatus.PARTIALLY_REFUNDED, OrderStatus.CANCELLED_AND_REFUNDED, OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_RESTAURANT, 'cancelled_by_restaurant', OrderStatus.DELIVERY_FAILED, OrderStatus.CANCELLED].includes(s);
};

const isFailedOrder = (status: string) => {
  const s = (status || '').trim().toUpperCase();
  return [OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_RESTAURANT, 'cancelled_by_restaurant', OrderStatus.DELIVERY_FAILED, OrderStatus.CANCELLED, OrderStatus.PARTIALLY_REFUNDED, OrderStatus.CANCELLED_AND_REFUNDED].includes(s);
};

export default function RestaurantDashboard({
  restaurantId,
  activeOrders: externalOrders,
  onUpdateOrderStatus: externalUpdateStatus,
  onLogout,
  theme = 'light',
  onToggleTheme,
  onAddApiLog
}: RestaurantDashboardProps) {

  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const activeOrders = externalOrders ?? internalOrders;

  const onUpdateOrderStatus = externalUpdateStatus ?? (async (orderId: string, status: OrderStatus, payload?: any) => {
    // Optimistic UI update
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    // API call
    try {
      let endpoint = '';
      if (status === OrderStatus.ACCEPTED) endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/accept`;
      else if (status === OrderStatus.PREPARING) {
        endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/prepare`;
        localStorage.setItem(`order_preparing_${orderId}`, 'true');
      }
      else if (status === OrderStatus.CANCELLED_BY_RESTAURANT) endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/reject`;
      else if (status === OrderStatus.READY) {
        endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/ready`;
        localStorage.removeItem(`order_preparing_${orderId}`);
      }
      else if (status === OrderStatus.DISPATCHED) endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/dispatch`;
      else if (status === OrderStatus.CANCELLED) endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/cancel`;
      
      console.log(`[Dashboard] Updating order ${orderId} to ${status}. Endpoint: ${endpoint}`);

      if (endpoint) {
        await apiPost(endpoint, payload);
        if (onAddApiLog) {
          onAddApiLog({ id: `update_${orderId}`, label: `POST ${endpoint}`, method: 'POST' });
        }
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      // Revert optimistic update on failure (ideally, would need the old status)
    }
  });
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [settingsTab, setSettingsTab] = useState<"menu-editor" | "outlets" | "history">("menu-editor");
  const [apiPrepSeconds, setApiPrepSeconds] = useState('15');


  const [showSettings, setShowSettings] = useState(false);
  const [editingOutletShifts, setEditingOutletShifts] = useState<any | null>(null);
  const [editingOutletSettings, setEditingOutletSettings] = useState<any | null>(null);
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

  // Cancel order state
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [customCancelReasonText, setCustomCancelReasonText] = useState<Record<string, string>>({});

  // Fetch restaurant profile
  useEffect(() => {
    const p = getUserProfile();
    if (p) setEditPhone(p.phoneNumber || '');

    apiGet(`/api/v1/users/profile`)
      .then(res => {
        if (res.data) {
          const profile = res.data;
          if (profile.name) setEditName(profile.name);
          if (profile.email) setEditEmail(profile.email);
          if (!profile.name || !profile.email || profile.name.trim() === '' || profile.email.trim() === '') {
            setShowCompleteProfileModal(true);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Fetch restaurant orders with polling
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isCancelled = false;
    
    const fetchOrders = () => {
      if (selectedOutletId) {
        apiGet(`/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/active`)
                    .then(res => {
            if (isCancelled) return;
            if (res.data) {
              const mapped = res.data.map((o: any) => {
                let s = o.status?.toUpperCase() || '';
                if (s === OrderStatus.CREATED || s === OrderStatus.PAID) {
                  if (o.additionalPrepTime && o.additionalPrepTime > 10) {
                    s = OrderStatus.ON_HOLD;
                  } else {
                    s = OrderStatus.PAID;
                  }
                }
                if (s === OrderStatus.READY || s === 'READY') s = OrderStatus.READY;
                if (s === OrderStatus.CANCELLED_BY_RESTAURANT || s === OrderStatus.CANCELLED || s === 'CANCELLED_BY_RESTAURANT' || s === OrderStatus.DELIVERY_FAILED) s = OrderStatus.CANCELLED;
                if (s === OrderStatus.DELIVERED) s = OrderStatus.DELIVERED;
                
                let parsedItems = o.items || [];
                if (o.itemsJson) {
                    try { parsedItems = JSON.parse(o.itemsJson); } catch (e) {}
                }
                let calculatedTotal = parsedItems.reduce((acc: number, item: any) => acc + (item.item?.price || item.price || 0) * (item.quantity || 1), 0);
                
                return { 
                  ...o, 
                  id: o.orderId || o.id, 
                  status: s, 
                  items: parsedItems,
                  total: o.total || o.totalAmount || calculatedTotal,
                  subtotal: o.subtotal || calculatedTotal,
                  customerName: o.customerName || 'Customer'
                };
              });
              setInternalOrders(prev => {
                return mapped.map((newOrder: any) => {
                  const oldOrder = prev.find(p => p.id === newOrder.id);
                  const isLocallyPreparing = localStorage.getItem(`order_preparing_${newOrder.id}`) === 'true';
                  if (isLocallyPreparing && newOrder.status === OrderStatus.ACCEPTED) {
                    return { ...newOrder, status: OrderStatus.PREPARING };
                  }
                  return newOrder;
                });
              });
            }
          })
          .catch(console.error)
          .finally(() => {
            if (!isCancelled) {
              timeout = setTimeout(fetchOrders, 5000);
            }
          });
      }
    };

    // Initial fetch
    fetchOrders();

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [selectedOutletId]);

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
        setSettingsTab("outlets");
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

  useEffect(() => {
    loadData();
  }, [selectedOutletId]);

  const [stockStatus, setStockStatus] = useState<Record<string, boolean>>({});



  // Two-tier Menu system states
  const [editorSubTab, setEditorSubTab] = useState<'master' | 'override'>('master');
  const [rightCatalogView, setRightCatalogView] = useState<'effective' | 'master' | 'override'>('effective');

  // Master Menu Item fields
  const [masterBrandId, setMasterBrandId] = useState('11111111-1111-1111-1111-111111111111');
  const [masterDishName, setMasterDishName] = useState('');
  const [masterDishPrice, setMasterDishPrice] = useState('');
  const [masterPrepTime, setMasterPrepTime] = useState('15');
  const [masterDishDescription, setMasterDishDescription] = useState('');
  const [masterDishCategory, setMasterDishCategory] = useState('Burgers');
  const [masterDishImage, setMasterDishImage] = useState('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80');
  const [masterDishIsVeg, setMasterDishIsVeg] = useState(false);

  // Outlet Override fields
  const [overrideOutletId, setOverrideOutletId] = useState(selectedOutletId || '');
  const [overrideMasterItemId, setOverrideMasterItemId] = useState('');
  const [overridePrice, setOverridePrice] = useState('');
  const [overrideActive, setOverrideActive] = useState(true);

  const [isAcceptingOrders, setIsAcceptingOrders] = useState<Record<string, boolean>>({});
  const hasOutlets = outlets.length > 0;
  const isCurrentOutletAcceptingOrders = hasOutlets && (isAcceptingOrders[selectedOutletId] ?? true);

  const toggleOutletStatus = async () => {
    if (!selectedOutletId) return;
    const newStatus = !isCurrentOutletAcceptingOrders;
    try {
        await apiPut(`/api/v1/outlets/${selectedOutletId}/status`, { isActive: newStatus });
        setIsAcceptingOrders(prev => ({ ...prev, [selectedOutletId]: newStatus }));
    } catch (err: any) {
        alert(err.message || "Failed to update outlet status");
    }
  };

  // Filter orders meant for this restaurant
  const allRestaurantOrders = activeOrders.filter(o => o.restaurantId === selectedOutletId);
  
  // Separate into active and history
  const myOrders = allRestaurantOrders.filter(o => isActiveOrder(o.status || ''));
  const historyOrders = allRestaurantOrders.filter(o => !isActiveOrder(o.status || ''));

  const pendingOrders = myOrders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.ON_HOLD);
  const activePreparing = myOrders.filter(o => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING);
  const completedOrders = historyOrders.filter(o => o.status === OrderStatus.DELIVERED);

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
      alert('Failed to update stock status.');
    }
  };


  // States for inline delay requests on Kanban cards
  const [delayingOrderId, setDelayingOrderId] = useState<string | null>(null);
  const [customDelayMinutes, setCustomDelayMinutes] = useState<Record<string, string>>({});
  const [customDelayReasonText, setCustomDelayReasonText] = useState<Record<string, string>>({});
  const [cardDelayStatus, setCardDelayStatus] = useState<Record<string, { minutes: number; reason: string }>>({});


  const handleStatusTransition = (order: Order) => {
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.ON_HOLD) {
      onUpdateOrderStatus(order.id, OrderStatus.ACCEPTED);
    } else if (order.status as any === OrderStatus.ACCEPTED) {
      onUpdateOrderStatus(order.id, OrderStatus.PREPARING);
    } else if (order.status as any === OrderStatus.PREPARING) {
      onUpdateOrderStatus(order.id, OrderStatus.READY);
    }
  };

  const handleCardCancelSubmit = async (orderId: string) => {
    const reason = customCancelReasonText[orderId] || 'No reason provided';
    const orderStatus = internalOrders.find(o => o.id === orderId)?.status;
    const targetStatus = (orderStatus === OrderStatus.PAID || orderStatus === OrderStatus.ON_HOLD) 
      ? OrderStatus.CANCELLED_BY_RESTAURANT 
      : OrderStatus.CANCELLED;
    
    try {
      await onUpdateOrderStatus(orderId, targetStatus as any, { reason });
      setCancellingOrderId(null);
    } catch (e) {
      console.error('Failed to cancel order', e);
      alert('Failed to cancel order.');
    }
  };

  const handleCardDelaySubmit = async (orderId: string) => {
    const minutes = parseInt(customDelayMinutes[orderId] || '15', 10);
    const reason = customDelayReasonText[orderId] || 'High Kitchen Load';
    const seconds = minutes * 60;

    const endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/accept`;
    const body = {
      additionalPrepTime: minutes,
      delayReason: reason
    };

    const validation = delaySchema.safeParse(body);
    if (!validation.success) {
      alert(validation.error.issues[0].message);
      return;
    }

    try {
      await apiPost(endpoint, body);
      
      setCardDelayStatus(prev => ({
        ...prev,
        [orderId]: { minutes, reason }
      }));
      
      if (minutes > 10) {
        // Optimistic update
        setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.ON_HOLD } : o));
        if (externalUpdateStatus) externalUpdateStatus(orderId, OrderStatus.ON_HOLD);
      } else {
        // Accept right away if <= 10 mins
        setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.ACCEPTED } : o));
        if (externalUpdateStatus) externalUpdateStatus(orderId, OrderStatus.ACCEPTED);
      }
      
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
    } catch (e) {
      console.error('Failed to submit delay / accept order', e);
      alert('Failed to submit delay request.');
    }
    
    setDelayingOrderId(null);
  };

  const myRestaurantName = outlets.length > 0 
    ? (outlets.find(r => r.id === selectedOutletId)?.name || 'My Restaurant') 
    : 'No Outlet Registered';

  const selectedOutletBrandId = brands.length > 0 ? brands[0].id : null;

  return (
    <div className="flex-1 flex flex-col w-full overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
      
      {/* Header Area */}
      <header className="sticky top-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
        <div className="flex items-center gap-3.5 flex-wrap">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs" subColorClass="text-rose-500 text-[8px]" />
          <div className="hidden sm:flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xs tracking-tight leading-none text-slate-900 dark:text-[#f0ede6]">{myRestaurantName}</h3>
                {hasOutlets && (
                  <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-[#f0ede6] focus:outline-none"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isCurrentOutletAcceptingOrders ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-[9px] font-bold font-mono ${isCurrentOutletAcceptingOrders ? 'text-emerald-400' : 'text-red-400'}`}>
                  {hasOutlets ? (isCurrentOutletAcceptingOrders ? 'ACCEPTING LIVE ORDERS' : 'STORE OFFLINE') : 'SETUP REQUIRED'}
                </span>
              </div>
            </div>
          </div>
        </div>

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
          
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
              title="Toggle Light/Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-550" />}
            </button>
          )}

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
          <SharedSettingsView
            onBack={() => setView('home')}
            theme={theme}
            onLogout={onLogout}
          />
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
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!showSettings && activeTab === 'orders' && (
          /* ------------------- ORDERS TAB ------------------- */
          <motion.div
            key="orders-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 space-y-5"
          >
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="p-3 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">Today's Sales</span>
                  <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">${totalRevenue.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">Completed</span>
                  <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">{completedOrders.length} orders</span>
                </div>
              </div>
            </div>

            {/* Live Orders Kanban Board */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-[#f0ede6] uppercase font-sans flex items-center gap-2">
                    <Sliders className="w-4.5 h-4.5 text-rose-500" />
                    <span>Kitchen Kanban Board</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-300">Manage orders through standard operations. Swiping/scrolling available.</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-rose-500/20 dark:border-rose-500/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <RefreshCw className="w-3 h-3 animate-spin text-rose-500" />
                  <span>Auto-Sync Gateway</span>
                </div>
              </div>

              {/* Responsive Kanban Columns */}
              <div className="flex gap-4 pb-6 w-full overflow-x-auto touch-pan-x snap-x snap-mandatory scrollbar-thin scrollbar-thumb-rose-500/30 scrollbar-track-transparent ">
                
                {/* COLUMN 1: Placed Orders (Just Got Placed) */}
                <div className="w-[85%] xs:w-[310px] sm:w-[350px]  shrink-0 snap-center flex flex-col bg-slate-50/50 dark:bg-slate-950/40 border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-3xl min-h-[480px]">
                  <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">New Placed</span>
                    </div>
                    <span className="text-[10px] font-black font-mono bg-amber-500/10 text-amber-550 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      {pendingOrders.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {pendingOrders.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                        <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">No pending orders</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 max-w-[180px]">When customers place live orders, they will ping in this slot instantly.</p>
                      </div>
                    ) : (
                      pendingOrders.slice().reverse().map(order => (
                        <motion.div 
                          key={order.id}
                          layoutId={`card-${order.id}`}
                          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl shadow-sm space-y-3.5 relative overflow-hidden ring-1 ring-amber-500/10"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-mono font-bold text-orange-500">#{order.id.substring(0, 8)}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium block">{order.timestamp}</span>
                            </div>
                            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase border ${order.status === OrderStatus.ON_HOLD ? 'bg-red-500/10 text-red-500 border-red-500/25' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase'}`}>
                              {order.status === OrderStatus.ON_HOLD ? 'ON HOLD' : 'PLACED'}
                            </span>
                          </div>

                          {/* Customer info */}
                          <div className="text-[11px] bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 space-y-1">
                            <p className="font-bold text-slate-700 dark:text-[#f0ede6] flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400 dark:text-slate-300" />
                              <span>{order.customerName}</span>
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-300">
                              <MapPin className="w-3 h-3 text-rose-450" />
                              <span className="truncate">{order.deliveryAddress}</span>
                            </div>
                            {order.estimatedCompletionTime && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1">
                                <Clock className="w-3 h-3" />
                                <span>ETA: {new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Items */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 dark:text-slate-300 font-extrabold uppercase font-mono">Dishes ({order.items.length})</span>
                            <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin pl-1">
                              {order.items.map((cartItem: any, idx: number) => (
                                <div key={cartItem.item?.id || idx} className="flex justify-between text-[11px]">
                                  <span className="text-slate-600 dark:text-[#f0ede6]">
                                    <span className="font-bold text-amber-550 pr-1">{cartItem.quantity || 1}x</span> {cartItem.item?.name || cartItem.name || 'Item'}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-300 font-mono">${((cartItem.item?.price || cartItem.price || 0) * (cartItem.quantity || 1)).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delay Badge Tag */}
                          {cardDelayStatus[order.id] && (
                            <div className="bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[10px] font-bold p-2 rounded-xl border border-amber-500/15 flex items-center gap-1.5 animate-pulse">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Revised ETA (+{cardDelayStatus[order.id].minutes} min) logged with API</span>
                            </div>
                          )}

                          <div className="pt-2.5 border-t border-rose-500/20 dark:border-rose-500/30 flex flex-col gap-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase font-mono">Total Value:</span>
                              <span className="text-sm font-black text-slate-850 dark:text-[#f0ede6] font-mono">${order.total?.toFixed(2)}</span>
                            </div>

                            {/* Action Row */}
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => setCancellingOrderId(cancellingOrderId === order.id ? null : order.id)}
                                className="py-2 px-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10.5px] font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1 shrink-0"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                              
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <button
                                  onClick={() => {
                                    setDelayingOrderId(delayingOrderId === order.id ? null : order.id);
                                    // Pre-populate delay states
                                    if (!customDelayMinutes[order.id]) {
                                      setCustomDelayMinutes(p => ({ ...p, [order.id]: '15' }));
                                    }
                                    if (!customDelayReasonText[order.id]) {
                                      setCustomDelayReasonText(p => ({ ...p, [order.id]: 'High custom cooking volume' }));
                                    }
                                  }}
                                  className="py-2 px-1 rounded-xl border border-rose-500/20 dark:border-rose-500/30 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-[#f0ede6] text-[10px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
                                >
                                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="truncate">Delay</span>
                                </button>
                                
                                <button
                                  onClick={() => handleStatusTransition(order)}
                                  className="py-2 px-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-md shadow-orange-500/10 hover:brightness-110 transition-all cursor-pointer border border-white/5"
                                >
                                  <Check className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Accept</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Cancel Drawer */}
                            {cancellingOrderId === order.id && (
                              <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                  <label className="text-[9px] font-bold font-mono text-red-400 dark:text-red-300 uppercase">Reason for cancellation</label>
                                  <input 
                                    type="text" 
                                    className="w-full mt-1 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                                    placeholder="e.g. Out of stock, Kitchen busy..."
                                    value={customCancelReasonText[order.id] || ''}
                                    onChange={(e) => setCustomCancelReasonText(p => ({ ...p, [order.id]: e.target.value }))}
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => setCancellingOrderId(null)}
                                    className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    Back
                                  </button>
                                  <button
                                    onClick={() => handleCardCancelSubmit(order.id)}
                                    className="flex-1 py-1.5 text-[10px] font-bold bg-red-500 text-white rounded-lg shadow-sm shadow-red-500/20 hover:bg-red-600 transition-colors"
                                  >
                                    Confirm Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Inline delay request drawer */}
                            <AnimatePresence>
                              {delayingOrderId === order.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden border-t border-rose-500/20 dark:border-rose-500/30 pt-2.5 mt-1 space-y-2.5"
                                >
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Delay Duration</label>
                                    <div className="grid grid-cols-4 gap-1">
                                      {['5', '10', '15', '20'].map(m => (
                                        <button
                                          key={m}
                                          type="button"
                                          onClick={() => setCustomDelayMinutes(p => ({ ...p, [order.id]: m }))}
                                          className={`py-1 text-[10px] font-mono font-bold rounded-lg border cursor-pointer transition-all ${
                                            customDelayMinutes[order.id] === m
                                              ? 'bg-amber-500 border-transparent text-white'
                                              : 'bg-slate-50 dark:bg-slate-955 border-rose-500/20 dark:border-rose-500/30 text-slate-400 dark:text-slate-300'
                                          }`}
                                        >
                                          +{m} Min
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Reason for delay</label>
                                    <input 
                                      type="text"
                                      value={customDelayReasonText[order.id] || ''}
                                      onChange={(e) => setCustomDelayReasonText(p => ({ ...p, [order.id]: e.target.value }))}
                                      className="w-full px-2 py-1 text-[10px] rounded-lg border border-rose-500/20 dark:border-rose-500/30 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-[#f0ede6] outline-none"
                                      placeholder="e.g. High custom baking orders"
                                      required
                                    />
                                  </div>

                                  <button
                                    onClick={() => handleCardDelaySubmit(order.id)}
                                    className="w-full py-1.5 bg-slate-900 dark:bg-slate-850 hover:bg-black dark:hover:bg-slate-800 text-white text-[9.5px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Send className="w-3 h-3 text-rose-450" />
                                    <span>Submit Delay</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 2: Requested Delay (On Hold) */}
                <div className="w-[85%] xs:w-[310px] sm:w-[350px]  shrink-0 snap-center flex flex-col bg-slate-50/50 dark:bg-slate-950/40 border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-3xl min-h-[480px]">
                  <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">Requested Delay</span>
                    </div>
                    <span className="text-[10px] font-black font-mono bg-red-500/10 text-red-500 px-2.5 py-0.5 rounded-full border border-red-500/20">
                      {myOrders.filter(o => o.status === OrderStatus.ON_HOLD).length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {myOrders.filter(o => o.status === OrderStatus.ON_HOLD).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                        <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">No delayed orders</p>
                      </div>
                    ) : (
                      myOrders.filter(o => o.status === OrderStatus.ON_HOLD).slice().reverse().map(order => (
                        <motion.div 
                          key={order.id}
                          layoutId={`card-${order.id}`}
                          className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/50 p-4 rounded-2xl shadow-sm space-y-3.5 relative overflow-hidden ring-1 ring-red-500/10"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-mono font-bold text-red-500">#{order.id.substring(0, 8)}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium block">{order.timestamp}</span>
                            </div>
                            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase border bg-red-500/10 text-red-500 border-red-500/25">
                              ON HOLD
                            </span>
                          </div>

                          {/* Customer info */}
                          <div className="text-[11px] bg-white/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 space-y-1">
                            <p className="font-bold text-slate-700 dark:text-[#f0ede6] flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400 dark:text-slate-300" />
                              <span>{order.customerName}</span>
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-300">
                              <MapPin className="w-3 h-3 text-rose-450" />
                              <span className="truncate">{order.deliveryAddress}</span>
                            </div>
                            {order.estimatedCompletionTime && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1">
                                <Clock className="w-3 h-3" />
                                <span>ETA: {new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Items */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 dark:text-slate-300 font-extrabold uppercase font-mono">Dishes ({order.items.length})</span>
                            <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin pl-1">
                              {order.items.map((cartItem: any, idx: number) => (
                                <div key={cartItem.item?.id || idx} className="flex justify-between text-[11px]">
                                  <span className="text-slate-600 dark:text-[#f0ede6]">
                                    <span className="font-bold text-amber-550 pr-1">{cartItem.quantity || 1}x</span> {cartItem.item?.name || cartItem.name || 'Item'}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-300 font-mono">${((cartItem.item?.price || cartItem.price || 0) * (cartItem.quantity || 1)).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delay Badge Tag */}
                          {cardDelayStatus[order.id] && (
                            <div className="bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[10px] font-bold p-2 rounded-xl border border-amber-500/15 flex items-center gap-1.5 animate-pulse">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Revised ETA (+{cardDelayStatus[order.id].minutes} min) logged with API</span>
                            </div>
                          )}

                          <div className="pt-2.5 border-t border-rose-500/20 dark:border-rose-500/30 flex flex-col gap-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase font-mono">Total Value:</span>
                              <span className="text-sm font-black text-slate-850 dark:text-[#f0ede6] font-mono">${order.total?.toFixed(2)}</span>
                            </div>

                            {/* Action Row */}
                            <div className="flex gap-2 w-full mt-2">
                              <button
                                onClick={() => setCancellingOrderId(cancellingOrderId === order.id ? null : order.id)}
                                className="py-2 px-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10.5px] font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1 shrink-0"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleStatusTransition(order)}
                                className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-md shadow-orange-500/10 hover:brightness-110 transition-all cursor-pointer border border-white/5"
                              >
                                <Check className="w-3 h-3 shrink-0" />
                                <span>Accept Order</span>
                              </button>
                            </div>
                            
                            {/* Cancel Drawer */}
                            {cancellingOrderId === order.id && (
                              <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                  <label className="text-[9px] font-bold font-mono text-red-400 dark:text-red-300 uppercase">Reason for cancellation</label>
                                  <input 
                                    type="text" 
                                    className="w-full mt-1 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                                    placeholder="e.g. Out of stock, Kitchen busy..."
                                    value={customCancelReasonText[order.id] || ''}
                                    onChange={(e) => setCustomCancelReasonText(p => ({ ...p, [order.id]: e.target.value }))}
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => setCancellingOrderId(null)}
                                    className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    Back
                                  </button>
                                  <button
                                    onClick={() => handleCardCancelSubmit(order.id)}
                                    className="flex-1 py-1.5 text-[10px] font-bold bg-red-500 text-white rounded-lg shadow-sm shadow-red-500/20 hover:bg-red-600 transition-colors"
                                  >
                                    Confirm Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 3: Kitchen Preparing (Accepted or Preparing) */}
                <div className="w-[85%] xs:w-[310px] sm:w-[350px]  shrink-0 snap-center flex flex-col bg-slate-50/50 dark:bg-slate-950/40 border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-3xl min-h-[480px]">
                  <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">Cooking Feed</span>
                    </div>
                    <span className="text-[10px] font-black font-mono bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                      {activePreparing.length}
                    </span>
                  </div>

                  {/* Body - Scrollable list */}
                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {activePreparing.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                        <ChefHat className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">Kitchen is idle</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 max-w-[180px]">Accepted tickets appear here. Start cooking to alert couriers!</p>
                      </div>
                    ) : (
                      activePreparing.slice().reverse().map(order => (
                        <motion.div 
                          key={order.id}
                          layoutId={`card-${order.id}`}
                          className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border p-4 rounded-2xl shadow-sm space-y-3.5 relative overflow-hidden transition-all ${
                            order.status as any === OrderStatus.PREPARING
                              ? 'ring-1 ring-orange-500/20 border-orange-500/30 bg-orange-500/[0.01]'
                              : 'border-rose-500/20 dark:border-rose-500/30'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-mono font-bold text-orange-500">#{order.id.substring(0, 8)}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium block">{order.timestamp}</span>
                            </div>
                            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase border ${
                              order.status as any === OrderStatus.PREPARING 
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider flex items-center gap-1' 
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider'
                            }`}>
                              {order.status as any === OrderStatus.PREPARING && <Flame className="w-3 h-3 text-orange-500 animate-bounce" />}
                              <span>{order.status as any === OrderStatus.PREPARING ? 'COOKING' : 'ACCEPTED'}</span>
                            </span>
                          </div>

                          {/* Customer/ETA summary */}
                          <div className="text-[11px] bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 space-y-1">
                            <p className="font-bold text-slate-700 dark:text-[#f0ede6]">Customer: {order.customerName}</p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-300">
                              <Clock className="w-3 h-3 text-orange-400" />
                              <span>ETA: {order.estimatedCompletionTime ? new Date(order.estimatedCompletionTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '~20 mins'}</span>
                            </div>
                          </div>

                          {/* Ordered Items */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 dark:text-slate-300 font-extrabold uppercase font-mono">Dishes ({order.items.length})</span>
                            <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin pl-1">
                              {order.items.map((cartItem: any, idx: number) => (
                                <div key={cartItem.item?.id || idx} className="flex justify-between text-[11px]">
                                  <span className="text-slate-600 dark:text-[#f0ede6] font-medium">
                                    <span className="font-mono text-orange-500 font-bold pr-1">{cartItem.quantity || 1}x</span> {cartItem.item?.name || cartItem.name || 'Item'}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-300 font-mono">${((cartItem.item?.price || cartItem.price || 0) * (cartItem.quantity || 1)).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-2.5 border-t border-rose-500/20 dark:border-rose-500/30 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block">Order Value</span>
                                <span className="text-xs font-bold text-slate-850 dark:text-[#f0ede6] font-mono">${order.total?.toFixed(2)}</span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setCancellingOrderId(cancellingOrderId === order.id ? null : order.id)}
                                  className="py-2 px-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10.5px] font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>

                                {order.status as any === OrderStatus.ACCEPTED ? (
                                  <button
                                    onClick={() => handleStatusTransition(order)}
                                    className="py-2 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-950 text-[10.5px] font-black rounded-xl hover:brightness-110 shadow-sm shadow-yellow-500/10 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3 text-slate-950 fill-slate-950" />
                                    <span>Start Cook</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusTransition(order)}
                                    className="py-2 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10.5px] font-black rounded-xl hover:brightness-110 shadow-md shadow-orange-500/10 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Mark Prepared</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Cancel Drawer */}
                            {cancellingOrderId === order.id && (
                              <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                  <label className="text-[9px] font-bold font-mono text-red-400 dark:text-red-300 uppercase">Reason for cancellation</label>
                                  <input 
                                    type="text" 
                                    className="w-full mt-1 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                                    placeholder="e.g. Out of stock, Kitchen busy..."
                                    value={customCancelReasonText[order.id] || ''}
                                    onChange={(e) => setCustomCancelReasonText(p => ({ ...p, [order.id]: e.target.value }))}
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => setCancellingOrderId(null)}
                                    className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    Back
                                  </button>
                                  <button
                                    onClick={() => handleCardCancelSubmit(order.id)}
                                    className="flex-1 py-1.5 text-[10px] font-bold bg-red-500 text-white rounded-lg shadow-sm shadow-red-500/20 hover:bg-red-600 transition-colors"
                                  >
                                    Confirm Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 4: Prepared & Ready (Dispatched, awaiting pickup) */}
                <div className="w-[85%] xs:w-[310px] sm:w-[350px]  shrink-0 snap-center flex flex-col bg-slate-50/50 dark:bg-slate-950/40 border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-3xl min-h-[480px]">
                  <div className="flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">Prepared Ready</span>
                    </div>
                    <span className="text-[10px] font-black font-mono bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {myOrders.filter(o => o.status === OrderStatus.READY).length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {myOrders.filter(o => o.status === OrderStatus.READY).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                        <Truck className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">No ready packages</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 max-w-[180px]">Finished dishes will wait here. Handover to couriers with secure codes.</p>
                      </div>
                    ) : (
                      myOrders.filter(o => o.status === OrderStatus.READY).slice().reverse().map(order => (
                        <motion.div 
                          key={order.id}
                          layoutId={`card-${order.id}`}
                          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl shadow-sm space-y-3.5 relative overflow-hidden ring-1 ring-emerald-500/10"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-mono font-bold text-emerald-500">#{order.id.substring(0, 8)}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium block">{order.timestamp}</span>
                            </div>
                            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider">
                              READY
                            </span>
                          </div>

                          {/* Handover OTP shield badge */}
                          <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 dark:from-emerald-500/5 dark:to-indigo-500/5 border border-emerald-550/15 p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                            <div className="flex items-center gap-1.5 text-[10.5px]">
                              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="font-extrabold text-slate-700 dark:text-[#f0ede6]">Handover OTP:</span>
                            </div>
                            <span className="font-extrabold text-xs text-indigo-500 font-mono tracking-wider bg-white/50 dark:bg-slate-950/50 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                              {order.pickupOtp || "1111"}
                            </span>
                          </div>

                          {/* Rider Assignments Info */}
                          <div className="text-[11px] bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-300 border-b border-rose-500/20 pb-1">
                              <span>COURIER DISPATCH</span>
                              <span className="font-bold flex items-center gap-0.5 text-indigo-400">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                                {order.riderName ? 'ASSIGNED' : 'SEARCHING'}
                              </span>
                            </div>
                            {order.riderName ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-550">
                                  <Bike className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-750 dark:text-[#f0ede6] leading-none">{order.riderName}</p>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-300 font-mono mt-0.5 block">{order.riderPhone}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 py-0.5 text-slate-450">
                                <RefreshCw className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 animate-spin shrink-0" />
                                <span className="text-[10px]">Awaiting system courier pickup signal...</span>
                              </div>
                            )}
                          </div>

                          {/* Dishes List Summary */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 dark:text-slate-300 font-extrabold uppercase font-mono">Dishes ({order.items.length})</span>
                            <div className="space-y-1 max-h-[80px] overflow-y-auto scrollbar-thin pl-1">
                              {order.items.map((cartItem: any, idx: number) => (
                                <div key={cartItem.item?.id || idx} className="flex justify-between text-[11px]">
                                  <span className="text-slate-500 dark:text-slate-350 truncate max-w-[130px]">{cartItem.item?.name || cartItem.name || 'Item'}</span>
                                  <span className="text-slate-400 dark:text-slate-300 font-mono font-bold pr-1">{cartItem.quantity || 1}x</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Cancel Action */}
                          <div className="pt-2.5 border-t border-rose-500/20 dark:border-rose-500/30">
                            <div className="flex justify-end">
                              <button
                                onClick={() => setCancellingOrderId(cancellingOrderId === order.id ? null : order.id)}
                                className="py-2 px-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10.5px] font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1 shrink-0"
                              >
                                <XCircle className="w-3.5 h-3.5" /> <span>Cancel Order</span>
                              </button>
                            </div>
                            
                            {/* Cancel Drawer */}
                            {cancellingOrderId === order.id && (
                              <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                  <label className="text-[9px] font-bold font-mono text-red-400 dark:text-red-300 uppercase">Reason for cancellation</label>
                                  <input 
                                    type="text" 
                                    className="w-full mt-1 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                                    placeholder="e.g. Item dropped, Customer dispute..."
                                    value={customCancelReasonText[order.id] || ''}
                                    onChange={(e) => setCustomCancelReasonText(p => ({ ...p, [order.id]: e.target.value }))}
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => setCancellingOrderId(null)}
                                    className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    Back
                                  </button>
                                  <button
                                    onClick={() => handleCardCancelSubmit(order.id)}
                                    className="flex-1 py-1.5 text-[10px] font-bold bg-red-500 text-white rounded-lg shadow-sm shadow-red-500/20 hover:bg-red-600 transition-colors"
                                  >
                                    Confirm Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 5: Being Delivered (Picked up) */}
                <div className="w-[85%] xs:w-[310px] sm:w-[350px] shrink-0 snap-center flex flex-col bg-slate-50/50 dark:bg-slate-950/40 border border-purple-500/20 dark:border-purple-500/30 p-4 rounded-3xl min-h-[480px]">
                  <div className="flex items-center justify-between border-b border-purple-500/20 dark:border-purple-500/30 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase font-sans tracking-wide">Being Delivered</span>
                    </div>
                    <span className="text-[10px] font-black font-mono bg-purple-500/10 text-purple-650 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                      {myOrders.filter(o => o.status === OrderStatus.DISPATCHED).length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {myOrders.filter(o => o.status === OrderStatus.DISPATCHED).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-purple-500/20 dark:border-purple-500/30 rounded-2xl">
                        <Bike className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">No orders in transit</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 max-w-[180px]">Orders picked up by riders will appear here until delivered.</p>
                      </div>
                    ) : (
                      myOrders.filter(o => o.status === OrderStatus.DISPATCHED).slice().reverse().map(order => (
                        <motion.div 
                          key={order.id}
                          layoutId={`card-${order.id}`}
                          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-purple-500/20 dark:border-purple-500/30 p-4 rounded-2xl shadow-sm space-y-3.5 relative overflow-hidden ring-1 ring-purple-500/10"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-mono font-bold text-purple-500">#{order.id.substring(0, 8)}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium block">{order.timestamp}</span>
                            </div>
                            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.4)] dark:shadow-[0_0_12px_rgba(168,85,247,0.5)] uppercase tracking-wider">
                              PICKED UP
                            </span>
                          </div>

                          {/* Rider Assignments Info */}
                          <div className="text-[11px] bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-purple-500/20 dark:border-purple-500/30 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-300 border-b border-purple-500/20 pb-1">
                              <span>COURIER STATUS</span>
                              <span className="font-bold flex items-center gap-0.5 text-indigo-400">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                                IN TRANSIT
                              </span>
                            </div>
                            {order.riderName && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-550">
                                  <Bike className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-750 dark:text-[#f0ede6] leading-none">{order.riderName}</p>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-300 font-mono mt-0.5 block">{order.riderPhone}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Dishes List Summary */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 dark:text-slate-300 font-extrabold uppercase font-mono">Dishes ({order.items.length})</span>
                            <div className="space-y-1 max-h-[80px] overflow-y-auto scrollbar-thin pl-1">
                              {order.items.map((cartItem: any, idx: number) => (
                                <div key={cartItem.item?.id || idx} className="flex justify-between text-[11px]">
                                  <span className="text-slate-500 dark:text-slate-350 truncate max-w-[130px]">{cartItem.item?.name || cartItem.name || 'Item'}</span>
                                  <span className="text-slate-400 dark:text-slate-300 font-mono font-bold pr-1">{cartItem.quantity || 1}x</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {!showSettings && activeTab === 'menu' && (
          /* ------------------- MENU STOCK TOGGLES ------------------- */
          <motion.div
            key="menu-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 space-y-4"
          >
            <div className="space-y-1">
              <h4 className="font-bold text-lg">In-Stock Dish Toggles</h4>
              <p className="text-xs text-slate-400 dark:text-slate-300">Instantly toggle dishes to "Out of Stock" to lock them in customer views.</p>
            </div>

            <div className="space-y-6">
              {Object.entries(menuList.reduce((acc, dish) => {
                const cat = dish.categoryName || 'Uncategorized';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(dish);
                return acc;
              }, {} as Record<string, MenuItem[]>)).map(([category, dishes]) => (
                <div key={category} className="space-y-3">
                  <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-300 uppercase tracking-widest">{category}</h5>
                  <div className="space-y-3">
                    {(dishes as MenuItem[]).map(dish => {
                      const available = stockStatus[`${selectedOutletId}_${dish.id}`] !== undefined 
                          ? stockStatus[`${selectedOutletId}_${dish.id}`] 
                          : dish.isAvailable !== false;
                      return (
                        <div 
                          key={dish.id} 
                          className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                              <img src={dish.imageUrl || dish.image} alt={dish.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <h5 className="font-bold text-sm">{dish.name}</h5>
                              <span className="text-xs text-amber-500 font-mono">${dish.price}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => toggleStock(dish.id, available)}
                            className="cursor-pointer transition-colors p-1"
                          >
                            {available ? (
                              <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs font-mono">
                                <span>ACTIVE</span>
                                <ToggleRight className="w-10 h-10" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs font-mono">
                                <span>PAUSED</span>
                                <ToggleLeft className="w-10 h-10" />
                              </div>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {showSettings && (
          /* ------------------- RESTAURANT SETTINGS CONSOLE ------------------- */
          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 space-y-6"
          >
            {/* Settings Header Block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-3xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-rose-500/10 shrink-0">
                  <Settings className="w-5 h-5 animate-[spin_8s_linear_infinite]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-[#f0ede6] uppercase font-sans">Restaurant Console Settings</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-300">Configure brand-outlet hierarchy, provision new branches, and manage your full catalog.</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowSettings(false)}
                className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-[#f0ede6] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/20 dark:border-rose-500/30"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Kitchen Feed</span>
              </button>
            </div>
            <div className="flex bg-slate-100/80 dark:bg-slate-950/45 p-1 rounded-2xl border border-rose-500/20 dark:border-rose-500/30/30 gap-1.5 max-w-md mb-6">
              <button
                onClick={() => setSettingsTab("outlets")}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  settingsTab === "outlets"
                    ? "bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-[#f0ede6] shadow-sm border border-rose-500/20 dark:border-rose-500/30 backdrop-blur-md" 
                    : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Store className="w-4 h-4 text-rose-500" />
                <span>Outlet Management</span>
              </button>
              <button
                disabled={outlets.length === 0}
                onClick={() => setSettingsTab("menu-editor")}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  outlets.length === 0 ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
                } ${
                  settingsTab === "menu-editor"
                    ? "bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-[#f0ede6] shadow-sm border border-rose-500/20 dark:border-rose-500/30 backdrop-blur-md" 
                    : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Utensils className="w-4 h-4 text-orange-500" />
                <span>Menu Catalog Editor</span>
              </button>

              <button
                disabled={outlets.length === 0}
                onClick={() => setSettingsTab("history")}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  outlets.length === 0 ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
                } ${
                  settingsTab === "history"
                    ? "bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-[#f0ede6] shadow-sm border border-rose-500/20 dark:border-rose-500/30 backdrop-blur-md" 
                    : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <History className="w-4 h-4 text-emerald-500" />
                <span>Order History</span>
              </button>
            </div>

            {settingsTab === "outlets" && (

              <div className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 dark:from-rose-500/5 dark:to-orange-500/5 border border-rose-500/15 p-5 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-500">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <h4 className="font-extrabold text-sm tracking-tight uppercase font-sans">Hierarchy Onboarding</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    Register your Brand and physical Outlets on the ecosystem.
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {brands.length === 0 ? (
                      <BrandRegistration onRefresh={loadData} />
                    ) : (
                      <div className="p-4 border border-emerald-500/20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex flex-col gap-1 shadow-sm">
                        <p className="font-bold text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Brand Registered Successfully</p>
                        <p className="text-xs">You have completed brand registration. You can now add an outlet.</p>
                      </div>
                    )}
                    {brands.length > 0 && (
                      <OutletRegistration onRefresh={loadData} brandId={brands[0].id} />
                    )}
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-[2rem] shadow-sm">
                      <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider mb-4 border-b border-rose-500/20 dark:border-rose-500/30 pb-3">Your Brands</h5>
                      <div className="space-y-3">
                        {brands.map(b => (
                          <div key={b.id} className="p-3 bg-white/70 dark:bg-slate-950/45 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl flex flex-col gap-2 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6]">{b.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-300">ID: {b.id}</span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-300">GSTIN: {b.gstin}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-[2rem] shadow-sm">
                      <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider mb-4 border-b border-rose-500/20 dark:border-rose-500/30 pb-3">Your Outlets</h5>
                      <div className="space-y-3">
                        {outlets.map(o => (
                          <div key={o.id} className="p-3 bg-white/70 dark:bg-slate-950/45 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl flex flex-col gap-2 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6]">{o.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-300 block">ID: {o.id}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => setEditingOutletSettings(o)}
                                  className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                                  title="Edit Settings"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingOutletShifts(o)}
                                  className="p-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                                  title="Edit Shifts"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-300">FSSAI: {o.fssaiLicenseNumber}</div>
                            {o.timings && o.timings.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {o.timings.map((t: any, i: number) => (
                                  <span key={i} className="text-[9px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {t.openingTime.substring(0,5)} - {t.closingTime.substring(0,5)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {brands.length > 0 && (
                      <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-[2rem] shadow-sm mt-6">
                        <BrandMasterMenu brandId={brands[0].id} onRefresh={loadData} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {settingsTab === "menu-editor" && (
              <div className="space-y-6">
                <OutletMenuEditor
                  restaurantId={selectedOutletId || restaurantId}
                  brandId={brands.length > 0 ? brands[0].id : ''}
                  menuList={menuList}
                  onRefresh={loadData}
                />
              </div>
            )}
            {settingsTab === "history" && selectedOutletId && (
              <div className="animate-fade-in bg-white/40 dark:bg-slate-900/40 p-6 rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 backdrop-blur-md shadow-sm">
                <OrderHistory restaurantId={selectedOutletId} />
              </div>
            )}
          </motion.div>
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
      
      {editingOutletShifts && (
        <OutletShiftEditor
          outlet={editingOutletShifts}
          onRefresh={loadData}
          onClose={() => setEditingOutletShifts(null)}
        />
      )}
      
      {editingOutletSettings && (
        <OutletSettingsEditor
          outlet={editingOutletSettings}
          onRefresh={loadData}
          onClose={() => setEditingOutletSettings(null)}
        />
      )}

    </>
      )}
    </div>
  );
}
