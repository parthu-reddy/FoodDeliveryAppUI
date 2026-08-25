import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePollingOptions<T> {
  /** The async function to call on each poll interval */
  fetchFn: () => Promise<T>;
  /** Polling interval in milliseconds */
  intervalMs: number;
  /** Whether polling is enabled. Set to false to pause (e.g. no active orders) */
  enabled: boolean;
  /** Optional callback when data is received */
  onData?: (data: T) => void;
  /** Optional callback when an error occurs */
  onError?: (error: Error) => void;
}

interface UsePollingResult<T> {
  data: T | null;
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
  onData,
  onError,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSubscribedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedFetchFn = useRef(fetchFn);
  const savedOnData = useRef(onData);
  const savedOnError = useRef(onError);

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedFetchFn.current = fetchFn;
    savedOnData.current = onData;
    savedOnError.current = onError;
  }, [fetchFn, onData, onError]);

  const executeFetch = useCallback(async () => {
    if (!isSubscribedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await savedFetchFn.current();
      if (!isSubscribedRef.current) return;
      setData(result);
      savedOnData.current?.(result);
    } catch (err: unknown) {
      if (!isSubscribedRef.current) return;
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      savedOnError.current?.(error);
    } finally {
      if (isSubscribedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Start/stop polling based on `enabled`
  useEffect(() => {
    isSubscribedRef.current = true;

    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Initial fetch
    executeFetch();

    // Schedule repeating polls
    const schedule = () => {
      timeoutRef.current = setTimeout(async () => {
        if (!isSubscribedRef.current) return;
        await executeFetch();
        if (isSubscribedRef.current) {
          schedule();
        }
      }, intervalMs);
    };
    schedule();

    return () => {
      isSubscribedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, intervalMs, executeFetch]);

  const refetch = useCallback(() => {
    executeFetch();
  }, [executeFetch]);

  return { data, isLoading, error, refetch };
}
