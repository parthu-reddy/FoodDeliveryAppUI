import React, { useState, useEffect } from 'react';
import { 
  Store, TrendingUp, CheckCircle, Package, RefreshCw, LogOut, 
  ToggleLeft, ToggleRight, DollarSign, Calendar, Eye, MapPin, Sun, Moon,
  Terminal, Sliders, Code, Send, CheckCircle2, AlertCircle,
  ChefHat, Flame, Clock, Info, Shield, HelpCircle, User, Bike, Play, ArrowRight, Sparkles,
  Check, Truck, Settings, Plus, Trash2, Edit3, ChevronLeft, Layers, Utensils, History, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, MenuItem } from '../types';

import LaBouffeLogo from './LaBouffeLogo';
import OutletMenuEditor from './OutletMenuEditor';
import OutletRegistration from "./OutletRegistration";
import BrandRegistration from "./BrandRegistration";
import OutletShiftEditor from "./OutletShiftEditor";
import BrandMasterMenu from "./BrandMasterMenu";
import CategoryTimingsTab from "./CategoryTimingsTab";

import { OrderHistory } from "./OrderHistory";

import CompleteProfileModal from './CompleteProfileModal';
import SharedSettingsView from './SharedSettingsView';
import { getUserProfile } from '../lib/tokenStore';

import { apiGet, apiPost, apiPut } from '../lib/apiClient';
import { toFrontendStatus, toBackendStatus } from '../lib/statusMapper';
import { 
  getBrands, getOutlets, 
  getMasterMenuItems, 
  getOutletOverrides, getEffectiveMenu 
} from '../lib/menuStore';

interface RestaurantDashboardProps {
  restaurantId: string;
  activeOrders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onLogout: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onAddApiLog?: (log: any) => void;
}

// Utility to determine if order is actively tracked
const isActiveOrder = (status: string) => {
  const s = (status || '').trim().toLowerCase();
  return !['delivered', 'partially_refunded', 'cancelled_and_refunded', 'cancelled', 'rejected', 'cancelled_by_restaurant', 'delivery_failed', 'dispatch_failed'].includes(s);
};

