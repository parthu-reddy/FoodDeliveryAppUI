import { usePolling } from "@/hooks/usePolling";
import { getToken } from "@/lib/tokenStore";
import { deliveryApi } from "@/lib/zodiosClients";
import { DeliveryStatus, Order, OrderStatus } from "@/types";
import { isActiveOrder } from '@features/customer-orders/model/orderStatus';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useEffect, useRef, useState } from 'react';

export interface UseDeliveryOrdersProps {
  riderId: string;
  riderName: string;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  showToast: (msg: string) => void;
  externalOrders?: Order[];
  externalUpdateStatus?: (orderId: string, status: OrderStatus, deliveryStatus?: DeliveryStatus, riderInfo?: any) => void;
  setShowPermissionsPrompt: (show: boolean) => void;
  onAddApiLog?: (log: any) => void;
}

export function useDeliveryOrders({
  riderId,
  riderName,
  isOnline,
  setIsOnline,
  showToast,
  externalOrders,
  externalUpdateStatus,
  setShowPermissionsPrompt,
  onAddApiLog
}: UseDeliveryOrdersProps) {
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const activeOrders = externalOrders ?? internalOrders;

  const onUpdateOrderStatus = externalUpdateStatus ?? ((orderId: string, status: OrderStatus, deliveryStatus?: DeliveryStatus, riderInfo?: any) => {
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...(deliveryStatus ? { deliveryStatus } : {}) } : o));
  });

  const [wsConnected, setWsConnected] = useState(false);
  const todayDateString = new Date().toISOString().split('T')[0];
  const [historyDateFilter, setHistoryDateFilter] = useState(todayDateString);
  const [historyPage, setHistoryPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Use a ref to ensure the websocket interval always captures the latest active order ID
  const activeJobIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    activeJobIdRef.current = activeJobId;
  }, [activeJobId]);

  const [pingJob, setPingJob] = useState<Order | null>(null);
  const [pingTimer, setPingTimer] = useState(30);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const historyRef = useRef<any[]>([]);
  const lastActiveCountRef = useRef(0);

  // Polling Orders
  usePolling({
    fetchFn: async () => {
    if (!isOnline || !riderId) return;

    let fetchedActiveJobs: any[] = [];
    let fetchedAvailableJobs: any[] = [];
    const getArrayFromRes = (res: any) => res?.content || res?.data?.data || res?.data || (Array.isArray(res) ? res : []);

    try {
      const activeRes = await deliveryApi.deliveryOrder.get(`/api/v1/delivery/orders/active`, {});
      if (activeRes) {
         const activeData = getArrayFromRes(activeRes);
         fetchedActiveJobs = activeData.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
      }

      if (fetchedActiveJobs.length === 0) {
         const availableRes = await deliveryApi.deliveryOrder.get(`/api/v1/delivery/orders/available`, {});
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

      const hasStaleActiveJobInHistory = historyRef.current.some(j => 
          j.deliveryStatus !== DeliveryStatus.DELIVERED && 
          j.deliveryStatus !== DeliveryStatus.FAILED && 
          j.status !== OrderStatus.CANCELLED && 
          j.status !== OrderStatus.CANCELLED_BY_RESTAURANT && 
          !fetchedActiveJobs.find(a => a.id === j.id)
      );

      if ((lastActiveCountRef.current > 0 && fetchedActiveJobs.length === 0) || hasStaleActiveJobInHistory) {
         const histRes = await deliveryApi.deliveryOrder.get('/api/v1/delivery/orders/history', { queries: { date: todayDateString } });
         if (histRes) {
            const histData = getArrayFromRes(histRes);
            historyRef.current = histData.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
         }
      }
      
      lastActiveCountRef.current = fetchedActiveJobs.length;
      
      setInternalOrders(prev => {
        const mergedMap = new Map();
        historyRef.current.forEach(j => mergedMap.set(j.id, j));
        fetchedActiveJobs.forEach(j => mergedMap.set(j.id, j));
        fetchedAvailableJobs.forEach(j => mergedMap.set(j.id, j));
        return Array.from(mergedMap.values());
      });
    } catch (err) {
      console.error(err);
    }
  }, 
  intervalMs: 5000, 
  enabled: isOnline 
});

  // History Fetch
  useEffect(() => {
    if (!isOnline || !riderId) return;
    
    const dateToFetch = showHistory ? historyDateFilter : todayDateString;
    if (!dateToFetch) return;

    deliveryApi.deliveryOrder.get('/api/v1/delivery/orders/history', { queries: { date: dateToFetch } }).then(res => {
      if (res) {
        const getArrayFromRes = (res: any) => res?.content || res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
        const histData = getArrayFromRes(res);
        historyRef.current = histData.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
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

  // Ping Job / Dispatch Logic
  useEffect(() => {
    if (isOnline && !activeJobId && !pingJob) {
      const jobs = activeOrders.filter(o => !o.riderId && !rejectedIds.has(o.id));
      if (jobs.length > 0) {
        setPingJob(jobs[0]);
        if ((jobs[0]).remainingPingSeconds !== undefined) {
          setPingTimer((jobs[0]).remainingPingSeconds);
        } else if ((jobs[0]).expiresAt) {
          const remainingSecs = Math.max(0, Math.floor(((jobs[0]).expiresAt - Date.now()) / 1000));
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

  useEffect(() => {
    if (!activeJobId) {
      const ongoingJob = activeOrders.find(o => (o.riderId === riderId || !!o.riderId) && o.deliveryStatus !== DeliveryStatus.DELIVERED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.CANCELLED_BY_RESTAURANT && o.deliveryStatus !== DeliveryStatus.FAILED);
      if (ongoingJob) {
        setActiveJobId(ongoingJob.id);
      }
    } else {
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

  useEffect(() => {
    if (pingJob) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (e) {}

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

  // WebSocket Location & Tracking
  useEffect(() => {
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
          if (riderId) {
            (deliveryApi.deliveryExecutive.post(`/api/delivery/status`, { driverId: riderId, available: false }, {}))
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
      ws = new WebSocket(`${protocol}//${window.location.host}/api/delivery/tracking?token=${token}`);
      
      ws.onopen = () => {
        attempt = 0;
        setWsConnected(true);
        
        const sendLocation = () => {
          if (ws.readyState === WebSocket.OPEN) {
            const payload: any = { driverId: riderId, lat: currentLat, lng: currentLng, timestamp: new Date().toISOString() };
            if (activeJobIdRef.current) {
                payload.orderId = activeJobIdRef.current;
            }
            ws.send(JSON.stringify(payload));
          }
        };
        sendLocation();
        interval = setInterval(sendLocation, 5000);
      };
      
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "NEW_ORDER_DISPATCH" && data.orderId) {
            const pingRes = await deliveryApi.deliveryOrder.get(`/api/v1/delivery/orders/available`, {});
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
                jobs.forEach((j: any) => mergedMap.set(j.id, j));
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
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        attempt++;
        reconnectTimeout = setTimeout(() => { connectWs(); }, delay);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };
    
    connectWs();

    return () => {
      if (interval) clearInterval(interval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isOnline, riderId]);

  // Current active job handling and SSE for status updates
  const currentJob = activeOrders.find(o => o.id === activeJobId && o.deliveryStatus !== DeliveryStatus.DELIVERED);

  useEffect(() => {
    if (currentJob && onAddApiLog) {
      onAddApiLog({ id: 'delivery_route', label: `GET /api/v1/logistics/route?sourceLat={riderLat}&sourceLng={riderLng}&destLat=${currentJob.deliveryLat}&destLng=${currentJob.deliveryLng}`, method: 'GET' });
    }
  }, [currentJob?.id, currentJob?.status]);

  useEffect(() => {
    if (!currentJob?.id || !riderId) return;
    const ctrl = new AbortController();
    let retryCount = 0;

    const connectSSE = async () => {
      const token = getToken();
      const url = `${import.meta.env?.VITE_API_BASE_URL || ''}/api/delivery/drivers/${riderId}/orders/${currentJob.id}/restaurant-status-stream`;
      
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
              throw new Error(`Fatal SSE error: ${res.status}`);
            }
          },
          onmessage(event) {
            retryCount = 0;
            if (event.event === 'status-update' || !event.event) {
              const newStatus = event.data as OrderStatus;
              onUpdateOrderStatus(currentJob.id, newStatus, currentJob.deliveryStatus);
              if (newStatus === OrderStatus.READY_FOR_PICKUP) {
                showToast(`Order ${currentJob.id.substring(0, 8)} is now ready for pickup!`);
              }
            }
          },
          onerror(err) {
            retryCount++;
            return Math.min(1000 * Math.pow(2, retryCount - 1), 16000);
          }
        });
      } catch (err) {}
    };

    connectSSE();
    return () => { ctrl.abort(); };
  }, [currentJob?.id, riderId]);

  // Derived Values
  const availableJobs = activeOrders.filter(o => (o.status === OrderStatus.READY_FOR_PICKUP || o.status === OrderStatus.PREPARING || o.status === OrderStatus.ACCEPTED) && !o.riderId);
  const allHistoryJobsMap = new Map();
  [...historyRef.current, ...activeOrders.filter(o => o.riderId === riderId && [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED].includes(o.deliveryStatus as DeliveryStatus))]
    .forEach(job => allHistoryJobsMap.set(job.id, { ...job, payout: job.payout || 0 }));
  const allHistoryJobs = Array.from(allHistoryJobsMap.values());
  const todayHistoryJobs = allHistoryJobs.filter(job => job.createdAt?.startsWith(todayDateString));
  const todayEarnings = todayHistoryJobs.reduce((acc, job) => acc + (job.payout || 0), 0);
  const todayCompletedCount = todayHistoryJobs.length;
  
  const filteredHistoryJobs = allHistoryJobs.filter(job => {
    if (!historyDateFilter) return true;
    if (!job.createdAt) return false;
    return job.createdAt.startsWith(historyDateFilter);
  });
  const historyPageSize = 100;
  const paginatedHistoryJobs = filteredHistoryJobs.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);
  const totalHistoryPages = Math.ceil(filteredHistoryJobs.length / historyPageSize);

  return {
    activeOrders,
    wsConnected,
    historyDateFilter,
    setHistoryDateFilter,
    historyPage,
    setHistoryPage,
    showHistory,
    setShowHistory,
    activeJobId,
    setActiveJobId,
    currentJob,
    pingJob,
    setPingJob,
    pingTimer,
    setPingTimer,
    rejectedIds,
    setRejectedIds,
    availableJobs,
    todayEarnings,
    todayCompletedCount,
    paginatedHistoryJobs,
    totalHistoryPages,
    historyRef,
    onUpdateOrderStatus
  };
}
