import { ChevronsRight } from 'lucide-react';
import React, { useRef, useState } from 'react';

/**
 * Slide to confirm. The rider's way of saying yes.
 *
 * A tap is the wrong gesture for picked-up and delivered: the phone is in a pocket, on a
 * mount, or being held in the rain with one hand, and a tap that fires by accident marks an
 * order delivered that is not. A swipe cannot be produced by a brush against fabric.
 *
 * It is a slider, not a button, and it says so: `role="slider"` with a live value, so it is
 * operable from a keyboard and announced honestly to a screen reader. Arrow keys move it and
 * End confirms — a rider using assistive technology is not asked to perform a drag.
 */

const CONFIRM_AT = 0.85;

interface SwipeActionProps {
  label: string;
  /** Shown once confirmed, while the caller's promise settles. */
  confirmingLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
}

export function SwipeAction({
  label,
  confirmingLabel = 'Confirming…',
  onConfirm,
  disabled = false,
  className = '',
}: SwipeActionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const settle = (next: number) => {
    if (next >= CONFIRM_AT) {
      setProgress(1);
      setConfirmed(true);
      onConfirm();
      return;
    }
    setProgress(0);
  };

  const positionFrom = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const { left, width } = track.getBoundingClientRect();
    if (width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - left) / width));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || confirmed) return;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || confirmed || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setProgress(positionFrom(event.clientX));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || confirmed) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    settle(positionFrom(event.clientX));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || confirmed) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setProgress((p) => Math.min(1, p + 0.25));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setProgress((p) => Math.max(0, p - 0.25));
    } else if (event.key === 'End' || event.key === 'Enter') {
      event.preventDefault();
      settle(1);
    }
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuetext={confirmed ? confirmingLabel : label}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setProgress(0)}
      onKeyDown={onKeyDown}
      className={`relative select-none overflow-hidden touch-none ${className}`}
      style={{
        // 56px: comfortably past the 48px floor the rider surfaces are held to, because this
        // is the control they use with one hand while holding something else.
        minHeight: 56,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-paper-sunken)',
        border: '1px solid var(--color-paper-line)',
        cursor: disabled ? 'not-allowed' : 'grab',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0"
        style={{
          // A full-width fill scaled from the left, never an animated width: the fill tracks
          // the thumb on every pointermove, and width would re-layout each of those frames.
          width: '100%',
          transform: `scaleX(${progress})`,
          transformOrigin: 'left',
          background: 'var(--color-success-solid)',
          transitionProperty: 'transform',
          transitionDuration: 'var(--duration-instant)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      />
      <span
        className="relative z-10 flex items-center justify-center h-full font-extrabold uppercase tracking-wider text-[13px]"
        style={{ minHeight: 56, color: 'var(--color-ink)' }}
      >
        {confirmed ? confirmingLabel : label}
        {!confirmed && <ChevronsRight className="w-4 h-4 ml-2" aria-hidden="true" />}
      </span>
    </div>
  );
}
