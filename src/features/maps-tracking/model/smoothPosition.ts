/**
 * Move a map marker between GPS fixes instead of teleporting it.
 *
 * The live-tracking stream delivers a fix every few seconds and the marker was calling
 * `setLngLat` with each one, so the rider jumped across the map in discrete hops. The plan
 * names this directly: "the rider marker interpolates between GPS fixes rather than jumping".
 *
 * The timing source is injected so this is testable without a browser clock, and so the
 * reduced-motion path is a real branch rather than a duration of zero.
 */

export type Position = [lng: number, lat: number];

export interface SmoothMoverOptions {
  /** How long one hop takes. Roughly the fix interval, so the marker is always moving. */
  durationMs?: number;
  /** No interpolation at all: the marker is placed where it is. */
  reduceMotion?: boolean;
  now?: () => number;
  raf?: (cb: (time: number) => void) => number;
  cancelRaf?: (handle: number) => void;
}

/** Decelerating: a rider arrives at a fix, they do not slam into it. */
export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - (1 - clamped) ** 3;
}

export function lerpPosition(from: Position, to: Position, t: number): Position {
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

export function createSmoothMover(
  apply: (position: Position) => void,
  options: SmoothMoverOptions = {},
) {
  const {
    durationMs = 1200,
    reduceMotion = false,
    now = () => performance.now(),
    raf = (cb) => requestAnimationFrame(cb),
    cancelRaf = (handle) => cancelAnimationFrame(handle),
  } = options;

  let current: Position | null = null;
  let handle: number | null = null;

  const stop = () => {
    if (handle !== null) {
      cancelRaf(handle);
      handle = null;
    }
  };

  return {
    /** The position the marker is at right now, mid-hop included. */
    get position() {
      return current;
    },
    moveTo(target: Position) {
      // First fix, or no motion wanted: be there.
      if (current === null || reduceMotion) {
        stop();
        current = target;
        apply(target);
        return;
      }
      stop();
      const from = current;
      const started = now();
      const step = () => {
        const elapsed = now() - started;
        const t = easeOutCubic(elapsed / durationMs);
        current = lerpPosition(from, target, t);
        apply(current);
        if (elapsed < durationMs) {
          handle = raf(step);
        } else {
          current = target;
          apply(target);
          handle = null;
        }
      };
      handle = raf(step);
    },
    cancel: stop,
  };
}
