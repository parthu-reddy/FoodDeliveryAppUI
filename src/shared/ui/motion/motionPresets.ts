import { useReducedMotion } from 'motion/react';

/**
 * The app's motion vocabulary, in one place.
 *
 * Twenty-eight screens were writing `initial={{ opacity: 0, y: 10 }}` inline, and not one of
 * them read `useReducedMotion()` — so a person who has asked their device for no motion got
 * all of it anyway. Taking the preset instead of the literal makes that impossible: every
 * preset here collapses to an instant state change when the preference is set.
 *
 * **Reduced motion means no motion, not slower motion**, and the layout is identical either
 * way. A preset never changes what is on screen, only whether it travels to get there.
 *
 * The numbers mirror the Phase 1 duration and easing tokens. They are repeated rather than
 * read from CSS because motion/react needs numbers, not `var(--duration-base)` — the CSS
 * block in `index.css` is the source, and DURATION below must be kept in step with it.
 */

/** Milliseconds, matching `--duration-*` in index.css. */
export const DURATION = {
  instant: 0.09,
  fast: 0.16,
  base: 0.24,
  slow: 0.38,
} as const;

/**
 * Matching `--ease-*` in index.css. Mutable tuples, not `as const`: motion/react's
 * `Transition.ease` takes `Easing[]`, and a readonly array is not assignable to it.
 */
export const EASE: Record<'out' | 'in' | 'spring', [number, number, number, number]> = {
  out: [0.2, 0.8, 0.25, 1],
  in: [0.5, 0, 0.75, 0],
  spring: [0.34, 1.56, 0.64, 1],
};

/** A 40ms cascade, capped at 8 items: a 40-item list must not take 1.6 seconds to appear. */
export const STAGGER_STEP = 0.04;
export const STAGGER_MAX_ITEMS = 8;

export interface MotionPreset {
  initial: Record<string, number> | false;
  animate: Record<string, number>;
  exit?: Record<string, number>;
  transition: { duration: number; ease?: [number, number, number, number]; delay?: number };
}

const instantly = (final: Record<string, number>): MotionPreset => ({
  // `initial: false` skips the mount animation outright rather than running it at 0s, which
  // is the difference between "no motion" and "a very fast motion".
  initial: false,
  animate: final,
  exit: final,
  transition: { duration: 0 },
});

export function useMotionPresets() {
  const reduce = useReducedMotion();

  const preset = (
    from: Record<string, number>,
    to: Record<string, number>,
    duration: number,
    ease: [number, number, number, number] = EASE.out,
  ): MotionPreset =>
    reduce ? instantly(to) : { initial: from, animate: to, exit: from, transition: { duration, ease } };

  return {
    reduce: Boolean(reduce),

    /** A panel or screen appearing in place. */
    fade: preset({ opacity: 0 }, { opacity: 1 }, DURATION.base),

    /** The house enter: content rises as it arrives. */
    rise: preset({ opacity: 0, y: 16 }, { opacity: 1, y: 0 }, DURATION.base),

    /** The same, shorter, for something already near its place. */
    riseSm: preset({ opacity: 0, y: 8 }, { opacity: 1, y: 0 }, DURATION.fast),

    /** A dialog or popover arriving over content. */
    scaleIn: preset({ opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1 }, DURATION.base),

    /** A drawer or a toast entering from the side. */
    slideInX: preset({ opacity: 0, x: 24 }, { opacity: 1, x: 0 }, DURATION.base),

    /** One item of a staggered list. Past the cap every item shares the last delay. */
    listItem: (index: number): MotionPreset => {
      const delay = Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_STEP;
      return reduce
        ? instantly({ opacity: 1, y: 0 })
        : {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 12 },
            transition: { duration: DURATION.fast, ease: EASE.out, delay },
          };
    },

    /** Press feedback for something that is not a Button. */
    press: reduce ? {} : { whileTap: { scale: 0.97 }, transition: { duration: DURATION.instant } },
  };
}

/**
 * The same preference, for code that runs outside React's render — a maplibre marker is
 * created imperatively and cannot call a hook.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
