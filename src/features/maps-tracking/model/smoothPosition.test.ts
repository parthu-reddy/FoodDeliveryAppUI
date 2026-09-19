import { describe, expect, it } from 'vitest';
import { createSmoothMover, easeOutCubic, lerpPosition } from './smoothPosition';

/** A clock and a frame pump the test drives by hand, so no real time passes. */
function harness(reduceMotion = false) {
  let time = 0;
  const frames: Array<(t: number) => void> = [];
  const applied: Array<[number, number]> = [];
  const mover = createSmoothMover((p) => applied.push([p[0], p[1]]), {
    durationMs: 1000,
    reduceMotion,
    now: () => time,
    raf: (cb) => { frames.push(cb); return frames.length; },
    cancelRaf: () => {},
  });
  const advance = (ms: number) => {
    time += ms;
    const pending = frames.splice(0, frames.length);
    pending.forEach((cb) => cb(time));
  };
  return { mover, applied, advance };
}

describe('createSmoothMover', () => {
  it('places the first fix immediately — there is nothing to move from', () => {
    const { mover, applied } = harness();
    mover.moveTo([77.61, 12.96]);
    expect(applied).toEqual([[77.61, 12.96]]);
  });

  it('travels between fixes instead of jumping', () => {
    // The live stream delivers a fix every few seconds; before this the marker hopped.
    const { mover, applied, advance } = harness();
    mover.moveTo([0, 0]);
    mover.moveTo([10, 0]);

    advance(500);
    const midway = applied[applied.length - 1];
    expect(midway[0]).toBeGreaterThan(0);
    expect(midway[0]).toBeLessThan(10);

    advance(600);
    expect(applied[applied.length - 1]).toEqual([10, 0]);
  });

  it('decelerates rather than moving linearly', () => {
    // Half the time should already have covered more than half the distance.
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(2)).toBe(1);
  });

  it('jumps straight to the fix when useReducedMotion is set, with no frames at all', () => {
    const { mover, applied, advance } = harness(true);
    mover.moveTo([0, 0]);
    mover.moveTo([10, 0]);
    expect(applied).toEqual([[0, 0], [10, 0]]);
    advance(1000);
    expect(applied).toEqual([[0, 0], [10, 0]]);
  });

  it('a new fix mid-hop starts from where the marker actually is', () => {
    const { mover, applied, advance } = harness();
    mover.moveTo([0, 0]);
    mover.moveTo([10, 0]);
    advance(200);
    const interrupted = mover.position!;
    mover.moveTo([0, 10]);
    advance(1000);
    expect(applied[applied.length - 1]).toEqual([0, 10]);
    expect(interrupted[0]).toBeGreaterThan(0);
  });

  it('interpolates each axis independently', () => {
    expect(lerpPosition([0, 0], [10, 20], 0.5)).toEqual([5, 10]);
  });
});
