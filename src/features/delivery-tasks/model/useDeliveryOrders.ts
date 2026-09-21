import { usePolling } from "@/hooks/usePolling";
import { showDeliveryAssignmentNotification } from "@/lib/notificationPermissions";
import { registerGeolocationWatch, clearGeolocationWatch } from "@/lib/permissionCleanup";
import { getToken } from "@/lib/tokenStore";
import { deliveryApi } from "@/lib/zodiosClients";
import { DeliveryStatus, Order, OrderStatus } from "@/types";
import { sumRupees } from '@shared/money';
import { isActiveOrder } from '@features/customer-orders/model/orderStatus';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useEffect, useRef, useState } from 'react';

export interface UseDeliveryOrdersProps {
  deliveryExecutiveId: string;
  deliveryExecutiveName: string;
  cityId: string;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  showToast: (msg: string) => void;
  externalOrders?: Order[];
  externalUpdateStatus?: (orderId: string, status: OrderStatus, deliveryStatus?: DeliveryStatus, riderInfo?: unknown) => void;
  setShowPermissionsPrompt: (show: boolean) => void;
  onAddApiLog?: (log: unknown) => void;
}

export function useDeliveryOrders({
  deliveryExecutiveId,
  cityId,
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

  const onUpdateOrderStatus = externalUpdateStatus ?? ((orderId: string, status: OrderStatus, deliveryStatus?: DeliveryStatus, _riderInfo?: unknown) => {
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...(deliveryStatus ? { deliveryStatus } : {}) } : o));
  });

  const [wsConnected, setWsConnected] = useState(false);
  // Whether geolocation has actually produced a position this shift. Dispatch reads the
  // rider's coordinates to decide who is near a kitchen, so "online" without one is not a
  // state the rider should be left to discover from an empty trip list.
  const [hasLocationFix, setHasLocationFix] = useState(false);
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
  const historyRef = useRef<Order[]>([]);
  const lastActiveCountRef = useRef(0);
  const notifiedAssignmentIdsRef = useRef<Set<string>>(new Set());

  // Polling Orders
  const { refetch: refetchPolling } = usePolling({
    fetchFn: async () => {
    if (!isOnline || !deliveryExecutiveId) return null;

    let fetchedActiveJobs: Order[] = [];
    let fetchedAvailableJobs: Order[] = [];
    const getArrayFromRes = (res: unknown) => Array.isArray(res) ? res : (res as {content?: unknown[]}).content || (res as {data?:{data?:unknown[]}}).data?.data || (res as {data?:unknown[]}).data || [];

    try {
      const activeRes = await deliveryApi.deliveryOrder.get(`/api/v1/delivery/orders/active`, {});
      if (activeRes) {
         const activeData = getArrayFromRes(activeRes);
         fetchedActiveJobs = activeData.map((o: unknown) => ({ ...(o as Order), status: ((o as Order).status as string)?.toUpperCase() as OrderStatus || '' as OrderStatus }));
      }

      if (fetchedActiveJobs.length === 0) {
         const availableRes = await deliveryApi.deliveryOrder.get(`/api/v1/delivery/orders/available`, {});
         if (availableRes) {
            const availableData = getArrayFromRes(availableRes);
            fetchedAvailableJobs = availableData.map((o: unknown) => ({ ...(o as Order), status: ((o as Order).status as string)?.toUpperCase() as OrderStatus || '' as OrderStatus }));
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
            historyRef.current = histData.map((o: unknown) => ({ ...(o as Order), status: ((o as Order).status as string)?.toUpperCase() as OrderStatus || '' as OrderStatus }));
         }
      }
      
      lastActiveCountRef.current = fetchedActiveJobs.length;
      return { fetchedActiveJobs, fetchedAvailableJobs };
    } catch (err: unknown) {
      console.error(err);
      return null;
    }
  }, 
  onData: (data) => {
    if (!data) return;
    const { fetchedActiveJobs, fetchedAvailableJobs } = data;
    setInternalOrders(() => {
      const mergedMap = new Map();
      historyRef.current.forEach(j => mergedMap.set(j.id, j));
      fetchedActiveJobs.forEach(j => mergedMap.set(j.id, j));
      fetchedAvailableJobs.forEach(j => mergedMap.set(j.id, j));
      return Array.from(mergedMap.values());
    });
    if (fetchedAvailableJobs.length > 0) {
      fetchedAvailableJobs.forEach(job => {
        if (!notifiedAssignmentIdsRef.current.has(job.id)) {
          notifiedAssignmentIdsRef.current.add(job.id);
          void showDeliveryAssignmentNotification(job.id).catch(error =>
            console.error("Failed to show delivery assignment notification", error)
          );
        }
      });
      setRejectedIds(prev => {
        let changed = false;
        const newSet = new Set(prev);
        fetchedAvailableJobs.forEach(job => {
          if (newSet.has(job.id)) {
            newSet.delete(job.id);
            changed = true;
          }
        });
        return changed ? newSet : prev;
      });
    }
  },
  intervalMs: 5000, 
  enabled: isOnline 
});

  useEffect(() => {
    const onNotificationClick = (event: MessageEvent) => {
      if (event.data?.type === "NEW_ORDER_DISPATCH") {
        refetchPolling();
      }
    };
    navigator.serviceWorker?.addEventListener("message", onNotificationClick);
    return () => navigator.serviceWorker?.removeEventListener("message", onNotificationClick);
  }, [refetchPolling]);

  // History Fetch
  useEffect(() => {
    if (!isOnline || !deliveryExecutiveId) return;
    
    const dateToFetch = showHistory ? historyDateFilter : todayDateString;
    if (!dateToFetch) return;

    deliveryApi.deliveryOrder.get('/api/v1/delivery/orders/history', { queries: { date: dateToFetch } }).then(res => {
      if (res) {
        const getArrayFromRes = (res: unknown) => Array.isArray(res) ? res : (res as {content?: unknown[]}).content || (res as {data?:{data?:unknown[]}}).data?.data || (res as {data?:unknown[]}).data || [];
        const histData = getArrayFromRes(res);
        historyRef.current = histData.map((o: unknown) => ({ ...(o as Order), status: ((o as Order).status as string)?.toUpperCase() as OrderStatus || '' as OrderStatus }));
        setInternalOrders(prev => {
          const active = prev.filter(o => isActiveOrder(o));
          const mergedMap = new Map();
          historyRef.current.forEach((j: Order) => mergedMap.set(j.id, j));
          active.forEach(j => mergedMap.set(j.id, j));
          return Array.from(mergedMap.values());
        });
      }
    }).catch(console.error);
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, historyDateFilter, isOnline, deliveryExecutiveId]);

  // Ping Job / Dispatch Logic
  useEffect(() => {
    if (isOnline && !activeJobId && !pingJob) {
      const jobs = activeOrders.filter(o => !o.deliveryExecutiveId && !rejectedIds.has(o.id));
      // The server is the authority on how long is left: /orders/available computes
      // remainingPingSeconds from the ping deadline and now withholds the job entirely once the
      // window has closed. A job that arrives with no expiry information is therefore not a live
      // ping, and inventing 60 seconds for it showed the rider a countdown for an order the
      // backend would refuse — which is what "accept does nothing" looked like.
      const withExpiry = jobs.filter(
        j => j.remainingPingSeconds !== undefined || j.expiresAt
      );
      if (withExpiry.length > 0) {
        const job = withExpiry[0];
        const remainingSecs = job.remainingPingSeconds !== undefined
          ? job.remainingPingSeconds
          : Math.max(0, Math.floor((new Date(job.expiresAt!).getTime() - Date.now()) / 1000));
        if (remainingSecs > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPingJob(job);
          setPingTimer(remainingSecs);
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
      const ongoingJob = activeOrders.find(o => (o.deliveryExecutiveId === deliveryExecutiveId || !!o.deliveryExecutiveId) && o.deliveryStatus !== DeliveryStatus.DELIVERED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.CANCELLED_BY_RESTAURANT && o.deliveryStatus !== DeliveryStatus.FAILED);
      if (ongoingJob) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrders, deliveryExecutiveId, activeJobId]);

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
          
          // Close AudioContext after chime finishes to prevent resource leak
          osc.onended = () => { ctx.close().catch(() => {}); };
        }
      } catch {
        // best effort: WebAudio is unavailable in some browsers/contexts
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

  // WebSocket Location & Tracking
  useEffect(() => {
    if (!isOnline || !deliveryExecutiveId) return;
    let ws: WebSocket;
    let interval: NodeJS.Timeout;
    let watchId: number;
    // NOT seeded with a fake position. These were 12.9716 / 77.5946 -- the centre of
    // Bangalore -- and `sendLocation` runs immediately on WS open and then every 5s, so a
    // rider whose geolocation had not resolved yet (desktop browser, prompt still open,
    // permission denied) broadcast that invented spot as their real one.
    //
    // Measured 2026-09-19: that default is ~7.8 km from Brand 1 Outlet 10 (12.9842, 77.6658),
    // so the rider read as "Online Duty" in the UI, pinged steadily, and the outlet still
    // answered "No delivery partner near that restaurant". Dispatch decides who is near a
    // kitchen from these numbers; a fabricated one is worse than none at all.
    let currentLat: number | null = null;
    let currentLng: number | null = null;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          currentLat = pos.coords.latitude;
          currentLng = pos.coords.longitude;
          setHasLocationFix(true);
        },
        (err) => {
          console.error("Location error:", err);
          if (deliveryExecutiveId) {
            (deliveryApi.deliveryExecutive.post(`/api/delivery/status`, { driverId: deliveryExecutiveId, available: false }, {}))
              .catch(e => console.error(e));
          }
          setHasLocationFix(false);
          setIsOnline(false);
          setShowPermissionsPrompt(true);
        },
        { enableHighAccuracy: true }
      );
      registerGeolocationWatch(watchId);
    }
    let reconnectTimeout: NodeJS.Timeout;
    let attempt = 0;

    const connectWs = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const token = getToken();
      ws = new WebSocket(`${protocol}//${window.location.host}/api/delivery/tracking?token=${token}`);
      
      ws.onopen = () => {
        // Wait 3 seconds of stability before resetting attempt to 0
        // This prevents the instant-reconnect infinite loop if the server drops it immediately
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            attempt = 0;
          }
        }, 3000);
        
        setWsConnected(true);
        
        const sendLocation = () => {
          // No real fix yet: send nothing. The server's StaleDriverSweeperDaemon marks a
          // driver OFFLINE after 60s without a ping, which is the correct outcome for a rider
          // whose position is unknown -- far better than being dispatched to a stranger's
          // order because the app guessed a location.
          if (currentLat === null || currentLng === null) return;
          if (ws.readyState === WebSocket.OPEN) {
            const payload: { driverId: string, lat: number, lng: number, timestamp: string, orderId?: string, cityId?: string } = { driverId: deliveryExecutiveId, lat: currentLat, lng: currentLng, timestamp: new Date().toISOString() };
            if (activeJobIdRef.current) {
                payload.orderId = activeJobIdRef.current;
            }
            if (cityId) {
                payload.cityId = cityId;
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
            setRejectedIds(prev => {
              if (prev.has(data.orderId)) {
                const newSet = new Set(prev);
                newSet.delete(data.orderId);
                return newSet;
              }
              return prev;
            });
            
            refetchPolling();
          }
        } catch (e: unknown) {
          console.error("Failed to parse websocket message", e);
        }
      };
      
      ws.onclose = (event) => {
        console.warn(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'None'}, WasClean: ${event.wasClean}`);
        setWsConnected(false);
        if (interval) clearInterval(interval);
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        attempt++;
        reconnectTimeout = setTimeout(() => { connectWs(); }, delay);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        // Only close if it's currently open to avoid redundant onclose triggers
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
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
        clearGeolocationWatch(watchId);
       
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, deliveryExecutiveId, cityId, refetchPolling]);

  // Current active job handling and SSE for status updates
  const currentJob = activeOrders.find(o => o.id === activeJobId && o.deliveryStatus !== DeliveryStatus.DELIVERED);

  useEffect(() => {
     
    if (currentJob && onAddApiLog) {
      onAddApiLog({ id: 'delivery_route', label: `GET /api/v1/logistics/route?sourceLat={riderLat}&sourceLng={riderLng}&destLat=${currentJob.deliveryLat}&destLng=${currentJob.deliveryLng}`, method: 'GET' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJob?.id, currentJob?.status]);

  useEffect(() => {
    if (!currentJob?.id || !deliveryExecutiveId) return;
    const ctrl = new AbortController();
    let retryCount = 0;

    const connectSSE = async () => {
      const token = getToken();
      const url = `${import.meta.env?.VITE_API_BASE_URL || ''}/api/delivery/drivers/${deliveryExecutiveId}/orders/${currentJob.id}/restaurant-status-stream`;
      
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
          onerror() {
            retryCount++;
            return Math.min(1000 * Math.pow(2, retryCount - 1), 16000);
          }
        });
      } catch {
        // best effort cleanup on unmount; nothing to recover
      }
     
    };

    connectSSE();
    return () => { ctrl.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJob?.id, deliveryExecutiveId]);

  // Derived Values
  const availableJobs = activeOrders.filter(o => (o.status === OrderStatus.READY_FOR_PICKUP || o.status === OrderStatus.PREPARING || o.status === OrderStatus.ACCEPTED) && !o.deliveryExecutiveId);
  const allHistoryJobsMap = new Map();
  // eslint-disable-next-line react-hooks/refs
  [...historyRef.current, ...activeOrders.filter(o => o.deliveryExecutiveId === deliveryExecutiveId && [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED].includes(o.deliveryStatus as DeliveryStatus))]
    .forEach(job => allHistoryJobsMap.set(job.id, { ...job }));
  const allHistoryJobs = Array.from(allHistoryJobsMap.values());
  const todayHistoryJobs = allHistoryJobs.filter(job => job.createdAt?.startsWith(todayDateString));
  const todayEarnings = sumRupees(...todayHistoryJobs.map(job => {
    if (job.earnings?.netPayout == null) {
      throw new Error(`Missing earnings.netPayout for job ${job.id}`);
    }
    return job.earnings.netPayout;
  }));
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
    hasLocationFix,
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
