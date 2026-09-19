import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMotionPresets, STAGGER_MAX_ITEMS, STAGGER_STEP } from './motionPresets';

const mocks = vi.hoisted(() => ({ reduce: false }));
vi.mock('motion/react', () => ({ useReducedMotion: () => mocks.reduce }));

describe('useMotionPresets', () => {
  it('moves by default', () => {
    mocks.reduce = false;
    const { result } = renderHook(() => useMotionPresets());
    expect(result.current.rise.initial).toEqual({ opacity: 0, y: 16 });
    expect(result.current.rise.transition.duration).toBeGreaterThan(0);
  });

  it('collapses to no motion, not to fast motion, when the preference is set', () => {
    // A 0.01s animation is still an animation: it mounts hidden and moves. `initial: false`
    // is what makes the element simply be there.
    mocks.reduce = true;
    const { result } = renderHook(() => useMotionPresets());
    for (const preset of [result.current.rise, result.current.fade, result.current.scaleIn]) {
      expect(preset.initial).toBe(false);
      expect(preset.transition.duration).toBe(0);
    }
    expect(result.current.press).toEqual({});
  });

  it('ends at the same place either way, so the layout never depends on the preference', () => {
    mocks.reduce = false;
    const moving = renderHook(() => useMotionPresets()).result.current;
    mocks.reduce = true;
    const still = renderHook(() => useMotionPresets()).result.current;
    expect(still.rise.animate).toEqual(moving.rise.animate);
    expect(still.fade.animate).toEqual(moving.fade.animate);
    expect(still.listItem(3).animate).toEqual(moving.listItem(3).animate);
  });

  it('caps the cascade so a long list does not take seconds to appear', () => {
    mocks.reduce = false;
    const { result } = renderHook(() => useMotionPresets());
    expect(result.current.listItem(2).transition.delay).toBeCloseTo(2 * STAGGER_STEP);
    const capped = result.current.listItem(40).transition.delay;
    expect(capped).toBeCloseTo(STAGGER_MAX_ITEMS * STAGGER_STEP);
    expect(capped).toBeLessThanOrEqual(0.32);
  });
});