const isFailedOrder = (status: string) => {
  const s = (status || '').trim().toLowerCase();
  return ['cancelled', 'rejected', 'cancelled_by_restaurant', 'delivery_failed', 'dispatch_failed', 'partially_refunded', 'cancelled_and_refunded'].includes(s);
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

  const onUpdateOrderStatus = externalUpdateStatus ?? (async (orderId: string, status: OrderStatus) => {
    // Optimistic UI update
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    // API call
    try {
      let endpoint = '';
      if (status === 'accepted') endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/accept`;
      else if (status === 'rejected') endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/reject`;
      else if (status === 'ready_for_pickup') endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/ready`;
      else if (status === 'cancelled') endpoint = `/api/v1/restaurants/${selectedOutletId}/fulfillment/orders/${orderId}/cancel`;
      
      if (endpoint) {
        await apiPost(endpoint);
        if (onAddApiLog) {
          onAddApiLog({ id: `update_${orderId}`, label: `POST ${endpoint}`, method: 'POST' });
        }
      }
    } catch (e) {
      console.error('Failed to update order status', e);
      // Optional: Handle rollback if needed
    }
  });
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [settingsTab, setSettingsTab] = useState<"menu-editor" | "outlets" | "history">("menu-editor");


  const [showSettings, setShowSettings] = useState(false);
  
  const [editingOutletShifts, setEditingOutletShifts] = useState<any | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    return localStorage.getItem('restaurant_selectedOutletId') || restaurantId || '';
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
        apiGet(`/api/v1/restaurants/${selectedOutletId}/fulfillment/orders`)
                    .then(res => {
            if (isCancelled) return;
            if (res.data) {
              const mapped = res.data.map((o: any) => {
                let s = o.status?.toLowerCase() || '';
                if (s === 'created' || s === 'paid') s = 'placed';
                if (s === 'ready_for_pickup' || s === 'ready') s = 'ready_for_pickup'; // Wait, backend sends READY, UI expects ready_for_pickup?
                if (s === 'rejected' || s === 'cancelled' || s === 'cancelled_by_restaurant' || s === 'delivery_failed' || s === 'dispatch_failed') s = 'cancelled';
                if (s === 'delivered') s = 'delivered';
                
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
                  if ((oldOrder?.status === 'preparing' || isLocallyPreparing) && newOrder.status === 'accepted') {
                    return { ...newOrder, status: 'preparing' };
                  }
                  return newOrder;
                });
              });
            }
          })
          .catch(console.error)
          .finally(() => {
            if (!isCancelled) {
              timeout = setTimeout(fetchOrders, 3000);
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
      }

      if (!selectedOutletId && _outlets.length > 0) {
        setSelectedOutletId(_outlets[0].id);
        return; // will re-trigger useEffect
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
  const [overrideOutletId, setOverrideOutletId] = useState(restaurantId);
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

  const pendingOrders = myOrders.filter(o => o.status === 'placed' || o.status === 'on_hold');
  const activePreparing = myOrders.filter(o => o.status === 'accepted' || o.status === 'preparing');
  const completedOrders = historyOrders.filter(o => o.status === 'delivered');

  // Compute stats
  const totalRevenue = myOrders.reduce((acc, curr) => acc + curr.subtotal, 0);

  const toggleStock = (dishId: string) => {
    const key = `${selectedOutletId}_${dishId}`;
    setStockStatus(prev => ({
      ...prev,
      [key]: prev[key] === false ? true : false
    }));
  };


  const [isApiPlaygroundOpen, setIsApiPlaygroundOpen] = useState(false);
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<"status" | "item" | "eta" | "pickup">("status");
  const [apiStatus, setApiStatus] = useState<"OPEN" | "CLOSED">("OPEN");

  const [apiCapacityFactor, setApiCapacityFactor] = useState('1.0');

  const myMenuItems = menuList;
  const [apiMenuItemId, setApiMenuItemId] = useState(myMenuItems[0]?.id || '');
  const [apiMenuAvailable, setApiMenuAvailable] = useState('true');
  const [apiPrepDelta, setApiPrepDelta] = useState('120');

  const activePreparingOrders = myOrders.filter(o => o.status === 'placed' || o.status === 'on_hold' || o.status === 'accepted' || o.status === 'preparing');
  const [apiEtaOrderId, setApiEtaOrderId] = useState('');
  const [apiPrepSeconds, setApiPrepSeconds] = useState('1200');
  const [apiEtaReason, setApiEtaReason] = useState('High custom order density');

  const [apiReadyOrderId, setApiReadyOrderId] = useState('');

  // States for inline delay requests on Kanban cards
  const [delayingOrderId, setDelayingOrderId] = useState<string | null>(null);
  const [customDelayMinutes, setCustomDelayMinutes] = useState<Record<string, string>>({});
  const [customDelayReasonText, setCustomDelayReasonText] = useState<Record<string, string>>({});
  const [cardDelayStatus, setCardDelayStatus] = useState<Record<string, { minutes: number; reason: string }>>({});

  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [apiResponseHeaders, setApiResponseHeaders] = useState<any | null>(null);
  const [apiResponseStatus, setApiResponseStatus] = useState<number | null>(null);
  const [apiResponseEndpoint, setApiResponseEndpoint] = useState<string | null>(null);

  // Auto-fill selects when active orders change
  React.useEffect(() => {
    if (activePreparingOrders.length > 0) {
      if (!apiEtaOrderId) setApiEtaOrderId(activePreparingOrders[0].id);
      if (!apiReadyOrderId) setApiReadyOrderId(activePreparingOrders[0].id);
    }
  }, [activePreparingOrders]);

  // Auto-fill menu items select
  React.useEffect(() => {
    if (myMenuItems.length > 0 && !apiMenuItemId) {
      setApiMenuItemId(myMenuItems[0].id);
    }
  }, [myMenuItems]);

  const handleUpdateStatusApi = (e: React.FormEvent) => {
    e.preventDefault();
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'X-Device-Id': 'restaurant-pos-terminal-01',
      'X-App-Version': '1.0.0',
      'Authorization': 'Bearer la-bouffe-jwt-token-restaurant'
    };
    const body = {
      status: apiStatus,
      capacityFactor: parseFloat(apiCapacityFactor)
    };
    const responseBody = {
      success: true,
      message: `Outlet status successfully set to ${apiStatus}. Capacity threshold is ${apiCapacityFactor}x.`,
      data: {
        restaurantId,
        status: apiStatus,
        capacityFactor: parseFloat(apiCapacityFactor),
        updatedAt: new Date().toISOString()
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/restaurants/${restaurantId}/status`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/restaurants/${restaurantId}/status`,
        headers,
        payload: body,
        response: responseBody,
        status: 200,
        duration: Math.floor(70 + Math.random() * 20),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleMenuItemAvailabilityApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiMenuItemId) return;
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'Authorization': 'Bearer la-bouffe-jwt-token-restaurant'
    };
    const body = {
      itemId: apiMenuItemId,
      isAvailable: apiMenuAvailable === 'true',
      prepTimeDeltaSeconds: parseInt(apiPrepDelta)
    };
    const responseBody = {
      success: true,
      message: `Menu item '${apiMenuItemId}' availability status committed.`,
      data: {
        itemId: apiMenuItemId,
        isAvailable: apiMenuAvailable === 'true',
        prepTimeDeltaSeconds: parseInt(apiPrepDelta),
        updatedAt: new Date().toISOString()
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/restaurants/${restaurantId}/menu/item-availability`);

    // Side effect: update stock state directly!
    setStockStatus(prev => ({
      ...prev,
      [apiMenuItemId]: apiMenuAvailable === 'true'
    }));

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/restaurants/${restaurantId}/menu/item-availability`,
        headers,
        payload: body,
        response: responseBody,
        status: 200,
        duration: Math.floor(80 + Math.random() * 30),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleReportEtaApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiEtaOrderId) {
      alert("Please select an active order first!");
      return;
    }
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'Authorization': 'Bearer la-bouffe-jwt-token-restaurant'
    };
    const body = {
      prepTimeSeconds: parseInt(apiPrepSeconds),
      delayReason: apiEtaReason
    };
    const responseBody = {
      success: true,
      message: "Estimated Preparation Time recorded successfully.",
      data: {
        orderId: apiEtaOrderId,
        prepTimeSeconds: parseInt(apiPrepSeconds),
        delayReason: apiEtaReason,
        revisedEta: new Date(Date.now() + parseInt(apiPrepSeconds) * 1000).toISOString()
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/restaurants/${restaurantId}/orders/${apiEtaOrderId}/eta`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/restaurants/${restaurantId}/orders/${apiEtaOrderId}/eta`,
        headers,
        payload: body,
        response: responseBody,
        status: 200,
        duration: Math.floor(95 + Math.random() * 35),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleReadyForPickupApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiReadyOrderId) {
      alert("Please select an active order first!");
      return;
    }
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'Authorization': 'Bearer la-bouffe-jwt-token-restaurant'
    };
    const body = {
      dispatchLocation: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    };
    const responseBody = {
      success: true,
      message: "Order flagged as ready for dispatch. Courier dispatched signal sent.",
      data: {
        orderId: apiReadyOrderId,
        readyAt: new Date().toISOString(),
        status: "PREPARED",
        suggestedHandoverBay: "BAY-C"
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/restaurants/${restaurantId}/orders/${apiReadyOrderId}/ready-for-pickup`);

    // Side effect: update order status in-memory directly!
    onUpdateOrderStatus(apiReadyOrderId, 'dispatched');

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/restaurants/${restaurantId}/orders/${apiReadyOrderId}/ready-for-pickup`,
        headers,
        payload: body,
        response: responseBody,
        status: 200,
        duration: Math.floor(100 + Math.random() * 40),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleStatusTransition = (order: Order) => {
    if (order.status === 'placed' || order.status === 'on_hold') {
      onUpdateOrderStatus(order.id, 'accepted');
    } else if (order.status === 'accepted') {
      localStorage.setItem(`order_preparing_${order.id}`, 'true');
      onUpdateOrderStatus(order.id, 'preparing');
    } else if (order.status === 'preparing') {
      localStorage.removeItem(`order_preparing_${order.id}`);
      onUpdateOrderStatus(order.id, 'ready_for_pickup');
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

    try {
      await apiPost(endpoint, body);
      
      setCardDelayStatus(prev => ({
        ...prev,
        [orderId]: { minutes, reason }
      }));
      
      if (minutes > 10) {
        // Optimistic update
        setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'on_hold' } : o));
        if (externalUpdateStatus) externalUpdateStatus(orderId, 'on_hold');
      } else {
        // Accept right away if <= 10 mins
        setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'accepted' } : o));
        if (externalUpdateStatus) externalUpdateStatus(orderId, 'accepted');
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
                      {myOrders.filter(o => o.status === 'placed').length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {myOrders.filter(o => o.status === 'placed').length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                        <Package className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">No new orders placed</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 max-w-[180px]">When customers place live orders, they will ping in this slot instantly.</p>
                      </div>
                    ) : (
                      myOrders.filter(o => o.status === 'placed').slice().reverse().map(order => (
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
                            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase border ${order.status === 'on_hold' ? 'bg-red-500/10 text-red-500 border-red-500/25' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase'}`}>
                              {order.status === 'on_hold' ? 'ON HOLD' : 'PLACED'}
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
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase font-mono">Total Value:</span>
                              <span className="text-sm font-black text-slate-850 dark:text-[#f0ede6] font-mono">${order.total?.toFixed(2)}</span>
                            </div>

                            {/* Action Row */}
                            <div className="grid grid-cols-2 gap-2">
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
                                className="py-2 px-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-[#f0ede6] text-[10px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
                              >
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>Request Delay</span>
                              </button>
                              
                              <button
                                onClick={() => handleStatusTransition(order)}
                                className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-md shadow-orange-500/10 hover:brightness-110 transition-all cursor-pointer border border-white/5"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept Order</span>
                              </button>
                            </div>

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
                                    className="w-full py-1.5 bg-slate-900 dark:bg-slate-850 hover:bg-black dark:hover:bg-slate-800 text-white text-[9.5px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer font-mono"
                                  >
                                    <Send className="w-3 h-3 text-rose-450" />
                                    <span>POST /api/v1/orders/delay</span>
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
                      {myOrders.filter(o => o.status === 'on_hold').length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {myOrders.filter(o => o.status === 'on_hold').length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                        <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">No delayed orders</p>
                      </div>
                    ) : (
                      myOrders.filter(o => o.status === 'on_hold').slice().reverse().map(order => (
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
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase font-mono">Total Value:</span>
                              <span className="text-sm font-black text-slate-850 dark:text-[#f0ede6] font-mono">${order.total?.toFixed(2)}</span>
                            </div>

                            {/* Action Row */}
                            <div className="grid grid-cols-1 gap-2 mt-2">
                              <button
                                onClick={() => handleStatusTransition(order)}
                                className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-md shadow-orange-500/10 hover:brightness-110 transition-all cursor-pointer border border-white/5"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept Order</span>
                              </button>
                            </div>
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
                      {myOrders.filter(o => o.status === 'accepted' || o.status === 'preparing').length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {myOrders.filter(o => o.status === 'accepted' || o.status === 'preparing').length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                        <ChefHat className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">Kitchen is idle</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 max-w-[180px]">Accepted tickets appear here. Start cooking to alert couriers!</p>
                      </div>
                    ) : (
                      myOrders.filter(o => o.status === 'accepted' || o.status === 'preparing').slice().reverse().map(order => (
                        <motion.div 
                          key={order.id}
                          layoutId={`card-${order.id}`}
                          className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border p-4 rounded-2xl shadow-sm space-y-3.5 relative overflow-hidden transition-all ${
                            order.status === 'preparing'
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
                              order.status === 'preparing' 
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider flex items-center gap-1' 
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase tracking-wider'
                            }`}>
                              {order.status === 'preparing' && <Flame className="w-3 h-3 text-orange-500 animate-bounce" />}
                              <span>{order.status === 'preparing' ? 'COOKING' : 'ACCEPTED'}</span>
                            </span>
                          </div>

                          {/* Customer/ETA summary */}
                          <div className="text-[11px] bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 space-y-1">
                            <p className="font-bold text-slate-700 dark:text-[#f0ede6]">Customer: {order.customerName}</p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-300">
                              <Clock className="w-3 h-3 text-orange-400" />
                              <span>Estimated cook time: ~20 mins</span>
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
                          <div className="pt-2.5 border-t border-rose-500/20 dark:border-rose-500/30 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[9px] text-slate-400 dark:text-slate-300 uppercase font-mono block">Order Value</span>
                              <span className="text-xs font-bold text-slate-850 dark:text-[#f0ede6] font-mono">${order.total?.toFixed(2)}</span>
                            </div>

                            {order.status === 'accepted' ? (
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
                      {myOrders.filter(o => o.status === 'dispatched' || o.status === 'ready_for_pickup').length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {myOrders.filter(o => o.status === 'dispatched' || o.status === 'ready_for_pickup').length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-rose-500/20 dark:border-rose-500/30 rounded-2xl">
                        <Truck className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">No ready packages</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 max-w-[180px]">Finished dishes will wait here. Handover to couriers with secure codes.</p>
                      </div>
                    ) : (
                      myOrders.filter(o => o.status === 'dispatched' || o.status === 'ready_for_pickup').slice().reverse().map(order => (
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
                      {myOrders.filter(o => o.status === 'picked_up').length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3.5 overflow-y-auto h-[500px] scrollbar-thin pr-1">
                    {myOrders.filter(o => o.status === 'picked_up').length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-purple-500/20 dark:border-purple-500/30 rounded-2xl">
                        <Bike className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">No orders in transit</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 max-w-[180px]">Orders picked up by riders will appear here until delivered.</p>
                      </div>
                    ) : (
                      myOrders.filter(o => o.status === 'picked_up').slice().reverse().map(order => (
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

            <div className="space-y-3">
              {menuList.map(dish => {
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
                      onClick={() => toggleStock(dish.id)}
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
                              <button
                                onClick={() => setEditingOutletShifts(o)}
                                className="p-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                                title="Edit Shifts"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
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

                {/* Moved Brand Category Timings here */}
                {selectedOutletId && selectedOutletBrandId && (
                  <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 dark:border-indigo-500/30 p-6 rounded-[2rem] shadow-sm mt-6">
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider mb-4 border-b border-indigo-500/20 dark:border-indigo-500/30 pb-3">
                      Brand Global Category Availability Settings
                    </h5>
                    <CategoryTimingsTab outletId={selectedOutletId} brandId={selectedOutletBrandId} level="brand" />
                  </div>
                )}
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
                
                {selectedOutletId && selectedOutletBrandId && (
                  <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 dark:border-indigo-500/30 p-6 rounded-[2rem] shadow-sm mt-6">
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider mb-4 border-b border-indigo-500/20 dark:border-indigo-500/30 pb-3">
                      Outlet Specific Category Availability Settings
                    </h5>
                    <CategoryTimingsTab outletId={selectedOutletId} brandId={selectedOutletBrandId} level="outlet" />
                  </div>
                )}
              </div>
            )}
            {settingsTab === "history" && selectedOutletId && (
              <div className="animate-fade-in bg-white/40 dark:bg-slate-900/40 p-6 rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 backdrop-blur-md shadow-sm">
                <OrderHistory orders={historyOrders} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESTAURANT API INTERACTIVE PLAYGROUND */}
      <div className="mx-5 mt-10 border border-rose-500/20 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-lg">
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
                <span>Restaurant API Interactive Forms</span>
                <span className="text-[9px] font-mono bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20">
                  LIVE GATEWAY
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-300 font-normal">Execute and monitor the Ecosystem Restaurant API references in real-time</p>
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
                  { id: 'status', label: 'Outlet Status', method: 'POST' },
                  { id: 'item', label: 'Item Availability', method: 'POST' },
                  { id: 'eta', label: 'Report ETA', method: 'POST' },
                  { id: 'pickup', label: 'Ready for Pickup', method: 'POST' },
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
                    <span className="text-[8px] font-mono font-black px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400">
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
                  
                  {activePlaygroundTab === 'status' && (
                    <form onSubmit={handleUpdateStatusApi} className="space-y-3.5">
                      <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                        <strong>POST /api/v1/restaurants/&#123;id&#125;/status</strong>: Submits kitchen operational heartbeat status and capacity constraints factor directly to the dispatching gateway.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Outlet Status</label>
                          <select 
                            value={apiStatus}
                            onChange={(e) => setApiStatus(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                          >
                            <option value="OPEN">OPEN - ACCEPTING ORDERS</option>
                            <option value="CLOSED">CLOSED - OFF DUTY</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Capacity Factor</label>
                          <input 
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="5.0"
                            value={apiCapacityFactor}
                            onChange={(e) => setApiCapacityFactor(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-rose-500/10"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Update Outlet Status API</span>
                      </button>
                    </form>
                  )}

                  {activePlaygroundTab === 'item' && (
                    <form onSubmit={handleMenuItemAvailabilityApi} className="space-y-3.5">
                      <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                        <strong>POST /api/v1/restaurants/&#123;id&#125;/menu/item-availability</strong>: Hot-swaps menu dish availability logs in real-time and alerts clients currently browsing this kitchen.
                      </p>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Select Menu Dish</label>
                        {myMenuItems.length === 0 ? (
                          <div className="text-xs text-red-400 bg-red-400/5 border border-red-400/10 p-2.5 rounded-xl">No menu items configured for this outlet.</div>
                        ) : (
                          <select 
                            value={apiMenuItemId}
                            onChange={(e) => setApiMenuItemId(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                          >
                            {myMenuItems.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Availability State</label>
                          <select 
                            value={apiMenuAvailable}
                            onChange={(e) => setApiMenuAvailable(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                          >
                            <option value="true">AVAILABLE / IN STOCK</option>
                            <option value="false">PAUSED / OUT OF STOCK</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Prep Time Delta (Seconds)</label>
                          <input 
                            type="number"
                            value={apiPrepDelta}
                            onChange={(e) => setApiPrepDelta(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={myMenuItems.length === 0}
                        className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Commit Item Availability API</span>
                      </button>
                    </form>
                  )}

                  {activePlaygroundTab === 'eta' && (
                    <form onSubmit={handleReportEtaApi} className="space-y-3.5">
                      <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                        <strong>POST /api/v1/restaurants/&#123;id&#125;/orders/&#123;orderId&#125;/eta</strong>: Submits preparation duration targets and potential supply delay notices to customers and couriers.
                      </p>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Target Live Order</label>
                        {activePreparingOrders.length === 0 ? (
                          <div className="text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl font-medium">
                            ⚠️ No active preparing orders in kitchen. Place order from customer view first.
                          </div>
                        ) : (
                          <select 
                            value={apiEtaOrderId}
                            onChange={(e) => setApiEtaOrderId(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                          >
                            {activePreparingOrders.map(o => (
                              <option key={o.id} value={o.id}>Order #{o.id} - ${o.total?.toFixed(2)}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Est. Prep Duration (Secs)</label>
                          <input 
                            type="number"
                            value={apiPrepSeconds}
                            onChange={(e) => setApiPrepSeconds(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                            min="300"
                            max="7200"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Delay Notice Reason</label>
                          <input 
                            type="text"
                            value={apiEtaReason}
                            onChange={(e) => setApiEtaReason(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={activePreparingOrders.length === 0}
                        className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Register Preparation ETA API</span>
                      </button>
                    </form>
                  )}

                  {activePlaygroundTab === 'pickup' && (
                    <form onSubmit={handleReadyForPickupApi} className="space-y-3.5">
                      <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                        <strong>POST /api/v1/restaurants/&#123;id&#125;/orders/&#123;orderId&#125;/ready-for-pickup</strong>: Signals to the gateway that preparation is complete. This updates order state and triggers local delivery dispatch.
                      </p>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Target Live Order</label>
                        {activePreparingOrders.length === 0 ? (
                          <div className="text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl font-medium">
                            ⚠️ No preparing orders in kitchen. Place order from customer view first.
                          </div>
                        ) : (
                          <select 
                            value={apiReadyOrderId}
                            onChange={(e) => setApiReadyOrderId(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                          >
                            {activePreparingOrders.map(o => (
                              <option key={o.id} value={o.id}>Order #{o.id} - ${o.total?.toFixed(2)}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={activePreparingOrders.length === 0}
                        className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Flag Ready For Dispatch API</span>
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
                          <pre className="text-[9px] font-mono text-slate-400 dark:text-slate-300 p-2 bg-slate-900/60 rounded-xl overflow-x-auto touch-pan-x scrollbar-thin max-h-24">
                            {JSON.stringify(apiResponseHeaders, null, 2)}
                          </pre>
                        </div>
                        <div className="space-y-1 flex-1 flex flex-col">
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-300 block">RESPONSE PAYLOAD JSON:</span>
                          <pre className="text-[10px] font-mono text-amber-400 p-3 bg-slate-900 rounded-xl overflow-x-auto touch-pan-x flex-1 scrollbar-thin max-h-32">
                            {JSON.stringify(apiResponse, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-slate-500 dark:text-slate-300 space-y-2">
                        <Code className="w-8 h-8 text-slate-700" />
                        <p className="text-xs font-mono">Gateway Listener Ready</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                          Fill in parameters and click update to display responsive API payloads here.
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

    </>
      )}
    </div>
  );
}
