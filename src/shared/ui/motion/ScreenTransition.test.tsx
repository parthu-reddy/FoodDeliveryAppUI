import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScreenTransition } from './ScreenTransition';
import { screenTransitionVariants } from './screenTransitionVariants';

const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => reducedMotion.value,
}));

describe('ScreenTransition', () => {
  it('renders the screen it is given', () => {
    render(<ScreenTransition screenKey="home"><p>Home</p></ScreenTransition>);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(document.querySelector('[data-screen="home"]')).not.toBeNull();
  });

  it('swaps to the next screen when the key changes', async () => {
    // The app has no router: screens swap by state, so the key IS the route change.
    const { rerender } = render(<ScreenTransition screenKey="home"><p>Home</p></ScreenTransition>);
    rerender(<ScreenTransition screenKey="settings"><p>Settings</p></ScreenTransition>);
    expect(await screen.findByText('Settings')).toBeInTheDocument();
  });

  it('rises in and fades out, and leaves faster than it arrives', () => {
    // Asymmetric on purpose: an exit as slow as its entrance makes the whole app feel
    // slower. Asserted on the variants, because in jsdom the animation has already settled
    // by the time a test can read the element.
    const v = screenTransitionVariants(false);
    expect(v.initial).toEqual({ opacity: 0, y: 12 });
    expect(v.animate.transition!.duration).toBeGreaterThan(v.exit.transition!.duration);
    // No y on the way out: the outgoing screen fades where it stands.
    expect(v.exit).not.toHaveProperty('y');
  });

  it('mounts in its resting state when useReducedMotion is set', () => {
    reducedMotion.value = true;
    render(<ScreenTransition screenKey="home"><p>Home</p></ScreenTransition>);
    const screenEl = document.querySelector('[data-screen="home"]') as HTMLElement;
    expect(screenEl.style.opacity).toBe('1');
    expect(screenEl.style.transform).toBe('none');
    reducedMotion.value = false;
  });

  it('is placed outright under reduced motion, and ends in the same state either way', () => {
    const moving = screenTransitionVariants(false);
    const still = screenTransitionVariants(true);
    expect(still.initial).toBe(false);
    expect(still.transition!.duration).toBe(0);
    // Same resting position: the preference changes the travel, never the layout.
    expect(still.animate).toMatchObject({ opacity: 1, y: 0 });
    expect(moving.animate).toMatchObject({ opacity: 1, y: 0 });
  });
});
