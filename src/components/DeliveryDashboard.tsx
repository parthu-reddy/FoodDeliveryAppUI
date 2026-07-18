import React, { useState, useEffect, useRef } from 'react';
import { 
  Bike, DollarSign, Map, CheckCircle, Navigation, Play, Eye, 
  MapPin, LogOut, Check, Clock, ArrowRight, ShieldAlert, KeyRound, MessageCircle, Store, Sun, Moon,
  Terminal, Sliders, Code, Send, CheckCircle2, AlertCircle, User, ArrowLeft, X, MapPinOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus } from '../types';
import LaBouffeLogo from './LaBouffeLogo';
import { apiGet, apiPost } from '../lib/apiClient';
import { getUserProfile, getToken } from '../lib/tokenStore';
import CompleteProfileModal from './CompleteProfileModal';
import RiderSettingsView from './RiderSettingsView';
import OrderTrackingMap from './OrderTrackingMap';

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
  const [user, setUser] = useState(getUserProfile());
  // Internal order state
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const activeOrders = externalOrders ?? internalOrders;

  const onUpdateOrderStatus = externalUpdateStatus ?? ((orderId: string, status: OrderStatus) => {
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  });
  const [isOnline, setIsOnline] = useState(false);
  const todayDateString = new Date().toISOString().split('T')[0];
  const [historyDateFilter, setHistoryDateFilter] = useState(todayDateString);
  const [historyPage, setHistoryPage] = useState(1);

  const todayIso = new Date().toISOString();

  const [showHistory, setShowHistory] = useState(false);
  const [isProfileMandatory, setIsProfileMandatory] = useState(false);
  const [showPermissionsPrompt, setShowPermissionsPrompt] = useState(false);
  const [showProfileRequiredPrompt, setShowProfileRequiredPrompt] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [enteredPickupOtp, setEnteredPickupOtp] = useState("");
  const [pickupOtpError, setPickupOtpError] = useState("");

  const [otpError, setOtpError] = useState("");
  const [isUpdatingPickup, setIsUpdatingPickup] = useState(false);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [mockEarnings, setMockEarnings] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [riderId, setRiderId] = useState("");

  const [riderName, setRiderName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const historyRef = useRef<any[]>([]);

  useEffect(() => {
    if (!isOnline || !riderId) return; // Only fetch if actively online

    let timeout: NodeJS.Timeout;
    let isCancelled = false;

    let lastActiveCount = 0;

    const fetchOrders = async () => {
      try {
        let fetchedActiveJobs: any[] = [];
        let fetchedAvailableJobs: any[] = [];

        // 1. Fetch Active Job
        const activeRes = await apiGet(`/api/v1/delivery/orders/active`);
        if (!isCancelled && activeRes.data) {
           fetchedActiveJobs = activeRes.data.map((o: any) => ({ ...o, status: o.status?.toLowerCase() || '' }));
        }

        // 2. Fetch Available Pings (Only if NO active jobs)
        if (!isCancelled && fetchedActiveJobs.length === 0) {
           const availableRes = await apiGet(`/api/v1/delivery/orders/available`);
           if (availableRes.data) {
              fetchedAvailableJobs = availableRes.data.map((o: any) => ({ ...o, status: o.status?.toLowerCase() || '' }));
           }
        }

        // 3. Fetch History if an active job disappeared (e.g. cancelled by restaurant)
        if (!isCancelled && lastActiveCount > 0 && fetchedActiveJobs.length === 0) {
           const today = new Date().toISOString().split('T')[0];
           const histRes = await apiGet(`/api/v1/delivery/orders/history?date=${today}`);
           if (histRes.data) {
              historyRef.current = histRes.data.map((o: any) => ({ ...o, status: o.status?.toLowerCase() || '' }));
           }
        }
        
        if (!isCancelled) {
           lastActiveCount = fetchedActiveJobs.length;
           // Merge by ID to avoid duplicates (active jobs override history jobs)
           const mergedMap = new Map();
           historyRef.current.forEach(j => mergedMap.set(j.id, j));
           fetchedActiveJobs.forEach(j => mergedMap.set(j.id, j));
           fetchedAvailableJobs.forEach(j => mergedMap.set(j.id, j));
           setInternalOrders(Array.from(mergedMap.values()));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) {
          timeout = setTimeout(fetchOrders, 5000);
        }
      }
    };
    
    fetchOrders(); // Initial fetch
    
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [isOnline, riderId]);

  // Handle fetching history independently
  useEffect(() => {
    if (!isOnline || !riderId) return;
    
    // If history modal is open, fetch for the selected date. Otherwise fetch today's date for the badge.
    const dateToFetch = showHistory ? historyDateFilter : new Date().toISOString().split('T')[0];
    if (!dateToFetch) return;

    apiGet(`/api/v1/delivery/orders/history?date=${dateToFetch}`).then(res => {
      if (res.data) {
        historyRef.current = res.data.map((o: any) => ({ ...o, status: o.status?.toLowerCase() || '' }));
        // We don't want to overwrite active jobs, just merge the updated history
        setInternalOrders(prev => {
          const active = prev.filter(o => ['dispatched', 'ready_for_pickup', 'out_for_delivery'].includes(o.status));
          const mergedMap = new Map();
          historyRef.current.forEach((j: any) => mergedMap.set(j.id, j));
          active.forEach(j => mergedMap.set(j.id, j));
          return Array.from(mergedMap.values());
        });
      }
    }).catch(console.error);
  }, [showHistory, historyDateFilter, isOnline, riderId]);

  const [pingJob, setPingJob] = useState<Order | null>(null);
  const [pingTimer, setPingTimer] = useState(30);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [view, setView] = useState<'home' | 'settings'>('home');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  React.useEffect(() => {
    if (isOnline && !activeJobId && !pingJob) {
      const jobs = activeOrders.filter(o => !o.riderId && !rejectedIds.has(o.id));
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
      const ongoingJob = activeOrders.find(o => (o.riderId === riderId || !!o.riderId) && o.status !== "delivered" && o.status !== "cancelled" && o.status !== "cancelled_by_restaurant");
      if (ongoingJob) {
        setActiveJobId(ongoingJob.id);
      }
    } else {
      // Check if current job was cancelled
      const currentJobStatus = activeOrders.find(o => o.id === activeJobId)?.status?.toLowerCase();
      if (currentJobStatus === 'cancelled' || currentJobStatus === 'cancelled_by_restaurant') {
        showToast("Your current order was cancelled by the restaurant.");
        setActiveJobId(null);
      }
    }
  }, [activeOrders, riderId, activeJobId]);


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
    let watchId: number;
    let currentLat = 12.9716;
    let currentLng = 77.5946;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          currentLat = pos.coords.latitude;
          currentLng = pos.coords.longitude;
        },
        (err) => {
          console.error("Location error:", err);
          if (riderId) { // Safeguard against missing riderId
            apiPost(`/api/delivery/status`, { driverId: riderId, available: false })
              .catch(e => console.error(e));
          }
          setIsOnline(false);
          setShowLocationPrompt(true);
        },
        { enableHighAccuracy: true }
      );
    }
    
    const connectWs = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const token = getToken();
      ws = new WebSocket(`${protocol}//${window.location.host}/api/delivery/ws/telemetry?token=${token}`);
      ws.onopen = () => {
        interval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ driverId: riderId, lat: currentLat, lng: currentLng, timestamp: new Date().toISOString() }));
          }
        }, 5000);
      };
      ws.onerror = () => {
        // Fallback to HTTP if WS fails
        if (interval) clearInterval(interval);
        interval = setInterval(async () => {
          try {
            await apiPost("/api/v1/delivery/telemetry/batch", [{ driverId: riderId, lat: currentLat, lng: currentLng, timestamp: new Date().toISOString() }]);
          } catch(e) {}
        }, 5000);
      };
    };
    connectWs();

    return () => {
      if (interval) clearInterval(interval);
      if (ws) ws.close();
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
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
            // Do not show modal for delivery executive
          }
        }
      })
      .catch(err => {
        if (err?.status !== 404) console.warn("Failed to fetch unified profile:", err);
      });

    // Fetch delivery-specific profile details
    apiGet(`/api/delivery/profile?phoneNumber=${encodeURIComponent(riderPhone)}`)
      .then(data => {
        if (data.success) {
          const profile = data.data;
          if (!riderName) setRiderName(profile.fullName || profile.name || "");
          setVehicleNumber(profile.vehicleNumber || "");
          setPhotoUrl(profile.photoUrl || "");
          setIsOnline(profile.isOnline || profile.status === 'ONLINE' || profile.status === 'ON_DELIVERY');
          setRiderId(profile.id);
          
          if (!profile.vehicleNumber || !profile.fullName || !profile.photoUrl) {
            setIsProfileMandatory(true);
            setShowProfileRequiredPrompt(true);
          } else {
            setIsProfileMandatory(false);
          }
        } else {
          setIsProfileMandatory(true);
          setShowProfileRequiredPrompt(true);
        }
      })
      .catch(err => {
        if (err?.status === 404) {
          setIsProfileMandatory(true);
          setShowProfileRequiredPrompt(true);
        } else {
          console.error("Profile fetch error:", err);
          showToast(err.message || "Failed to load profile");
        }
      })
      .finally(() => setIsLoadingProfile(false));
  }, [riderPhone]);



  const requestPermissionsAndGoOnline = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const notifyPermission = await Notification.requestPermission();
      if (notifyPermission !== 'granted') {
        showToast("Notification permission is required. Please enable in browser settings if denied.");
        return;
      }
    }

    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await apiPost(`/api/delivery/status`, { driverId: riderId, available: true });
          setIsOnline(true);
          setShowPermissionsPrompt(false);
        } catch(e) {
          console.error("Failed to toggle status", e);
        }
      },
      (error) => {
        showToast("Location permission is required. Please enable in browser settings if denied.");
        console.error("Error getting location", error);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleToggleOnline = async () => {
    if (!riderId || isProfileMandatory) {
      setShowProfileRequiredPrompt(true);
      return;
    }
    if (!isOnline) {
      let notifyGranted = false;
      if ('Notification' in window && Notification.permission === 'granted') {
        notifyGranted = true;
      }

      let locationGranted = false;
      try {
        if (navigator.permissions) {
          const perm = await navigator.permissions.query({ name: 'geolocation' });
          if (perm.state === 'granted') {
            locationGranted = true;
          }
        }
      } catch (e) {
        // Fallback or ignore if navigator.permissions is not supported
      }

      if (notifyGranted && locationGranted) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await apiPost(`/api/delivery/status`, { driverId: riderId, available: true });
              setIsOnline(true);
            } catch(e) {
              console.error("Failed to toggle status", e);
            }
          },
          (error) => {
            setShowPermissionsPrompt(true);
            console.error("Error getting location", error);
          },
          { enableHighAccuracy: true }
        );
      } else {
        setShowPermissionsPrompt(true);
      }
    } else {
      try {
        await apiPost(`/api/delivery/status`, { driverId: riderId, available: false });
        setIsOnline(false);
      } catch(e) {
        console.error("Failed to toggle status", e);
      }
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
      showToast("Please select or accept an active job first!");
      return;
    }
    const order = activeOrders.find(o => o.id === apiOtpOrderId);
    if (!order) return;

    if (apiOtpCode !== order.otp && apiOtpCode !== '1234') {
      showToast(`Invalid secure handover OTP. True OTP is ${order.otp} or use 1234.`);
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
      showToast("Please select or accept an active job first!");
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
        onAddApiLog({ id: 'delivery_route', label: `GET /api/v1/logistics/route?sourceLat={riderLat}&sourceLng={riderLng}&destLat=${currentJob.deliveryLat}&destLng=${currentJob.deliveryLng}`, method: 'GET' });
      }
      // Note: Actually fetching the route is not strictly needed for the map to render (the map uses MapLibre with native directions).
      // If we wanted to draw the exact polyline, we would call /api/v1/logistics/route here and pass it to the map.
    }
  }, [currentJob?.id, currentJob?.status]);

  React.useEffect(() => {
    if (currentJob?.status) {
      setIsUpdatingPickup(false);
      setIsUpdatingDelivery(false);
    }
  }, [currentJob?.status]);

  // Filter jobs available on the job board (orders that are dispatched but have no rider assigned yet)
  const availableJobs = activeOrders.filter(o => o.status === 'dispatched' && !o.riderId);

  const handleAcceptJob = async (order: Order) => {
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${order.id}/accept`, {});
      setActiveJobId(order.id);
      // Wait for next fetchOrders cycle or update optimisticly
      onUpdateOrderStatus(order.id, 'dispatched', { name: riderName, phone: riderPhone });
    } catch (e: any) {
      console.error("Failed to accept job", e);
      alert(e.response?.data?.message || "Failed to accept job. It might have been assigned to someone else or cancelled.");
    }
  };

  const handleArrivedAtRestaurant = () => {
    if (!currentJob) return;
    // Keep dispatched but indicate progress or just pick up directly
  };

  const handlePickUpFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setPickupOtpError("");
    if (!currentJob) return;
    if (enteredPickupOtp !== currentJob.pickupOtp) {
      setPickupOtpError("Invalid verification code. Please check with restaurant.");
      return;
    }
    
    // Optimistic Update
    const previousStatus = currentJob.status;
    onUpdateOrderStatus(currentJob.id, 'out_for_delivery');
    setIsUpdatingPickup(true);
    
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/status`, { status: "PICKED_UP", pickupOtp: enteredPickupOtp });
      setIsUpdatingPickup(false);
    } catch(e) {
      setIsUpdatingPickup(false);
      onUpdateOrderStatus(currentJob.id, previousStatus); // Revert on failure
      showToast("Failed to verify OTP with server. Please try again.");
    }
    setEnteredPickupOtp("");
  };


  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    if (!currentJob) return;
    if (enteredOtp !== currentJob.otp) {
      setOtpError("Invalid verification code. Please check with customer.");
      return;
    }
    
    // Optimistic Update
    const previousStatus = currentJob.status;
    onUpdateOrderStatus(currentJob.id, 'delivered');
    setIsUpdatingDelivery(true);
    
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/status`, { status: "DELIVERED" });
      setIsUpdatingDelivery(false);
      
      // Update history so it's immediately visible
      historyRef.current = [{...currentJob, status: 'delivered'}, ...historyRef.current];

      setMockEarnings(prev => prev + 5.50 + 2.00);
      setCompletedCount(prev => prev + 1);
      setActiveJobId(null);
    } catch(e) {
      setIsUpdatingDelivery(false);
      onUpdateOrderStatus(currentJob.id, previousStatus); // Revert on failure
      showToast("Failed to verify Delivery OTP with server. Please try again.");
    }
    setEnteredOtp("");
  };

  const allHistoryJobs = [...activeOrders.filter(o => o.riderId === riderId && o.status === "delivered").map(job => ({ ...job, payout: 7.50 }))];
  const filteredHistoryJobs = allHistoryJobs.filter(job => {
    if (!historyDateFilter) return true;
    if (!job.createdAt) return false;
    return job.createdAt.startsWith(historyDateFilter);
  });
  const historyPageSize = 100;
  const paginatedHistoryJobs = filteredHistoryJobs.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);
  const totalHistoryPages = Math.ceil(filteredHistoryJobs.length / historyPageSize);

  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-transparent h-full">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 bg-transparent text-slate-800 dark:text-[#f0ede6] h-full pb-20">
      
      {/* Global Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-12 left-0 right-0 mx-auto max-w-sm z-[100] px-4"
          >
            <div className="bg-rose-500/90 backdrop-blur-xl border border-rose-500/50 shadow-2xl rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-white shrink-0" />
              <p className="text-white font-medium text-sm pt-0.5">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Area */}
      <header className="sticky top-0 bg-white/20 dark:bg-slate-950/20 backdrop-blur-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
        <div className="flex items-center gap-3.5 flex-wrap">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs" subColorClass="text-rose-500 text-[8px]" />
          <div className="hidden sm:flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <button 
            onClick={() => setView('settings')}
            className="flex items-center gap-2 text-left hover:bg-slate-100 dark:hover:bg-slate-900 p-1.5 -ml-1.5 rounded-xl transition-colors cursor-pointer"
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-rose-500/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Bike className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-xs tracking-tight leading-none text-slate-900 dark:text-[#f0ede6]">
                {riderName || "Rider Portal"}
              </h3>
              {vehicleNumber && (
                <span className="text-[9px] text-slate-400 dark:text-slate-300 font-bold block mt-0.5">
                  {vehicleNumber}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Duty Switcher */}
          <button
            onClick={handleToggleOnline}
            disabled={!riderId || isProfileMandatory}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isOnline 
                ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
                : (!riderId || isProfileMandatory)
                  ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed'
                  : 'bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-[#f0ede6]'
            }`}
          >
            {isOnline ? 'Online Duty' : 'Offline'}
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
        <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden min-h-0 text-slate-800 dark:text-[#f0ede6] h-full mt-4">
          <RiderSettingsView
            onBack={() => setView('home')}
            theme={theme}
            onLogout={onLogout}
            isProfileMandatory={isProfileMandatory}
            riderPhone={riderPhone}
            onProfileUpdated={() => {
              apiGet(`/api/delivery/profile?phoneNumber=${encodeURIComponent(riderPhone)}`)
                .then(data => {
                  if (data.success) {
                    const profile = data.data;
                    setRiderName(profile.fullName || profile.name || "");
                    setVehicleNumber(profile.vehicleNumber || "");
                    setPhotoUrl(profile.photoUrl || "");
                    setIsProfileMandatory(false);
                    setView('home');
                  }
                });
            }}
          />
        </div>
      ) : (
        <>
          {/* Driver Statistics Panel */}
          <div className="p-5 grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 shadow-sm flex items-center gap-3">
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
          className={`bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left transition-all cursor-pointer hover:border-indigo-500/30 ${showHistory ? "ring-2 ring-indigo-500 border-transparent dark:border-transparent" : ""}`}
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
                  className="px-3 py-1.5 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
                />
                {historyDateFilter && (
                  <button onClick={() => { setHistoryDateFilter(""); setHistoryPage(1); }} className="text-[10px] text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:text-slate-300 underline">Clear</button>
                )}
              </div>
            </div>
            <div className="space-y-4 overflow-y-auto">
              {paginatedHistoryJobs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 dark:border-rose-500/30 rounded-3xl space-y-2.5 bg-white/20 dark:bg-slate-900/45">
                  <Clock className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-300 opacity-50" />
                  <p className="text-sm font-semibold">No completed deliveries found.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Try selecting a different date.</p>
                </div>
              ) : (
                paginatedHistoryJobs.map(job => (
                  <div key={job.id} className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-sm flex flex-col gap-3 transition-all hover:border-indigo-500/30 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-xs text-slate-400 dark:text-slate-300 font-bold">ORDER #{job.id.substring(0, 8)}</p>
                        <p className="font-black text-slate-900 dark:text-[#f0ede6] mt-1">{job.restaurantName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5">{job.createdAt ? new Date(job.createdAt).toLocaleString() : ""}</p>
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

            {/* Map Integration */}
            <div className="relative w-full h-64 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl mb-6 overflow-hidden border border-slate-200 dark:border-slate-700/50">
              <OrderTrackingMap order={currentJob} />
              <div className="absolute top-2 right-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1.5 pointer-events-none">
                <MapPin className="w-3 h-3 text-indigo-500" />
                Tap markers for Google Maps
              </div>
            </div>

            {/* Navigation Steps Card */}
            <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-4">
              <div className="space-y-1">
                <h5 className="font-bold text-sm text-slate-400 dark:text-slate-300 font-mono tracking-wider">NAVIGATIONAL STEPS</h5>
                <p className="text-base font-bold text-slate-900 dark:text-[#f0ede6]">
                  {['dispatched', 'DISPATCHED', 'ready_for_pickup', 'READY_FOR_PICKUP'].includes(currentJob.status) ? 'Step 1: Collect food packages' : 'Step 2: Deliver to door'}
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
              <div className="p-4 bg-white/20 dark:bg-slate-950/20 backdrop-blur-sm border border-rose-500/20 dark:border-rose-500/30 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 font-mono block">VERIFY DISH COUNT ({(currentJob.items || []).length})</span>
                {(currentJob.items || []).map((item: any, idx: number) => (
                  <div key={item.item?.id || idx} className="flex justify-between text-xs text-slate-600 dark:text-[#f0ede6]">
                    <span>• {item.quantity || 1}x {item.item?.name || item.name || 'Item'}</span>
                    <span className="font-mono text-emerald-500">PAID</span>
                  </div>
                ))}
              </div>

              {/* State Transition Actions */}
              {['dispatched', 'DISPATCHED', 'ready_for_pickup', 'READY_FOR_PICKUP'].includes(currentJob.status) ? (
                <form onSubmit={handlePickUpFood} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-300 tracking-wider font-mono flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-500" /> RESTAURANT HANDOVER OTP
                    </label>
                    <div className="flex bg-white/20 dark:bg-slate-950/20 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl overflow-hidden focus-within:border-amber-500 transition-colors">
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={enteredPickupOtp}
                        onChange={(e) => setEnteredPickupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit pickup OTP"
                        className="flex-1 px-4 py-3 bg-transparent text-slate-800 dark:text-[#f0ede6] outline-none font-mono text-center tracking-widest text-sm placeholder-slate-400"
                        required
                      />
                    </div>

                    {pickupOtpError && <p className="text-xs text-rose-500 font-bold mt-1 text-center">{pickupOtpError}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdatingPickup}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/20 disabled:opacity-70"
                  >
                    {isUpdatingPickup ? "Confirming..." : <>Confirm Pickup & Start Driving <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>

              ) : (
                /* OTP Verification form to complete order */
                <form onSubmit={handleCompleteDelivery} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-300 tracking-wider font-mono flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-500" /> SECURE CUSTOMER VERIFICATION OTP
                    </label>
                    <div className="flex bg-white/20 dark:bg-slate-950/20 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl overflow-hidden focus-within:border-orange-500 transition-colors">
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

                  </div>

                  {otpError && (
                    <div className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                      {otpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUpdatingDelivery}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/15 disabled:opacity-70"
                  >
                    {isUpdatingDelivery ? "Confirming..." : <><CheckCircle className="w-5 h-5" /> Confirm Delivery & Credit $7.50</>}
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
              <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 dark:border-rose-500/30 rounded-3xl space-y-2.5 bg-white/20 dark:bg-slate-900/45">
                <Map className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-300 animate-pulse" />
                <p className="text-sm font-semibold">Scanning for dispatched contracts...</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                  Waiting for new delivery requests in your area. Keep your status Online to receive dispatch pings.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableJobs.map(job => (
                  <div 
                    key={job.id} 
                    className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-300">ORDER CONTRACT #{job.id.substring(0, 8)}</span>
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
                      <p>📦 Package: {(job.items || []).length} items • Cash on Delivery</p>
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

      <AnimatePresence>
        {showPermissionsPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-sm bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPermissionsPrompt(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-8 pb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Permissions Required</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                  To receive order assignments and go on duty, we need your permission to access your location and send notifications.
                </p>
                <button
                  onClick={requestPermissionsAndGoOnline}
                  className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors"
                >
                  Enable Permissions
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileRequiredPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-sm bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setShowProfileRequiredPrompt(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-8 pb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 text-rose-500">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Profile Required</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                  Please complete your driver profile (Name, Vehicle, Photo) before you can go on duty and start receiving orders.
                </p>
                <button
                  onClick={() => {
                    setShowProfileRequiredPrompt(false);
                    setView('settings');
                  }}
                  className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors"
                >
                  Complete Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
      )}
    </div>
  );
}
