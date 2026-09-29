import { usePolling } from "@/hooks/usePolling";
import { showDeliveryAssignmentNotification } from "@/lib/notificationPermissions";
import { registerGeolocationWatch, clearGeolocationWatch } from "@/lib/permissionCleanup";
import { getToken } from "@/lib/tokenStore";
import { customerApi, deliveryApi } from "@/lib/zodiosClients";
import { DeliveryStatus, Order, OrderStatus } from "@/types";
import { sumRupees } from '@shared/money';
import { isActiveOrder } from '@features/customer-orders/model/orderStatus';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useCallback, useEffect, useRef, useState } from 'react';
import { requestGoOffline } from './dutyApi';
import { applyDutyStatus, parseDutyStatusMessage, reactToLocationError } from './dutyStatus';
import { applyConfirmedProgress, recordConfirmedProgress } from './confirmedProgress';
import { dayWindow, isOnDate, todayIn } from '@/shared/time';

import { isAvailableDispatch, remainingDispatchSeconds } from './dispatchOffers';

export type PayoutReconciliationStatus = 'refreshing' | 'unavailable';

interface PayoutReconciliation {
  order: Order;
  status: PayoutReconciliationStatus;
}

const PAYOUT_RECONCILIATION_DELAYS_MS = [0, 2_000, 5_000, 10_000] as const;

