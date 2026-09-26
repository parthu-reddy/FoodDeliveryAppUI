import React, { useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Spinner } from './Spinner';
import { DURATION } from '../motion/motionPresets';

/**
 * Pull down to reload, with the indicator following the finger exactly.
 *
 * The plan's requirement is "spinner tracks the drag 1:1" — a refresh affordance that does
 * not follow the finger is a spinner that appeared on its own, and the person cannot tell
 * whether their gesture did anything until it finishes. So the indicator's travel IS the
 * drag distance, not an animation of it.
 *
 * Pointer events, not touch events: they cover mouse, pen and touch, and jsdom can drive
 * them, which is what makes this testable rather than a thing we hope works on a phone. The
 * pull only starts when the scroller is already at the top, so it never fights a scroll.
 */

const TRIGGER_AT = 64;
/** Past the trigger the pull gets heavy, so the control tells you it is at its limit. */
const RESISTANCE = 0.4;
const MAX_PULL = 96;

interface PullToRefreshProps {
  onRefresh: () => void | Promise<unknown>;
  /** Names the action for assistive technology. */
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/** This element if it scrolls, else the nearest ancestor that does, else this element. */
function scrollingBox(el: HTMLElement | null): HTMLElement | null {
  for (let node = el; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return el;
}

export function PullToRefresh({
  onRefresh, label = 'Pull down to refresh', children, className = '',
}: PullToRefreshProps) {
  const reduceMotion = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // State, not `startY.current`, because the render reads it to decide whether the snap back
  // is animated — and a ref read during render is not guaranteed to be the value React
  // rendered with.
  const [dragging, setDragging] = useState(false);

  // The element that actually scrolls. Inside a page that scrolls around it (Account
  // Settings) this box never scrolls itself, so checking only its own scrollTop armed a pull
  // with the list halfway down the page.
  const atTop = () => (scrollingBox(scroller.current)?.scrollTop ?? 0) <= 0;
  const armed = pull >= TRIGGER_AT;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (refreshing || !atTop()) return;
    startY.current = event.clientY;
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startY.current === null || refreshing) return;
    const travelled = event.clientY - startY.current;
    if (travelled <= 0) {
      setPull(0);
      return;
    }
    const eased = travelled > TRIGGER_AT
      ? TRIGGER_AT + (travelled - TRIGGER_AT) * RESISTANCE
      : travelled;
    setPull(Math.min(eased, MAX_PULL));
  };

  const release = async () => {
    if (startY.current === null) return;
    startY.current = null;
    setDragging(false);
    if (pull < TRIGGER_AT) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    setPull(TRIGGER_AT);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  return (
    <div
      ref={scroller}
      className={`relative overflow-y-auto ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      style={{ touchAction: pull > 0 ? 'none' : undefined }}
    >
      <div
        data-pull-indicator
        aria-hidden={pull === 0 && !refreshing}
        className="absolute left-0 right-0 top-0 flex items-center justify-center pointer-events-none"
        style={{
          height: TRIGGER_AT,
          // 1:1 with the finger while dragging; only the snap back is animated.
          transform: `translateY(${pull - TRIGGER_AT}px)`,
          opacity: pull === 0 && !refreshing ? 0 : 1,
          transitionProperty: dragging ? 'none' : 'transform, opacity',
          transitionDuration: reduceMotion ? '0s' : `${DURATION.fast}s`,
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        {/* One live region, not two: Spinner already is one, and a second `role="status"`
            beside it makes a screen reader announce the same gesture twice. */}
        <Spinner size="sm" label={refreshing ? 'Refreshing' : armed ? 'Release to refresh' : label} />
      </div>
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transitionProperty: dragging ? 'none' : 'transform',
          transitionDuration: reduceMotion ? '0s' : `${DURATION.fast}s`,
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
