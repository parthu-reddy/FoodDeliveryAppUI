import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePollingOptions<T> {
  /** The async function to call on each poll interval */
  fetchFn: () => Promise<T>;
  /** Polling interval in milliseconds */
  intervalMs: number;
  /** Whether polling is enabled. Set to false to pause (e.g. no active orders) */
  enabled: boolean;
  /**
   * Changes to the request inputs that must trigger an immediate fetch instead
   * of waiting for the next polling interval.
   */
  refreshKey?: string | number | boolean | null;
  /** Optional callback when data is received */
  onData?: (data: T) => void;
  /** Optional callback when an error occurs */
  onError?: (error: Error) => void;
}

interface UsePollingResult<T> {
  data: T | null;
  /** The request key that produced `data`, so callers can reject stale data after an input change. */
  dataRefreshKey: string | number | boolean | null;
  isLoading: boolean;
  error: Error | null;
  /** Manually trigger a fetch outside the polling cycle */
  refetch: () => void;
}

/**
 * Generic polling hook that replaces the repeated useEffect + setTimeout pattern
 * found across all dashboards. Automatically stops when `enabled` is false.
 *
 * @example
 * const { data, isLoading, refetch } = usePolling({
 *   fetchFn: () => apiGet('/api/v1/orders/active').then(r => r.data),
 *   intervalMs: 60000,
 *   enabled: hasActiveOrders,
 * });
 */
export function usePolling<T>({
  fetchFn,
  intervalMs,
  enabled,
  refreshKey = null,
  onData,
  onError,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState<string | number | boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSubscribedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchIdRef = useRef(0);

  const savedFetchFn = useRef(fetchFn);
  const savedOnData = useRef(onData);
  const savedOnError = useRef(onError);
  const refreshKeyRef = useRef(refreshKey);

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedFetchFn.current = fetchFn;
    savedOnData.current = onData;
    savedOnError.current = onError;
    refreshKeyRef.current = refreshKey;
  }, [fetchFn, onData, onError, refreshKey]);

  const executeFetch = useCallback(async () => {
    if (!isSubscribedRef.current) return;
    const fetchId = ++fetchIdRef.current;
    const requestRefreshKey = refreshKeyRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await savedFetchFn.current();
      if (!isSubscribedRef.current || fetchId !== fetchIdRef.current) return;
      setData(result);
      setDataRefreshKey(requestRefreshKey);
      savedOnData.current?.(result);
    } catch (err: unknown) {
      if (!isSubscribedRef.current || fetchId !== fetchIdRef.current) return;
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      savedOnError.current?.(error);
    } finally {
      if (isSubscribedRef.current && fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Start/stop polling based on `enabled`
  useEffect(() => {
    isSubscribedRef.current = true;

    // Invalidate a request started for a previous page, filter, or selection
    // before issuing the replacement request below.
    fetchIdRef.current += 1;

    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Fetch now, then schedule each poll only after the previous request settles, so a slow
    // backend never sees overlapping requests from one hook. `cancelled` belongs to this run:
    // a request still in flight when the inputs change must not start a second polling chain.
    let cancelled = false;
    const poll = async () => {
      await executeFetch();
      if (!cancelled) {
        timeoutRef.current = setTimeout(() => { void poll(); }, intervalMs);
      }
    };
    void poll();

    return () => {
      cancelled = true;
      isSubscribedRef.current = false;
      fetchIdRef.current += 1;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, intervalMs, executeFetch, refreshKey]);

  const refetch = useCallback(() => {
    executeFetch();
  }, [executeFetch]);

  return { data, dataRefreshKey, isLoading, error, refetch };
}
