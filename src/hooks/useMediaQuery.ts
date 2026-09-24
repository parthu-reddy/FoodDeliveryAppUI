import { useSyncExternalStore } from 'react';

/**
 * Whether a CSS media query matches, kept live. For layout that has to change BEHAVIOUR at a
 * breakpoint, not just appearance -- e.g. the customer desktop shows the live order in a side
 * rail, so the main column must stop showing the same order a second time.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches),
    () => false,
  );
}