function ordersFromHistoryResponse(response: unknown): Order[] {
  const rows = Array.isArray(response)
    ? response
    : (response as { content?: unknown[] }).content
      || (response as { data?: { data?: unknown[] } }).data?.data
      || (response as { data?: unknown[] }).data
      || [];

  return rows.map((order: unknown) => ({
    ...(order as Order),
    status: ((order as Order).status as string)?.toUpperCase() as OrderStatus || '' as OrderStatus,
  }));
}

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
  showHistory: boolean;
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
  onAddApiLog,
  showHistory
}: UseDeliveryOrdersProps) {
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const activeOrders = externalOrders ?? internalOrders;

  // The step the rider just confirmed, per order, until a poll shows the server has caught up.
  const confirmedProgressRef = useRef(new Map<string, DeliveryStatus>());

  const onUpdateOrderStatus = externalUpdateStatus ?? ((orderId: string, status: OrderStatus, deliveryStatus?: DeliveryStatus, _riderInfo?: unknown) => {
    recordConfirmedProgress(confirmedProgressRef.current, orderId, deliveryStatus);
    setInternalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...(deliveryStatus ? { deliveryStatus } : {}) } : o));
  });

  const [wsConnected, setWsConnected] = useState(false);
  // Whether geolocation has actually produced a position this shift. Dispatch reads the
  // rider's coordinates to decide who is near a kitchen, so "online" without one is not a
  // state the rider should be left to discover from an empty trip list.
  const [hasLocationFix, setHasLocationFix] = useState(false);
  // The rider's own calendar date. It was the UTC date, so for an Indian rider "today" didn't begin until 05:30.
  const todayDateString = todayIn();
  const [historyDateFilter, setHistoryDateFilter] = useState(todayDateString);
  const [historyPage, setHistoryPage] = useState(1);
  
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
  const [payoutReconciliations, setPayoutReconciliations] = useState<Record<string, PayoutReconciliation>>({});
  const payoutReconciliationsRef = useRef<Record<string, PayoutReconciliation>>({});
  const payoutReconciliationRunsRef = useRef(new Map<string, number>());
  const payoutReconciliationSequenceRef = useRef(0);
  const payoutReconciliationTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const payoutReconciliationControllersRef = useRef(new Map<string, AbortController>());

  const updatePayoutReconciliations = useCallback(
    (updater: (previous: Record<string, PayoutReconciliation>) => Record<string, PayoutReconciliation>) => {
      setPayoutReconciliations(previous => {
        const next = updater(previous);
        payoutReconciliationsRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    updatePayoutReconciliations(() => ({}));
    return () => {
      payoutReconciliationRunsRef.current.clear();
      payoutReconciliationTimersRef.current.forEach(timer => clearTimeout(timer));
      payoutReconciliationTimersRef.current.clear();
      payoutReconciliationControllersRef.current.forEach(controller => controller.abort());
      payoutReconciliationControllersRef.current.clear();
      payoutReconciliationsRef.current = {};
    };
  }, [deliveryExecutiveId, updatePayoutReconciliations]);

  const requestPayoutReconciliation = useCallback((completedOrder: Order) => {
    if (!deliveryExecutiveId || !completedOrder.id || !completedOrder.createdAt
      || completedOrder.deliveryStatus !== DeliveryStatus.DELIVERED) {
      return;
    }

    const orderId = completedOrder.id;
    // A process can complete after a rider switch or a second attempt starts. Use one monotonic
    // sequence for the component lifetime so an old callback can never match a newer run ID.
    const nextRunId = ++payoutReconciliationSequenceRef.current;
    payoutReconciliationRunsRef.current.set(orderId, nextRunId);
    const priorTimer = payoutReconciliationTimersRef.current.get(orderId);
    if (priorTimer) clearTimeout(priorTimer);
    payoutReconciliationTimersRef.current.delete(orderId);
    payoutReconciliationControllersRef.current.get(orderId)?.abort();
    payoutReconciliationControllersRef.current.delete(orderId);

    updatePayoutReconciliations(previous => ({
      ...previous,
      [orderId]: { order: completedOrder, status: 'refreshing' },
    }));

    const scheduleAttempt = (attempt: number) => {
      const timer = setTimeout(async () => {
        payoutReconciliationTimersRef.current.delete(orderId);
        if (payoutReconciliationRunsRef.current.get(orderId) !== nextRunId) return;

        const controller = new AbortController();
        payoutReconciliationControllersRef.current.set(orderId, controller);
        try {
          // This exact owner-scoped payout read avoids relying on the paginated history query.
          // It is independent of duty state, so it still reconciles after the rider goes offline.
          const earnings = await customerApi.driverMoney.get('/api/v1/money/driver/:driverId/orders/:orderId', {
            params: { driverId: deliveryExecutiveId, orderId },
            signal: controller.signal,
          });
          if (payoutReconciliationRunsRef.current.get(orderId) !== nextRunId) return;

          if (earnings?.netPayout != null
            && earnings.customerContribution != null
            && earnings.restaurantContribution != null) {
            const refreshedOrder: Order = {
              ...completedOrder,
              earnings: {
                netPayout: earnings.netPayout,
                customerContribution: earnings.customerContribution,
                restaurantContribution: earnings.restaurantContribution,
              },
            };
            historyRef.current = [
              refreshedOrder,
              ...historyRef.current.filter(order => order.id !== orderId),
            ];
            setInternalOrders(previous => [
              refreshedOrder,
              ...previous.filter(order => order.id !== orderId),
            ]);
            payoutReconciliationRunsRef.current.delete(orderId);
            updatePayoutReconciliations(previous => {
              const { [orderId]: _completed, ...rest } = previous;
              return rest;
            });
            return;
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          const responseStatus = (error as { response?: { status?: number } }).response?.status;
          // A malformed request, expired session, or access denial will not resolve by polling.
          // Keep retrying server-side projection/network failures only, then show their true state.
          if (responseStatus != null && responseStatus >= 400 && responseStatus < 500 && responseStatus !== 429) {
            payoutReconciliationRunsRef.current.delete(orderId);
            updatePayoutReconciliations(previous => {
              const current = previous[orderId];
              if (!current) return previous;
              return { ...previous, [orderId]: { ...current, status: 'unavailable' } };
            });
            return;
          }
          console.warn('Completed delivery payout is not available yet.', error);
        } finally {
          if (payoutReconciliationControllersRef.current.get(orderId) === controller) {
            payoutReconciliationControllersRef.current.delete(orderId);
          }
        }

        if (payoutReconciliationRunsRef.current.get(orderId) !== nextRunId) return;
        if (attempt === PAYOUT_RECONCILIATION_DELAYS_MS.length - 1) {
          payoutReconciliationRunsRef.current.delete(orderId);
          updatePayoutReconciliations(previous => {
            const current = previous[orderId];
            if (!current) return previous;
            return { ...previous, [orderId]: { ...current, status: 'unavailable' } };
          });
          return;
        }
        scheduleAttempt(attempt + 1);
      }, PAYOUT_RECONCILIATION_DELAYS_MS[attempt]);
      payoutReconciliationTimersRef.current.set(orderId, timer);
    };

    scheduleAttempt(0);
  }, [deliveryExecutiveId, updatePayoutReconciliations]);

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
         const histRes = await deliveryApi.deliveryOrder.get('/api/v1/delivery/orders/history', { queries: dayWindow(todayDateString) });
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
    const { fetchedAvailableJobs } = data;
    const fetchedActiveJobs = applyConfirmedProgress(data.fetchedActiveJobs, confirmedProgressRef.current);
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
    // Completed deliveries are read-only records and must remain available while the rider is off
    // duty. Duty state gates dispatch/active-order polling, not access to the rider's own history.
    if (!deliveryExecutiveId) return;
    
    const dateToFetch = showHistory ? historyDateFilter : todayDateString;
    if (!dateToFetch) return;

    // The server gets the rider's day as instants, not a date to interpret in its own zone.
    const { from, to } = dayWindow(dateToFetch);
    const controller = new AbortController();
    deliveryApi.deliveryOrder.get('/api/v1/delivery/orders/history', {
      queries: { from, to },
      signal: controller.signal,
    }).then(res => {
      if (controller.signal.aborted || !res) return;
      const historyById = new Map(ordersFromHistoryResponse(res).map(order => {
        const existing = historyRef.current.find(current => current.id === order.id);
        // The exact payout endpoint can complete before this broader history request returns.
        // Never replace a confirmed local payout with a lagging history row that lacks it.
        const merged = existing?.earnings?.netPayout != null && order.earnings?.netPayout == null
          ? { ...order, earnings: existing.earnings }
          : order;
        return [merged.id, merged];
      }));
      // Preserve only confirmed-local deliveries whose payout reconciliation is still active.
      // A lagging history read must not make a delivery disappear from the rider's dashboard.
      Object.values(payoutReconciliationsRef.current).forEach(({ order }) => {
        if (isOnDate(order.createdAt, dateToFetch) && !historyById.has(order.id)) {
          historyById.set(order.id, order);
        }
      });
      const confirmedPayoutIds = Array.from(historyById.values())
        .filter(order => order.earnings?.netPayout != null)
        .map(order => order.id)
        .filter(orderId => payoutReconciliationsRef.current[orderId] != null);
      if (confirmedPayoutIds.length > 0) {
        confirmedPayoutIds.forEach(orderId => {
          payoutReconciliationRunsRef.current.delete(orderId);
          const timer = payoutReconciliationTimersRef.current.get(orderId);
          if (timer) clearTimeout(timer);
          payoutReconciliationTimersRef.current.delete(orderId);
          payoutReconciliationControllersRef.current.get(orderId)?.abort();
          payoutReconciliationControllersRef.current.delete(orderId);
        });
        updatePayoutReconciliations(previous => {
          const next = { ...previous };
          confirmedPayoutIds.forEach(orderId => delete next[orderId]);
          return next;
        });
      }
      historyRef.current = Array.from(historyById.values());
      setInternalOrders(prev => {
        const active = prev.filter(o => isActiveOrder(o));
        const mergedMap = new Map();
        historyRef.current.forEach((job: Order) => mergedMap.set(job.id, job));
        active.forEach(job => mergedMap.set(job.id, job));
        return Array.from(mergedMap.values());
      });
    }).catch(error => {
      if (!controller.signal.aborted) console.error(error);
    });

    return () => controller.abort();
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, historyDateFilter, deliveryExecutiveId]);

  // Ping Job / Dispatch Logic
  useEffect(() => {
    if (isOnline && !activeJobId && !pingJob) {
      const job = activeOrders.find(o => isAvailableDispatch(o, rejectedIds));
      if (job) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPingJob(job);
        setPingTimer(remainingDispatchSeconds(job));
      }
    }
    if (!isOnline || activeJobId) {
      setPingJob(null);
    } else if (pingJob) {
      const stillActive = activeOrders.find(o => o.id === pingJob.id && isAvailableDispatch(o, rejectedIds));
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
          void reactToLocationError(err, {
            goOffline: () => requestGoOffline(deliveryExecutiveId).then(() => { setIsOnline(false); return true; }, () => false),
            setHasLocationFix,
            setShowPermissionsPrompt,
            showToast,
          });
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
          // The server's word on duty status: pushed when it changes, and sent on every connect.
          const duty = parseDutyStatusMessage(data);
          if (duty) {
            applyDutyStatus(duty, { wasOnline: true, setIsOnline, showToast });
            return;
          }
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
  const availableJobs = activeOrders.filter(o => isAvailableDispatch(o, rejectedIds));
  const allHistoryJobsMap = new Map();
  // eslint-disable-next-line react-hooks/refs
  [...activeOrders.filter(o => o.deliveryExecutiveId === deliveryExecutiveId && [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED].includes(o.deliveryStatus as DeliveryStatus)), ...historyRef.current]
    .forEach(job => allHistoryJobsMap.set(job.id, { ...job }));
  const allHistoryJobs = Array.from(allHistoryJobsMap.values());
  const todayHistoryJobs = allHistoryJobs.filter(job => isOnDate(job.createdAt, todayDateString));
  const todayDeliveredJobs = todayHistoryJobs.filter(job => job.deliveryStatus === DeliveryStatus.DELIVERED);
  // Server-confirmed payout values are the only amounts included in the displayed total. A
  // newly delivered job is reconciled separately, so a transient missing value cannot take down
  // the whole dashboard or look like confirmed earnings.
  const todayPaidDeliveries = todayDeliveredJobs.filter(job => job.earnings?.netPayout != null);
  const payoutReconciliationByOrderId = Object.fromEntries(
    Object.entries(payoutReconciliations).map(([orderId, reconciliation]) => [orderId, reconciliation.status]),
  ) as Record<string, PayoutReconciliationStatus>;
  const todayPayoutUpdatingCount = todayDeliveredJobs.filter(
    job => payoutReconciliationByOrderId[job.id] === 'refreshing',
  ).length;
  const todayPayoutUnavailableCount = todayDeliveredJobs.filter(
    job => payoutReconciliationByOrderId[job.id] === 'unavailable',
  ).length;
  const todayEarnings = sumRupees(...todayPaidDeliveries.map(job => job.earnings!.netPayout));
  const todayCompletedCount = todayDeliveredJobs.length;
  
  const filteredHistoryJobs = allHistoryJobs.filter(job => {
    if (!historyDateFilter) return true;
    return isOnDate(job.createdAt, historyDateFilter);
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
    todayPayoutUpdatingCount,
    todayPayoutUnavailableCount,
    todayCompletedCount,
    paginatedHistoryJobs,
    totalHistoryPages,
    historyRef,
    payoutReconciliationByOrderId,
    requestPayoutReconciliation,
    onUpdateOrderStatus
  };
}
