import React from 'react';
import { useReducedMotion } from 'motion/react';
import { DURATION } from '../motion/motionPresets';

/**
 * On or off, as a control that says so.
 *
 * The restaurant's availability toggle — the single most frequent action during service
 * (Phase4_RoleSurfaces/plan.md, "One-tap availability") — was a `<button>` swapping between
 * two lucide icons. A screen reader announced "button", not on or off; nothing moved; and the
 * state lived entirely in which glyph happened to be rendered.
 *
 * This is a real `role="switch"` with `aria-checked`, and the thumb travels while the track
 * crossfades. Both are transforms and colours, so neither costs a layout.
 */

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Names the control. Required — "toggle" tells a screen-reader user nothing. */
  label: string;
  /** Shown beside the track. Optional; the label is what assistive technology reads. */
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const THUMB = 20;
const TRAVEL = TRACK_WIDTH - THUMB - 6;

export function Switch({
  checked, onChange, label, children, disabled = false, className = '',
}: SwitchProps) {
  const reduceMotion = useReducedMotion();
  const move = reduceMotion ? '0s' : `${DURATION.fast}s`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {children}
      <span
        data-track
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--color-success)' : 'var(--color-paper-line)',
          border: '1px solid',
          borderColor: checked ? 'var(--color-success)' : 'var(--color-paper-line)',
          display: 'inline-flex',
          alignItems: 'center',
          padding: 2,
          transitionProperty: 'background-color, border-color',
          transitionDuration: move,
          transitionTimingFunction: 'var(--ease-out)',
          flexShrink: 0,
        }}
      >
        <span
          data-thumb
          style={{
            width: THUMB,
            height: THUMB,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-paper)',
            boxShadow: 'var(--elevation-1)',
            // translateX, not a margin or a left: the thumb travels on the compositor.
            transform: `translateX(${checked ? TRAVEL : 0}px)`,
            transitionProperty: 'transform',
            transitionDuration: move,
            transitionTimingFunction: 'var(--ease-out)',
          }}
        />
      </span>
    </button>
  );
}
