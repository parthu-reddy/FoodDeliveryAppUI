import { DURATION, EASE } from './motionPresets';

/**
 * Exported as a pure function so the contract can be asserted directly. In jsdom the
 * animation settles before a test can read the DOM, so "does it rise" is not answerable from
 * the rendered element — but it is answerable from here.
 */
export function screenTransitionVariants(reduceMotion: boolean) {
  return reduceMotion
    ? {
        initial: false as const,
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
        // No y on the way out: the outgoing screen fades where it stands, and does it
        // faster than the incoming one arrives.
        exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
      };
}
