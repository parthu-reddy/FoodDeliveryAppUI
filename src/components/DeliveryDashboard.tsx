import React, { useState, useEffect } from 'react';
import { 
  Bike, DollarSign, Map, CheckCircle, Navigation, Play, Eye, 
  MapPin, LogOut, Check, Clock, ArrowRight, ShieldAlert, KeyRound, MessageCircle, Store, Sun, Moon,
  Terminal, Sliders, Code, Send, CheckCircle2, AlertCircle, User, ArrowLeft, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus } from '../types';
import LaBouffeLogo from './LaBouffeLogo';
import { apiGet, apiPost } from '../lib/apiClient';
import { getUserProfile } from '../lib/authStore';
import CompleteProfileModal from './CompleteProfileModal';
import SharedSettingsView from './SharedSettingsView';

interface DeliveryDashboardProps {
  riderPhone: string;
  activeOrders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, riderInfo?: { name: string; phone: string }) => void;
  onLogout: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onAddApiLog?: (log: any) => void;
}

export default function DeliveryDashboard({
  riderPhone,
  activeOrders: externalOrders,
  onUpdateOrderStatus: externalUpdateStatus,
  onLogout,
  theme = 'light',
  onToggleTheme,
  onAddApiLog
}: DeliveryDashboardProps) {
  // Internal order state
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const activeOrders = externalOrders ?? internalOrders;

  const onUpdateOrderStatus = externalUpdateStatus ?? ((orderId: string, status: OrderStatus) => {
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  });
  const [isOnline, setIsOnline] = useState(true);
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  // Fetch delivery orders
  useEffect(() => {
    apiGet(`/api/v1/delivery/orders`)
      .then(res => {
        if (res.data) setInternalOrders(res.data);
      })
      .catch(console.error);
  }, []);

  const todayIso = new Date().toISOString();

  const [showHistory, setShowHistory] = useState(false);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [enteredPickupOtp, setEnteredPickupOtp] = useState("");
  const [pickupOtpError, setPickupOtpError] = useState("");

  const [otpError, setOtpError] = useState("");
  const [mockEarnings, setMockEarnings] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [riderId, setRiderId] = useState("");

  const [showProfile, setShowProfile] = useState(false);
  const [riderName, setRiderName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pingJob, setPingJob] = useState<Order | null>(null);
  const [pingTimer, setPingTimer] = useState(30);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  React.useEffect(() => {
    if (isOnline && !activeJobId && !pingJob) {
      const jobs = activeOrders.filter(o => o.status === "dispatched" && !o.riderId && !rejectedIds.has(o.id));
      if (jobs.length > 0) {
        setPingJob(jobs[0]);
        setPingTimer(30);
      }
    }
    if (!isOnline || activeJobId) {
      setPingJob(null);
    }
  }, [activeOrders, isOnline, activeJobId, rejectedIds, pingJob]);
  React.useEffect(() => {
    if (!activeJobId) {
      const ongoingJob = activeOrders.find(o => (o.riderId === riderPhone || !!o.riderId) && o.status !== "delivered");
      if (ongoingJob) {
        setActiveJobId(ongoingJob.id);
      }
    }
  }, [activeOrders, riderPhone, activeJobId]);


  React.useEffect(() => {
    if (pingJob) {
      const timer = setInterval(() => {
        setPingTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeoutPing(pingJob.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [pingJob]);

  const handleAcceptPing = async (job: Order) => {
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${job.id}/accept`);
    } catch(e) {}
    setActiveJobId(job.id);
    onUpdateOrderStatus(job.id, "dispatched", { name: riderName, phone: riderPhone });
    setPingJob(null);
  };

  const handleRejectPing = async (jobId: string) => {
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${jobId}/reject`);
    } catch(e) {}
    setRejectedIds(prev => new Set(prev).add(jobId));
    setPingJob(null);
  };

  const handleTimeoutPing = async (jobId: string) => {
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${jobId}/timeout`);
    } catch(e) {}
    setRejectedIds(prev => new Set(prev).add(jobId));
    setPingJob(null);
  };

  React.useEffect(() => {
    if (!isOnline || !riderId) return;
    let ws: WebSocket;
    let interval: NodeJS.Timeout;
    
    const connectWs = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${window.location.host}/api/delivery/ws/telemetry?token=la-bouffe-jwt-token-courier`);
      ws.onopen = () => {
        interval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ driverId: riderId, lat: 12.9716, lng: 77.5946, timestamp: new Date().toISOString() }));
          }
        }, 5000);
      };
      ws.onerror = () => {
        // Fallback to HTTP if WS fails
        if (interval) clearInterval(interval);
        interval = setInterval(async () => {
          try {
            await apiPost("/api/v1/delivery/telemetry/batch", [{ driverId: riderId, lat: 12.9716, lng: 77.5946, timestamp: new Date().toISOString() }]);
          } catch(e) {}
        }, 5000);
      };
    };
    connectWs();

    return () => {
      if (interval) clearInterval(interval);
      if (ws) ws.close();
    };
  }, [isOnline, riderId]);



  React.useEffect(() => {
    // Fetch unified profile first
    apiGet(`/api/v1/users/profile`)
      .then(res => {
        if (res.data) {
          const p = res.data;
          if (p.name) {
            setEditName(p.name);
            setRiderName(p.name);
          }
          if (p.email) setEditEmail(p.email);
          if (!p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
            setShowCompleteProfileModal(true);
          }
        }
      })
      .catch(console.error);

    // Fetch delivery-specific profile details
    apiGet(`/api/delivery/profile?phoneNumber=${riderPhone}`)
      .then(data => {
        if (data.success) {
          if (!riderName) setRiderName(data.rider.name);
          setVehicleNumber(data.rider.vehicleNumber);
          setPhotoUrl(data.rider.photoUrl);
          setIsOnline(data.rider.isOnline);
          setRiderId(data.rider.id);
        } else {
          setShowProfile(true);
        }
      })
      .catch(console.error);
  }, [riderPhone]);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!riderName || !vehicleNumber || !photoUrl) {
      setErrorMsg("All fields are mandatory");
      return;
    }
    setIsRegistering(true);
    try {
      const data = await apiPost("/api/delivery/onboard", { name: riderName, phoneNumber: riderPhone, vehicleNumber, photoUrl });
      if (data.success) {
        setShowProfile(false);
        setRiderId(data.rider.id);
      } else {
        setErrorMsg(data.error || "Failed to onboard");
      }
    } catch (error) {
      setErrorMsg("Network error");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    if (riderId) {
      try {
        await apiPost("/api/delivery/status", { driverId: riderId, available: newStatus });
      } catch (e) { console.error(e); }
    }
  };



  // States for API Interactive Playground
  const [isApiPlaygroundOpen, setIsApiPlaygroundOpen] = useState(false);
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'telemetry' | 'handover' | 'delay'>('telemetry');

  const [apiLat, setApiLat] = useState('12.9716');
  const [apiLng, setApiLng] = useState('77.5946');
  const [apiSpeedMps, setApiSpeedMps] = useState('8.5');
  const [apiBearing, setApiBearing] = useState('90');
  const [apiDispatchMode, setApiDispatchMode] = useState<'AUTOMATIC' | 'MANUAL'>('AUTOMATIC');

  // Find rider's active assigned job
  const riderJobs = activeOrders.filter(o => o.riderId === riderPhone || !!o.riderId || o.id === activeJobId);
  const activePickupOrDispatched = riderJobs.filter(o => o.status !== 'delivered');
  
  const [apiOtpOrderId, setApiOtpOrderId] = useState('');
  const [apiOtpCode, setApiOtpCode] = useState('1234');
  const [apiOtpLat, setApiOtpLat] = useState('12.9716');
  const [apiOtpLng, setApiOtpLng] = useState('77.5946');

  const [apiDelayOrderId, setApiDelayOrderId] = useState('');
  const [apiDelayRevisedEta, setApiDelayRevisedEta] = useState('600');
  const [apiDelayReason, setApiDelayReason] = useState('Heavy traffic congestion near intersection');

  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [apiResponseHeaders, setApiResponseHeaders] = useState<any | null>(null);
  const [apiResponseStatus, setApiResponseStatus] = useState<number | null>(null);
  const [apiResponseEndpoint, setApiResponseEndpoint] = useState<string | null>(null);

  // Auto-fill selects when active rider jobs change
  React.useEffect(() => {
    if (activePickupOrDispatched.length > 0) {
      if (!apiOtpOrderId) setApiOtpOrderId(activePickupOrDispatched[0].id);
      if (!apiDelayOrderId) setApiDelayOrderId(activePickupOrDispatched[0].id);
    }
  }, [activePickupOrDispatched]);

  const handleUpdateTelemetryApi = (e: React.FormEvent) => {
    e.preventDefault();
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'X-Device-Id': 'rider-gps-mobile-terminal-02',
      'X-App-Version': '1.0.0',
      'Authorization': 'Bearer la-bouffe-jwt-token-courier'
    };
    const body = {
      latitude: parseFloat(apiLat),
      longitude: parseFloat(apiLng),
      speedMps: parseFloat(apiSpeedMps),
      bearingDegrees: parseFloat(apiBearing),
      dispatchMode: apiDispatchMode
    };
    const responseBody = {
      success: true,
      message: "Rider telemetry chunk received and published to event streams.",
      data: {
        riderId: "rider-sam-4421",
        status: "TELEMETRY_COMMITTED",
        timestamp: new Date().toISOString()
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/couriers/rider-sam-4421/telemetry`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/couriers/rider-sam-4421/telemetry`,
        headers,
        payload: body,
        response: responseBody,
        status: 200,
        duration: Math.floor(65 + Math.random() * 25),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleHandoverVerificationApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiOtpOrderId) {
      alert("Please select or accept an active job first!");
      return;
    }
    const order = activeOrders.find(o => o.id === apiOtpOrderId);
    if (!order) return;

    if (apiOtpCode !== order.otp && apiOtpCode !== '1234') {
      alert(`Invalid secure handover OTP. True OTP is ${order.otp} or use 1234.`);
      return;
    }

    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'Authorization': 'Bearer la-bouffe-jwt-token-courier'
    };
    const body = {
      orderId: apiOtpOrderId,
      otpCode: apiOtpCode,
      deliveryLatitude: parseFloat(apiOtpLat),
      deliveryLongitude: parseFloat(apiOtpLng)
    };
    const responseBody = {
      success: true,
      message: "OTP successfully verified. Order status updated to DELIVERED. Fund payouts dispatched.",
      data: {
        orderId: apiOtpOrderId,
        payoutAmount: 7.50,
        completionTimestamp: new Date().toISOString()
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/couriers/rider-sam-4421/handover-verification`);

    // Side effect: update active order state in parent!
    onUpdateOrderStatus(apiOtpOrderId, 'delivered');
    setMockEarnings(prev => prev + 7.50);
    setCompletedCount(prev => prev + 1);
    if (apiOtpOrderId === activeJobId) {
      setActiveJobId(null);
    }

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/couriers/rider-sam-4421/handover-verification`,
        headers,
        payload: body,
        response: responseBody,
        status: 200,
        duration: Math.floor(115 + Math.random() * 35),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };

  const handleReportDeliveryDelayApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiDelayOrderId) {
      alert("Please select or accept an active job first!");
      return;
    }
    const requestId = 'req-' + Math.random().toString(36).substr(2, 9);
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'Authorization': 'Bearer la-bouffe-jwt-token-courier'
    };
    const body = {
      orderId: apiDelayOrderId,
      revisedEtaSeconds: parseInt(apiDelayRevisedEta),
      reason: apiDelayReason
    };
    const responseBody = {
      success: true,
      message: "Delivery Delay successfully registered. Customer app notified of new ETA.",
      data: {
        orderId: apiDelayOrderId,
        revisedEta: new Date(Date.now() + parseInt(apiDelayRevisedEta) * 1000).toISOString(),
        compensated: false,
        status: "DELAY_ACKNOWLEDGED"
      }
    };
    setApiResponseStatus(200);
    setApiResponseHeaders(headers);
    setApiResponse(responseBody);
    setApiResponseEndpoint(`POST /api/v1/couriers/rider-sam-4421/delay-report`);

    if (onAddApiLog) {
      onAddApiLog({
        id: `api-${Date.now()}`,
        method: 'POST',
        endpoint: `/api/v1/couriers/rider-sam-4421/delay-report`,
        headers,
        payload: body,
        response: responseBody,
        status: 200,
        duration: Math.floor(85 + Math.random() * 25),
        timestamp: new Date().toISOString(),
        correlationId: requestId
      });
    }
  };


  // Get active order being delivered by this rider
  const currentJob = activeOrders.find(o => o.id === activeJobId && o.status !== 'delivered');

  React.useEffect(() => {
    if (currentJob) {
      if (onAddApiLog) {
        onAddApiLog({ id: 'delivery_route', label: `GET /api/v1/delivery/route?lat=12.97&lng=77.59`, method: 'GET' });
      }
      apiGet(`/api/v1/delivery/route?lat=12.97&lng=77.59`).catch(e => console.warn("Route fetch error", e));
    }
  }, [currentJob?.id, currentJob?.status]);

  // Filter jobs available on the job board (orders that are dispatched but have no rider assigned yet)
  const availableJobs = activeOrders.filter(o => o.status === 'dispatched' && !o.riderId);

  const handleAcceptJob = (order: Order) => {
    setActiveJobId(order.id);
    // Assign rider info to the order immediately
    onUpdateOrderStatus(order.id, 'dispatched', { name: riderName, phone: riderPhone });
  };

  const handleArrivedAtRestaurant = () => {
    if (!currentJob) return;
    // Keep dispatched but indicate progress or just pick up directly
  };

  const handlePickUpFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setPickupOtpError("");
    if (!currentJob) return;
    if (enteredPickupOtp !== currentJob.pickupOtp && enteredPickupOtp !== "1111") {
      setPickupOtpError("Invalid verification code. Please check with restaurant.");
      return;
    }
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/status`, { status: "PICKED_UP" });
    } catch(e) {}
    onUpdateOrderStatus(currentJob.id, "picked_up");
    setEnteredPickupOtp("");
  };


  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    if (!currentJob) return;
    if (enteredOtp !== currentJob.otp && enteredOtp !== "1234") {
      setOtpError("Invalid verification code. Please check with customer.");
      return;
    }
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/status`, { status: "DELIVERED" });
    } catch(e) {}
    onUpdateOrderStatus(currentJob.id, "delivered");
    setMockEarnings(prev => prev + 5.50 + 2.00);
    setCompletedCount(prev => prev + 1);
    setEnteredOtp("");
    setActiveJobId(null);
  };

  const allHistoryJobs = [...activeOrders.filter(o => o.riderId === riderPhone && o.status === "delivered").map(job => ({ ...job, payout: 7.50 }))];
  const filteredHistoryJobs = allHistoryJobs.filter(job => {
    if (!historyDateFilter) return true;
    if (!job.timestamp) return false;
    return job.timestamp.startsWith(historyDateFilter);
  });
  const historyPageSize = 100;
  const paginatedHistoryJobs = filteredHistoryJobs.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);
  const totalHistoryPages = Math.ceil(filteredHistoryJobs.length / historyPageSize);


  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
      
      {/* Header Area */}
      <header className="sticky top-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
        <div className="flex items-center gap-3.5 flex-wrap">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs" subColorClass="text-rose-500 text-[8px]" />
          <div className="hidden sm:flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs tracking-tight leading-none text-slate-900 dark:text-[#f0ede6]">Rider Portal</h3>
              <span className="text-[9px] text-slate-400 dark:text-slate-300 font-bold block mt-0.5">{riderName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Duty Switcher */}
          <button
            onClick={handleToggleOnline}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isOnline 
                ? 'bg-rose-500 text-white' 
                : 'bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-[#f0ede6]'
            }`}
          >
            {isOnline ? 'Online Duty' : 'Offline'}
          </button>

          <button
            onClick={() => setView('settings')}
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
        <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 text-slate-800 dark:text-[#f0ede6] h-full mt-4">
          <SharedSettingsView
            onBack={() => setView('home')}
            theme={theme}
            onLogout={onLogout}
          />
        </div>
      ) : (
        <>
          {/* Driver Statistics Panel */}
          <div className="p-5 grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">Today's Earnings</span>
            <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">${mockEarnings.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowHistory(true)}
          className={`bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left transition-all cursor-pointer hover:border-indigo-500/30 ${showHistory ? "ring-2 ring-indigo-500 border-transparent dark:border-transparent" : ""}`}
        >
          <div className="p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">Trips Completed</span>
            <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">{completedCount} orders</span>
          </div>
        </button>

      </div>
      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 flex-1 flex flex-col"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h4 className="font-bold text-lg text-slate-800 dark:text-[#f0ede6] flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> Completed Deliveries</h4>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => { setHistoryDateFilter(e.target.value); setHistoryPage(1); }}
                  className="px-3 py-1.5 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                />
                {historyDateFilter && (
                  <button onClick={() => { setHistoryDateFilter(""); setHistoryPage(1); }} className="text-[10px] text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:text-slate-300 underline">Clear</button>
                )}
              </div>
            </div>
            <div className="space-y-4 overflow-y-auto">
              {paginatedHistoryJobs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 dark:border-rose-500/30 rounded-3xl space-y-2.5 bg-white/40 dark:bg-slate-900/45">
                  <Clock className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-300 opacity-50" />
                  <p className="text-sm font-semibold">No completed deliveries found.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Try selecting a different date.</p>
                </div>
              ) : (
                paginatedHistoryJobs.map(job => (
                  <div key={job.id} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-sm flex flex-col gap-3 transition-all hover:border-indigo-500/30 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-xs text-slate-400 dark:text-slate-300 font-bold">ORDER #{job.id}</p>
                        <p className="font-black text-slate-900 dark:text-[#f0ede6] mt-1">{job.restaurantName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5">{job.timestamp ? new Date(job.timestamp).toLocaleString() : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-500 text-lg">+${job.payout.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-300 font-mono uppercase">Payout</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-rose-500/20 dark:border-rose-500/30 text-xs text-slate-500 dark:text-slate-300">
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.deliveryAddress}</div>
                      <div className="flex items-center gap-1.5 text-emerald-500 font-bold"><Check className="w-3.5 h-3.5" /> Delivered</div>
                    </div>
                  </div>
                ))
              )}
              {totalHistoryPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4 pb-2">
                  <button 
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-300">Page {historyPage} of {totalHistoryPages}</span>
                  <button 
                    disabled={historyPage === totalHistoryPages}
                    onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

          </motion.div>
        ) : !isOnline ? (
          /* OFFLINE COVER */


          <motion.div
            key="offline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-slate-300 space-y-4"
          >
            <div className="p-4 bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-300 rounded-full">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <h4 className="font-bold text-lg text-slate-800 dark:text-[#f0ede6]">You are currently Duty Offline</h4>
            <p className="text-xs text-slate-500 dark:text-slate-300 max-w-xs leading-relaxed">
              Switch your duty status to Online at the top right to start receiving dispatch jobs, navigating maps, and pocketing payouts.
            </p>
          </motion.div>
        ) : currentJob ? (
          /* ------------------- ACTIVE JOB WORKFLOW ------------------- */
          <motion.div
            key="active-job"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-5 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-1.5 text-amber-500">
                <Navigation className="w-5 h-5 animate-spin" /> Active Contract
              </h4>
              <span className="text-xs font-mono bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded">#{currentJob.id}</span>
            </div>

            {/* Immersive Navigation Map Route */}
            <div className="relative w-full h-48 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
              
              {/* Dynamic Map Routing Vector */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                  d="M 15 50 Q 50 20 85 50" 
                  fill="none" 
                  stroke="#334155" 
                  strokeWidth="3" 
                />
                <circle cx="15" cy="50" r="4" fill="#f59e0b" />
                <circle cx="85" cy="50" r="4" fill="#10b981" />
              </svg>

              {/* Waypoints */}
              <div className="absolute left-[15%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-amber-500 flex items-center justify-center shadow">
                  <Store className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-[8px] font-bold mt-1 max-w-[60px] truncate text-center bg-slate-900/80 px-1 rounded">{currentJob.restaurantName}</span>
              </div>

              <div className="absolute right-[15%] top-[50%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-emerald-500 flex items-center justify-center shadow">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-[8px] font-bold mt-1 max-w-[60px] truncate text-center bg-slate-900/80 px-1 rounded">{currentJob.customerName}</span>
              </div>

              {/* Rider Marker */}
              <div 
                className="absolute transition-all duration-1000 ease-in-out flex flex-col items-center"
                style={{
                  left: currentJob.status === 'dispatched' ? '25%' : '75%',
                  top: currentJob.status === 'dispatched' ? '40%' : '40%',
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-lg ring-2 ring-amber-500/30 animate-bounce">
                  <Bike className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Navigation Steps Card */}
            <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-4">
              <div className="space-y-1">
                <h5 className="font-bold text-sm text-slate-400 dark:text-slate-300 font-mono tracking-wider">NAVIGATIONAL STEPS</h5>
                <p className="text-base font-bold text-slate-900 dark:text-[#f0ede6]">
                  {currentJob.status === 'dispatched' ? 'Step 1: Collect food packages' : 'Step 2: Deliver to door'}
                </p>
              </div>

              {/* Waypoint details */}
              <div className="space-y-3.5 text-sm">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">A</div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-300 block font-mono">RESTAURANT ADDRESS</span>
                    <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{currentJob.restaurantName}</span>
                    <p className="text-xs text-slate-400 dark:text-slate-300">Sector 62 food lane, Block B</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">B</div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-300 block font-mono">DELIVERY ADDRESS</span>
                    <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{currentJob.customerName}</span>
                    <p className="text-xs text-slate-400 dark:text-slate-300">{currentJob.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              {/* Items Verification Checklist */}
              <div className="p-4 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm border border-rose-500/20 dark:border-rose-500/30 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 font-mono block">VERIFY DISH COUNT ({currentJob.items.length})</span>
                {currentJob.items.map(item => (
                  <div key={item.item.id} className="flex justify-between text-xs text-slate-600 dark:text-[#f0ede6]">
                    <span>• {item.quantity}x {item.item.name}</span>
                    <span className="font-mono text-emerald-500">PAID</span>
                  </div>
                ))}
              </div>

              {/* State Transition Actions */}
              {currentJob.status === 'dispatched' ? (
                <form onSubmit={handlePickUpFood} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-300 tracking-wider font-mono flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-500" /> RESTAURANT HANDOVER OTP
                    </label>
                    <div className="flex bg-white/40 dark:bg-slate-950/60 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl overflow-hidden focus-within:border-amber-500 transition-colors">
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={enteredPickupOtp}
                        onChange={(e) => setEnteredPickupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Ask restaurant for 6-digit pickup OTP"
                        className="flex-1 px-4 py-3 bg-transparent text-slate-800 dark:text-[#f0ede6] outline-none font-mono text-center tracking-widest text-sm placeholder-slate-400"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-300 text-right italic">
                      💡 Demo hint: Pickup OTP is <strong className="text-amber-500 font-mono text-xs">{currentJob.pickupOtp || "1111"}</strong> or use 1111
                    </p>
                    {pickupOtpError && <p className="text-xs text-rose-500 font-bold mt-1 text-center">{pickupOtpError}</p>}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/20"
                  >
                    Confirm Pickup & Start Driving <ArrowRight className="w-5 h-5" />
                  </button>
                </form>

              ) : (
                /* OTP Verification form to complete order */
                <form onSubmit={handleCompleteDelivery} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-300 tracking-wider font-mono flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-500" /> SECURE CUSTOMER VERIFICATION OTP
                    </label>
                    <div className="flex bg-white/40 dark:bg-slate-950/60 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl overflow-hidden focus-within:border-orange-500 transition-colors">
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Ask customer for 6-digit OTP"
                        className="flex-1 px-4 py-3 bg-transparent text-slate-800 dark:text-[#f0ede6] outline-none font-mono text-center tracking-widest text-sm placeholder-slate-400"
                        required
                      />
                    </div>
                    {/* Demo Helper Hint */}
                    <p className="text-[10px] text-slate-500 dark:text-slate-300 text-right italic">
                      💡 Demo hint: Customer OTP is <strong className="text-amber-500 font-mono text-xs">{currentJob.otp}</strong> or use 1234
                    </p>
                  </div>

                  {otpError && (
                    <div className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                      {otpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/15"
                  >
                    <CheckCircle className="w-5 h-5" /> Confirm Delivery & Credit $7.50
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        ) : (
          /* ------------------- AVAILABLE JOBS BOARD ------------------- */
          <motion.div
            key="jobs-board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm tracking-wide text-slate-400 dark:text-slate-300 uppercase font-mono">Trips available</h4>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold font-mono">AUTO SCANNING</span>
            </div>

            {availableJobs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 dark:border-rose-500/30 rounded-3xl space-y-2.5 bg-white/40 dark:bg-slate-900/45">
                <Map className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-300 animate-pulse" />
                <p className="text-sm font-semibold">Scanning for dispatched contracts...</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                  How to test? Place an order in the <strong>Customer Hub</strong>, then accept/cook/ready the order inside the <strong>Restaurant Manager</strong> to send it to this job board!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableJobs.map(job => (
                  <div 
                    key={job.id} 
                    className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-300">ORDER CONTRACT #{job.id}</span>
                        <h5 className="font-black text-slate-900 dark:text-[#f0ede6]">{job.restaurantName}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 dark:text-slate-300 block font-mono">PAYOUT</span>
                        <span className="text-lg font-black text-emerald-500">$7.50</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono text-slate-500 dark:text-slate-300">
                      <p>📍 Pickup: Sector 62 Food Lane</p>
                      <p>🏠 Dropoff: {job.deliveryAddress}</p>
                      <p>📦 Package: {job.items.length} items • Cash on Delivery</p>
                    </div>

                    <button
                      onClick={() => handleAcceptJob(job)}
                      className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10 border border-rose-500/30"
                    >
                      <Play className="w-4 h-4 fill-current" /> Accept & Open Map
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* COURIER API INTERACTIVE PLAYGROUND */}
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
                <span>Courier API Interactive Forms</span>
                <span className="text-[9px] font-mono bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20">
                  LIVE GATEWAY
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-300 font-normal">Execute and monitor Ecosystem Rider/Courier API references in real-time</p>
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
                  { id: 'telemetry', label: 'Submit Telemetry', method: 'POST' },
                  { id: 'handover', label: 'Handover Verification (OTP)', method: 'POST' },
                  { id: 'delay', label: 'Report Delivery Delay', method: 'POST' },
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
                  
                  {activePlaygroundTab === 'telemetry' && (
                    <form onSubmit={handleUpdateTelemetryApi} className="space-y-3.5">
                      <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                        <strong>POST /api/v1/couriers/&#123;riderId&#125;/telemetry</strong>: Periodically streams live latitude, longitude, and bearing parameters back to the routing dispatcher.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Latitude</label>
                          <input 
                            type="text"
                            value={apiLat}
                            onChange={(e) => setApiLat(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Longitude</label>
                          <input 
                            type="text"
                            value={apiLng}
                            onChange={(e) => setApiLng(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Speed (m/s)</label>
                          <input 
                            type="number"
                            step="0.5"
                            value={apiSpeedMps}
                            onChange={(e) => setApiSpeedMps(e.target.value)}
                            className="w-full px-2 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Bearing (Deg)</label>
                          <input 
                            type="number"
                            value={apiBearing}
                            onChange={(e) => setApiBearing(e.target.value)}
                            className="w-full px-2 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Dispatch Mode</label>
                          <select 
                            value={apiDispatchMode}
                            onChange={(e) => setApiDispatchMode(e.target.value as any)}
                            className="w-full px-2 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                          >
                            <option value="AUTOMATIC">AUTOMATIC</option>
                            <option value="MANUAL">MANUAL</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-rose-500/10"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Transmit Live Telemetry API</span>
                      </button>
                    </form>
                  )}

                  {activePlaygroundTab === 'handover' && (
                    <form onSubmit={handleHandoverVerificationApi} className="space-y-3.5">
                      <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                        <strong>POST /api/v1/couriers/&#123;riderId&#125;/handover-verification</strong>: Validates customer secure handover OTP code inside the logistics gateway and triggers instant payouts.
                      </p>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Select Target Job</label>
                        {activePickupOrDispatched.length === 0 ? (
                          <div className="text-xs text-red-400 bg-red-400/5 border border-red-400/10 p-2.5 rounded-xl font-medium">
                            No active ongoing deliveries. Accept an available contract above first.
                          </div>
                        ) : (
                          <select 
                            value={apiOtpOrderId}
                            onChange={(e) => setApiOtpOrderId(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                          >
                            {activePickupOrDispatched.map(o => (
                              <option key={o.id} value={o.id}>Order #{o.id} - {o.restaurantName} (OTP: {o.otp})</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1 space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Secure OTP</label>
                          <input 
                            type="text"
                            value={apiOtpCode}
                            onChange={(e) => setApiOtpCode(e.target.value)}
                            placeholder="e.g. 1234"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                            maxLength={4}
                            required
                          />
                        </div>
                        <div className="col-span-1 space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Dropoff Lat</label>
                          <input 
                            type="text"
                            value={apiOtpLat}
                            onChange={(e) => setApiOtpLat(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                            required
                          />
                        </div>
                        <div className="col-span-1 space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Dropoff Lng</label>
                          <input 
                            type="text"
                            value={apiOtpLng}
                            onChange={(e) => setApiOtpLng(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={activePickupOrDispatched.length === 0}
                        className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify Handover & Pay Out API</span>
                      </button>
                    </form>
                  )}

                  {activePlaygroundTab === 'delay' && (
                    <form onSubmit={handleReportDeliveryDelayApi} className="space-y-3.5">
                      <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                        <strong>POST /api/v1/couriers/&#123;riderId&#125;/delay-report</strong>: Submits critical courier delay incidents (traffic, mechanical, force-majeure) to recalculate service targets.
                      </p>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Select Target Job</label>
                        {activePickupOrDispatched.length === 0 ? (
                          <div className="text-xs text-red-400 bg-red-400/5 border border-red-400/10 p-2.5 rounded-xl font-medium">
                            No active ongoing deliveries. Accept an available contract above first.
                          </div>
                        ) : (
                          <select 
                            value={apiDelayOrderId}
                            onChange={(e) => setApiDelayOrderId(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                          >
                            {activePickupOrDispatched.map(o => (
                              <option key={o.id} value={o.id}>Order #{o.id} - {o.restaurantName}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Revised ETA addition (Secs)</label>
                          <input 
                            type="number"
                            value={apiDelayRevisedEta}
                            onChange={(e) => setApiDelayRevisedEta(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono text-center"
                            min="60"
                            max="7200"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Incident Reason</label>
                          <input 
                            type="text"
                            value={apiDelayReason}
                            onChange={(e) => setApiDelayReason(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={activePickupOrDispatched.length === 0}
                        className="w-full py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>File Critical Delay API</span>
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

      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl w-full max-w-sm rounded-3xl p-6 shadow-xl border border-rose-500/20 dark:border-rose-500/30"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-[#f0ede6] leading-tight">Driver Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Update your details for verification</p>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-red-600 dark:text-red-400 leading-relaxed">{errorMsg}</p>
                </div>
              )}
              <form onSubmit={handleOnboard} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide px-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={riderName}
                    onChange={e => setRiderName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-[#f0ede6] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide px-1">Phone Number</label>
                  <input
                    type="tel"
                    readOnly
                    value={riderPhone}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-slate-100 dark:bg-slate-900 text-sm font-medium text-slate-500 dark:text-[#f0ede6] cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide px-1">Vehicle Registration</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA01AB1234"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-[#f0ede6] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide px-1">Profile Photo URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-[#f0ede6] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all focus:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:focus:shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="flex-1 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 border border-rose-500/20 dark:border-rose-500/30 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pingJob && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 bottom-4 z-50 bg-slate-900 border border-rose-500/30 p-5 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
            <div className="relative flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-black text-lg uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  New Dispatch
                </h3>
                <p className="text-emerald-400 text-xs font-mono font-bold mt-1">Est. Payout: $7.50</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100" strokeDashoffset={100 - (pingTimer / 30) * 100} className="text-emerald-500 transition-all duration-1000 ease-linear" />
                </svg>
                {pingTimer}s
              </div>
            </div>
            <div className="space-y-3 mb-5 relative">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider">Pickup</span>
                  <span className="block text-sm text-slate-200 font-medium">{pingJob.restaurantName}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider">Dropoff</span>
                  <span className="block text-sm text-slate-200 font-medium">{pingJob.deliveryAddress}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 relative">
              <button
                onClick={() => handleTimeoutPing(pingJob.id)}
                className="flex-1 py-3.5 rounded-xl border border-orange-500/30 text-slate-400 dark:text-slate-300 font-bold hover:bg-slate-800 transition-colors hover:shadow-[0_0_12px_rgba(249,115,22,0.4)] dark:hover:shadow-[0_0_12px_rgba(249,115,22,0.5)] hover:border-orange-500/50 transition-all text-[10px]"
              >
                Timeout
              </button>
              <button
                onClick={() => handleRejectPing(pingJob.id)}
                className="flex-1 py-3.5 rounded-xl border border-rose-500/30 text-slate-400 dark:text-slate-300 font-bold hover:bg-slate-800 transition-colors hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all text-xs"
              >
                Decline
              </button>
              <button
                onClick={() => handleAcceptPing(pingJob)}
                className="flex-[2] py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-black uppercase tracking-wide hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Accept Order
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CompleteProfileModal 
        isOpen={showCompleteProfileModal} 
        theme={theme} 
        profileId={user?.id || ''}
        onComplete={(profile) => {
          setUser(prev => prev ? { ...prev, name: profile.name, email: profile.email } : prev);
          setShowCompleteProfileModal(false);
          // check if vehicle number is missing, if so show the delivery onboarding
          if (!vehicleNumber) {
            setShowProfile(true);
          }
        }} 
      />


    </>
      )}
    </div>
  );
}
