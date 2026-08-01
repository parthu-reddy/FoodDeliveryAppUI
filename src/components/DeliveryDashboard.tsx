import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { 
  Bike, DollarSign, Map as MapIcon, CheckCircle, Navigation, Play, Eye, 
  MapPin, LogOut, Check, Clock, ArrowRight, ShieldAlert, KeyRound, MessageCircle, Store, Sun, Moon,
  Terminal, Sliders, Code, Send, CheckCircle2, AlertCircle, User, ArrowLeft, X, MapPinOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { z } from 'zod';
import { Order, OrderStatus, DeliveryStatus } from '../types';
import LaBouffeLogo from './LaBouffeLogo';
import { apiGet, apiPost } from '../lib/apiClient';
import { getUserProfile, getToken } from '../lib/tokenStore';
import CompleteProfileModal from './CompleteProfileModal';
import RiderSettingsView from './RiderSettingsView';
import RiderOnboardingWizard from './RiderOnboardingWizard';
import OrderTrackingMap from './OrderTrackingMap';
import ImageLoader from './ImageLoader';
import ActiveDeliveryCard from './ActiveDeliveryCard';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { isActiveOrder, isFailedOrder } from '../utils/orderStatus';
import { ChatWidget } from './ChatWidget';

const otpSchema = z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits");

interface DeliveryDashboardProps {
  riderPhone: string;
  activeOrders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, deliveryStatus?: DeliveryStatus, riderInfo?: { name: string }) => void;
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
  const { showError, showSuccess, showInfo } = useToast();
  const [user, setUser] = useState(getUserProfile());
  // Internal order state
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const activeOrders = externalOrders ?? internalOrders;

  const onUpdateOrderStatus = externalUpdateStatus ?? ((orderId: string, status: OrderStatus, deliveryStatus?: DeliveryStatus, riderInfo?: any) => {
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...(deliveryStatus ? { deliveryStatus } : {}) } : o));
  });
  const [isOnline, setIsOnline] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const todayDateString = new Date().toISOString().split('T')[0];
  const [historyDateFilter, setHistoryDateFilter] = useState(todayDateString);
  const [historyPage, setHistoryPage] = useState(1);

  const todayIso = new Date().toISOString();

  const [showHistory, setShowHistory] = useState(false);
  const [isProfileMandatory, setIsProfileMandatory] = useState(false);
  const [showPermissionsPrompt, setShowPermissionsPrompt] = useState(false);
  const [showProfileRequiredPrompt, setShowProfileRequiredPrompt] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isVerificationLoaded, setIsVerificationLoaded] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [enteredPickupOtp, setEnteredPickupOtp] = useState("");
  const [pickupOtpError, setPickupOtpError] = useState("");

  const [otpError, setOtpError] = useState("");
  const [isUpdatingPickup, setIsUpdatingPickup] = useState(false);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);

  const [goOfflineAfter, setGoOfflineAfter] = useState(false);
  const [waitTimerSeconds, setWaitTimerSeconds] = useState(0);
  const [isWaitTimerActive, setIsWaitTimerActive] = useState(false);

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

        const getArrayFromRes = (res: any) => res?.data?.data || res?.data || (Array.isArray(res) ? res : []);

        // 1. Fetch Active Job
        const activeRes = await apiGet(`/api/v1/delivery/orders/active`);
        if (!isCancelled && activeRes) {
           const activeData = getArrayFromRes(activeRes);
           fetchedActiveJobs = activeData.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
        }

        // 2. Fetch Available Pings (Only if NO active jobs)
        if (!isCancelled && fetchedActiveJobs.length === 0) {
           const availableRes = await apiGet(`/api/v1/delivery/orders/available`);
           if (availableRes) {
              const availableData = getArrayFromRes(availableRes);
              fetchedAvailableJobs = availableData.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
              
              if (fetchedAvailableJobs.length > 0) {
                const newPingId = fetchedAvailableJobs[0].id;
                setRejectedIds(prev => {
                  if (prev.has(newPingId)) {
                    const newSet = new Set(prev);
                    newSet.delete(newPingId);
                    return newSet;
                  }
                  return prev;
                });
              }
           }
        }

        // 3. Fetch History if an active job disappeared (e.g. cancelled by restaurant)
        const hasStaleActiveJobInHistory = historyRef.current.some(j => 
            j.deliveryStatus !== DeliveryStatus.DELIVERED && 
            j.deliveryStatus !== DeliveryStatus.FAILED && 
            j.status !== OrderStatus.CANCELLED && 
            j.status !== OrderStatus.CANCELLED_BY_RESTAURANT && 
            !fetchedActiveJobs.find(a => a.id === j.id)
        );

        if (!isCancelled && ((lastActiveCount > 0 && fetchedActiveJobs.length === 0) || hasStaleActiveJobInHistory)) {
           const today = new Date().toISOString().split('T')[0];
           const histRes = await apiGet(`/api/v1/delivery/orders/history?date=${today}`);
           if (histRes) {
              const histData = getArrayFromRes(histRes);
              historyRef.current = histData.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
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
      if (res) {
        const getArrayFromRes = (res: any) => res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
        const histData = getArrayFromRes(res);
        historyRef.current = histData.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
        // We don't want to overwrite active jobs, just merge the updated history
        setInternalOrders(prev => {
          const active = prev.filter(o => isActiveOrder(o));
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
        if (jobs[0].remainingPingSeconds !== undefined) {
          setPingTimer(jobs[0].remainingPingSeconds);
        } else if (jobs[0].expiresAt) {
          const remainingSecs = Math.max(0, Math.floor((jobs[0].expiresAt - Date.now()) / 1000));
          setPingTimer(remainingSecs);
        } else {
          setPingTimer(60);
        }
      }
    }
    if (!isOnline || activeJobId) {
      setPingJob(null);
    } else if (pingJob) {
      const stillActive = activeOrders.find(o => o.id === pingJob.id);
      if (!stillActive) {
        setPingJob(null);
      }
    }
  }, [activeOrders, isOnline, activeJobId, rejectedIds, pingJob]);
  React.useEffect(() => {
    if (!activeJobId) {
      const ongoingJob = activeOrders.find(o => (o.riderId === riderId || !!o.riderId) && o.deliveryStatus !== DeliveryStatus.DELIVERED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.CANCELLED_BY_RESTAURANT && o.deliveryStatus !== DeliveryStatus.FAILED);
      if (ongoingJob) {
        setActiveJobId(ongoingJob.id);
      }
    } else {
      // Check if current job was cancelled, failed, delivered, or disappeared
      const currentJob = activeOrders.find(o => o.id === activeJobId);
      const currentJobStatus = currentJob?.status;
      const currentJobDeliveryStatus = currentJob?.deliveryStatus;
      if (!currentJob || currentJobStatus === OrderStatus.CANCELLED || currentJobStatus === OrderStatus.CANCELLED_BY_RESTAURANT || currentJobDeliveryStatus === DeliveryStatus.FAILED || currentJobDeliveryStatus === DeliveryStatus.DELIVERED) {
        if (currentJobDeliveryStatus === DeliveryStatus.FAILED || currentJobStatus === OrderStatus.CANCELLED || currentJobStatus === OrderStatus.CANCELLED_BY_RESTAURANT) {
           showToast("Your current order is no longer active (cancelled or failed).");
        }
        setActiveJobId(null);
      }
    }
  }, [activeOrders, riderId, activeJobId]);


  React.useEffect(() => {
    if (pingJob) {
      // Play notification ping sound
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (e) {
        // Audio playback failed
      }

      const timer = setInterval(() => {
        setPingTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setRejectedIds(prev => new Set(prev).add(pingJob.id));
            setPingJob(null);
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
      setActiveJobId(job.id);
      onUpdateOrderStatus(job.id, job.status, DeliveryStatus.ASSIGNED, { name: riderName });
    } catch(e: any) {
      showToast(e.response?.data?.message || "Failed to accept order. Ping expired or order already accepted.");
    } finally {
      setPingJob(null);
    }
  };

  const handleRejectPing = async (jobId: string) => {
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${jobId}/reject`);
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
          setShowPermissionsPrompt(true);
        },
        { enableHighAccuracy: true }
      );
    }
    let reconnectTimeout: NodeJS.Timeout;
    let attempt = 0;

    const connectWs = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const token = getToken();
      // Connect to the tracking endpoint where our dev profile ping logic lives
      ws = new WebSocket(`${protocol}//${window.location.host}/api/delivery/tracking?token=${token}`);
      
      ws.onopen = () => {
        attempt = 0; // reset attempts on success
        setWsConnected(true);
        
        const sendLocation = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ driverId: riderId, lat: currentLat, lng: currentLng, timestamp: new Date().toISOString() }));
          }
        };

        // Send location immediately upon connection
        sendLocation();

        // Then send periodically
        interval = setInterval(sendLocation, 5000);
      };
      
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "NEW_ORDER_DISPATCH" && data.orderId) {
            // Fetch the actual ping details since we only got the orderId
            const pingRes = await apiGet(`/api/v1/delivery/orders/available`);
            const pingData = pingRes?.data?.data || pingRes?.data || pingRes;
            if (pingData && pingData.length > 0) {
              const jobs = pingData.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
              
              setRejectedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(jobs[0].id);
                return newSet;
              });

              setInternalOrders(prev => {
                const mergedMap = new Map();
                prev.forEach(j => mergedMap.set(j.id, j));
                jobs.forEach(j => mergedMap.set(j.id, j));
                return Array.from(mergedMap.values());
              });

              setPingJob(jobs[0]);
              
              if (jobs[0].remainingPingSeconds !== undefined) {
                setPingTimer(jobs[0].remainingPingSeconds);
              } else if (jobs[0].expiresAt) {
                const remainingSecs = Math.max(0, Math.floor((jobs[0].expiresAt - Date.now()) / 1000));
                setPingTimer(remainingSecs);
              } else {
                setPingTimer(60);
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };
      
      ws.onclose = () => {
        setWsConnected(false);
        if (interval) clearInterval(interval);
        
        // Exponential backoff: max 30 seconds
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        attempt++;
        
        reconnectTimeout = setTimeout(() => {
          connectWs();
        }, delay);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close(); // Triggers onclose to handle reconnection
      };
    };
    
    connectWs();

    return () => {
      if (interval) clearInterval(interval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnection attempt after unmount
        ws.close();
      }
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
          
          if (!profile.vehicleNumber || !profile.fullName) {
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

    // Fetch verification status
    apiGet('/api/delivery/verification/status')
      .then(res => {
        if (res?.data) setVerificationStatus(res.data);
      })
      .catch(err => console.warn("Failed to fetch verification status", err))
      .finally(() => setIsVerificationLoaded(true));
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




  // Find rider's active assigned job
  const riderJobs = activeOrders.filter(o => o.riderId === riderPhone || !!o.riderId || o.id === activeJobId);
  const activePickupOrDispatched = riderJobs.filter(o => o.deliveryStatus !== DeliveryStatus.DELIVERED);
  


  // Get active order being delivered by this rider
  const currentJob = activeOrders.find(o => o.id === activeJobId && o.deliveryStatus !== DeliveryStatus.DELIVERED);

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
    if (!currentJob?.id || !riderId) return;

    const ctrl = new AbortController();
    let retryCount = 0;

    const connectSSE = async () => {
      const token = getToken();
      const url = `${(import.meta as any).env?.VITE_API_BASE_URL || ''}/api/delivery/drivers/${riderId}/orders/${currentJob.id}/restaurant-status-stream`;
      
      try {
        await fetchEventSource(url, {
          method: 'GET',
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream'
          } : { 'Accept': 'text/event-stream' },
          signal: ctrl.signal,
          async onopen(res) {
            if (res.ok && res.status === 200) {
              retryCount = 0;
            } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
              console.error(`SSE unauthorized or invalid status: ${res.status}`);
              throw new Error(`Fatal SSE error: ${res.status}`);
            }
          },
          onmessage(event) {
            retryCount = 0;
            if (event.event === 'status-update' || !event.event) {
              const newStatus = event.data as OrderStatus;
              // SSE: Restaurant status updated
              
              // Update the internal state optimistically
              onUpdateOrderStatus(currentJob.id, newStatus, currentJob.deliveryStatus);
              
              if (newStatus === OrderStatus.READY_FOR_PICKUP) {
                showToast(`Order ${currentJob.id.substring(0, 8)} is now ready for pickup!`);
              }
            }
          },
          onerror(err) {
            console.error("SSE connection error", err);
            retryCount++;
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 16000);
            return backoffDelay;
          }
        });
      } catch (err) {
        if (!ctrl.signal.aborted) {
          console.error("SSE stream aborted or failed", err);
        }
      }
    };

    connectSSE();

    return () => {
      ctrl.abort();
    };
  }, [currentJob?.id, riderId]);

  React.useEffect(() => {
    if (currentJob?.status) {
      setIsUpdatingPickup(false);
      setIsUpdatingDelivery(false);
      
      // Start timer if Out For Delivery
      if (currentJob.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY && !isWaitTimerActive) {
        setIsWaitTimerActive(true);
        setWaitTimerSeconds(0);
      }
    }
  }, [currentJob?.status]);

  React.useEffect(() => {
    let interval: any;
    if (isWaitTimerActive && currentJob?.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY) {
      interval = setInterval(() => {
        setWaitTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setIsWaitTimerActive(false);
      setWaitTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isWaitTimerActive, currentJob?.status]);

  // Filter jobs available on the job board (orders that are dispatched but have no rider assigned yet)
  const availableJobs = activeOrders.filter(o => (o.status === OrderStatus.READY_FOR_PICKUP || o.status === OrderStatus.PREPARING || o.status === OrderStatus.ACCEPTED) && !o.riderId);

  const handleAcceptJob = async (order: Order) => {
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${order.id}/accept`, {});
      setActiveJobId(order.id);
      // Wait for next fetchOrders cycle or update optimisticly
      onUpdateOrderStatus(order.id, order.status, DeliveryStatus.ASSIGNED, { name: riderName });
    } catch (e: any) {
      console.error("Failed to accept job", e);
      showError(e.response?.data?.message || "Failed to accept job. It might have been assigned to someone else or cancelled.");
    }
  };

  const handleArrivedAtRestaurant = async () => {
    if (!currentJob) return;
    const previousStatus = currentJob.status;
    onUpdateOrderStatus(currentJob.id, currentJob.status, DeliveryStatus.AT_RESTAURANT);
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/status`, { status: DeliveryStatus.AT_RESTAURANT });
    } catch(e: any) {
      onUpdateOrderStatus(currentJob.id, previousStatus, currentJob.deliveryStatus);
      showToast(e.response?.data?.message || "Failed to update status.");
    }
  };

  const handleAbortJob = async () => {
    if (!currentJob) return;
    if (!confirm("Are you sure you want to abort this delivery? This will impact your rating.")) return;
    
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/abort`, {});
      setActiveJobId(null);
      showToast("Delivery aborted. You will be placed back in the pool.");
    } catch (e: any) {
      showToast(e.response?.data?.message || "Failed to abort delivery.");
    }
  };

  const handleCustomerUnavailable = async () => {
    if (!currentJob) return;
    if (!confirm("Are you sure the customer is unavailable? You should try calling them first.")) return;

    const previousStatus = currentJob.status;
    onUpdateOrderStatus(currentJob.id, currentJob.status, DeliveryStatus.FAILED);
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/status`, { status: DeliveryStatus.FAILED, goOfflineAfter });
      setActiveJobId(null);
      
      if (goOfflineAfter) {
        setIsOnline(false);
      }
      showToast("Delivery marked as failed. Please return items if applicable.");
    } catch (e: any) {
      onUpdateOrderStatus(currentJob.id, previousStatus, currentJob.deliveryStatus);
      showToast(e.response?.data?.message || "Failed to mark as unavailable.");
    }
  };

  const handlePickUpFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setPickupOtpError("");
    const validation = otpSchema.safeParse(enteredPickupOtp);
    if (!validation.success) {
      setPickupOtpError(validation.error.issues[0].message);
      return;
    }
    
    // Optimistic Update
    const previousStatus = currentJob.status;
    onUpdateOrderStatus(currentJob.id, OrderStatus.HANDED_OVER, DeliveryStatus.OUT_FOR_DELIVERY);
    setIsUpdatingPickup(true);
    
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/status`, { status: DeliveryStatus.OUT_FOR_DELIVERY, pickupOtp: enteredPickupOtp });
      setIsUpdatingPickup(false);
      setEnteredPickupOtp("");
    } catch(e: any) {
      setIsUpdatingPickup(false);
      onUpdateOrderStatus(currentJob.id, previousStatus, currentJob.deliveryStatus); // Revert on failure
      setPickupOtpError(e.response?.data?.message || "Failed to verify OTP with server.");
    }
  };


  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    const validation = otpSchema.safeParse(enteredOtp);
    if (!validation.success) {
      setOtpError(validation.error.issues[0].message);
      return;
    }

    // Optimistic Update
    const previousStatus = currentJob.status;
    onUpdateOrderStatus(currentJob.id, OrderStatus.HANDED_OVER, DeliveryStatus.DELIVERED);
    setIsUpdatingDelivery(true);
    
    try {
      await apiPost(`/api/delivery/drivers/${riderId}/orders/${currentJob.id}/status`, { status: DeliveryStatus.DELIVERED, deliveryOtp: enteredOtp, goOfflineAfter });
      setIsUpdatingDelivery(false);
      
      // Update history so it's immediately visible
      historyRef.current = [{...currentJob, deliveryStatus: DeliveryStatus.DELIVERED}, ...historyRef.current];


      setActiveJobId(null);
      if (goOfflineAfter) {
        setIsOnline(false);
      }
    } catch(e: any) {
      setIsUpdatingDelivery(false);
      onUpdateOrderStatus(currentJob.id, previousStatus, currentJob.deliveryStatus); // Revert on failure
      setOtpError(e.response?.data?.message || "Failed to verify Delivery OTP with server.");
    }
  };

  const allHistoryJobsMap = new Map();
  [...historyRef.current, ...activeOrders.filter(o => o.riderId === riderId && [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED].includes(o.deliveryStatus as DeliveryStatus))]
    .forEach(job => allHistoryJobsMap.set(job.id, { ...job, payout: job.payout || 7.50 }));
  const allHistoryJobs = Array.from(allHistoryJobsMap.values());
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayHistoryJobs = allHistoryJobs.filter(job => job.createdAt?.startsWith(todayDateStr));
  const todayEarnings = todayHistoryJobs.reduce((acc, job) => acc + (job.payout || 7.50), 0);
  const todayCompletedCount = todayHistoryJobs.length;
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

  if (!isVerificationLoaded) {
    return (
      <div className="flex-1 flex flex-col w-full h-[100dvh] items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest">Verifying Account</p>
      </div>
    );
  }

  if (!verificationStatus || !verificationStatus.allDocsApproved || !verificationStatus.bankApproved) {
    return (
      <RiderOnboardingWizard 
        riderPhone={riderPhone} 
        theme={theme} 
        onComplete={() => setVerificationStatus({ ...verificationStatus, allDocsApproved: true, bankApproved: true })} 
        userId={user?.id || ''} 
        initialName={riderName}
        onLogout={onLogout}
      />
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
              <ImageLoader src={photoUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-rose-500/20" containerClassName="w-8 h-8 rounded-full" loading="lazy" />
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

      {/* Connection Banner */}
      <AnimatePresence>
        {isOnline && !wsConnected && view === 'home' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-2 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Connection lost. Reconnecting to dispatch...</p>
          </motion.div>
        )}
      </AnimatePresence>

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
                    
                    const wasMandatory = isProfileMandatory;
                    setIsProfileMandatory(false);
                    setView('home');
                    
                    if (wasMandatory) {
                      // Profile just completed, seamlessly start the online process
                      handleToggleOnline();
                    }
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
            <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">${todayEarnings.toFixed(2)}</span>
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
            <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">{todayCompletedCount} orders</span>
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

            <ActiveDeliveryCard
              currentJob={currentJob}
              enteredPickupOtp={enteredPickupOtp}
              setEnteredPickupOtp={setEnteredPickupOtp}
              pickupOtpError={pickupOtpError}
              isUpdatingPickup={isUpdatingPickup}
              handleArrivedAtRestaurant={handleArrivedAtRestaurant}
              handlePickUpFood={handlePickUpFood}
            />

            {/* State Transition Actions */}
            {(!currentJob.deliveryStatus || currentJob.deliveryStatus === DeliveryStatus.ASSIGNED || currentJob.deliveryStatus === DeliveryStatus.AT_RESTAURANT) ? (
              <div className="space-y-4 pt-2">
                <div className="pt-2 text-center">
                    <button 
                      type="button"
                      onClick={handleAbortJob}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Abort Delivery (Emergency)
                    </button>
                  </div>
                </div>
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

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="goOfflineAfter" 
                      checked={goOfflineAfter}
                      onChange={(e) => setGoOfflineAfter(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="goOfflineAfter" className="text-xs font-medium text-slate-400 dark:text-slate-300">
                      Go offline after delivery
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingDelivery}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/15 disabled:opacity-70"
                  >
                    {isUpdatingDelivery ? "Confirming..." : <><CheckCircle className="w-5 h-5" /> Confirm Delivery & Credit $7.50</>}
                  </button>

                  {waitTimerSeconds > 5 && (
                    <div className="pt-3 text-center border-t border-slate-200 dark:border-slate-800 mt-4">
                      <button 
                        type="button"
                        onClick={handleCustomerUnavailable}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        Customer Unavailable (Mark Failed)
                      </button>
                    </div>
                  )}
                </form>
              )}
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
                <MapIcon className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-300 animate-pulse" />
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
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100" strokeDashoffset={100 - (pingTimer / 60) * 100} className="text-emerald-500 transition-all duration-1000 ease-linear" />
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
                  Please complete your driver profile (Name, Vehicle) before you can go on duty and start receiving orders.
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

      {/* Chat Widget when tracking an active delivery job */}
      {currentJob && (
        <ChatWidget 
          orderId={currentJob.id} 
          currentUserType="DELIVERY" 
        />
      )}
    </div>
  );
}
