/* eslint-disable react-hooks/set-state-in-effect */
// The pop is a transient visual state with a timer: it has to be set when the value changes
// and cleared afterwards, which is a setState in an effect by construction. The same
// directive the other transient-state components carry.
import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { DURATION, EASE } from '../motion/motionPresets';

/**
 * Plus, minus, and the number between them.
 *
 * The cart drawer had `-`, a `<span>`, and `+` as three bare elements: no accessible name on
 * either control, nothing announcing the quantity, and no feedback that a tap registered
 * other than the digit changing. On a slow connection that is indistinguishable from a tap
 * that did nothing, which is how people end up with four of something.
 *
 * The value pops on change (`--ease-spring`), which is the confirmation. It is a scale, so it
 * costs no layout, and it is skipped entirely under reduced motion.
 */

interface StepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** What is being counted, for the controls' accessible names. */
  label: string;
  min?: number;
  max?: number;
  className?: string;
}

export function Stepper({
  value, onIncrement, onDecrement, label, min = 0, max = Infinity, className = '',
}: StepperProps) {
  const reduceMotion = useReducedMotion();
  const [popping, setPopping] = useState(false);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (reduceMotion) return;
    setPopping(true);
    const timer = setTimeout(() => setPopping(false), DURATION.fast * 1000);
    return () => clearTimeout(timer);
  }, [value, reduceMotion]);

  const step = (
    direction: 'up' | 'down',
    onClick: () => void,
    disabled: boolean,
    glyph: string,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${direction === 'up' ? 'Add one' : 'Remove one'} ${label}`}
      className="p-1 px-2.5 text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      style={{ color: 'inherit' }}
    >
      {glyph}
    </button>
  );

  return (
    <div
      className={`flex items-center rounded-lg font-bold ${className}`}
      style={{ background: 'var(--color-paper-sunken)', color: 'var(--color-ink)' }}
    >
      {step('down', onDecrement, value <= min, '−')}
      <output
        data-value
        aria-live="polite"
        aria-label={`${label} quantity`}
        className="px-1 text-xs inline-block"
        style={{
          transform: popping ? 'scale(1.35)' : 'scale(1)',
          transitionProperty: 'transform',
          transitionDuration: reduceMotion ? '0s' : `${DURATION.fast}s`,
          transitionTimingFunction: `cubic-bezier(${EASE.spring.join(',')})`,
        }}
      >
        {value}
      </output>
      {step('up', onIncrement, value >= max, '+')}
    </div>
  );
}
