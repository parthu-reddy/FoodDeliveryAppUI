import { useState, useEffect } from 'react';

/**
 * Generic debounce hook. Returns the debounced value after the specified delay.
 * Resets the timer whenever `value` changes.
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * useEffect(() => { if (debouncedSearch) fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
