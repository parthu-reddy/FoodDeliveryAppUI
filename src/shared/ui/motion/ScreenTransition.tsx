import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { screenTransitionVariants } from './screenTransitionVariants';

/**
 * One screen leaving and the next arriving.
 *
 * The app has no router — screens are swapped by state inside a single view — so there is no
 * route transition to hook into and the swap happened between two frames, with no indication
 * that anything had changed beyond the content being different.
 *
 * **Outgoing fades, incoming rises**, and the exit is the faster of the two: leaving should
 * not cost the person time. `mode="wait"` so the two never overlap, which on a phone reads
 * as a stutter rather than a transition.
 */

interface ScreenTransitionProps {
  /** Changing this is what constitutes a screen change. */
  screenKey: string;
  children: React.ReactNode;
  className?: string;
}

export function ScreenTransition({ screenKey, children, className = '' }: ScreenTransitionProps) {
  const reduceMotion = useReducedMotion();
  const variants = screenTransitionVariants(Boolean(reduceMotion));

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={screenKey} data-screen={screenKey} className={className} {...variants}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
