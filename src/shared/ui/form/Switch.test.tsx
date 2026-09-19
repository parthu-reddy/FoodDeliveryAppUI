import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', () => ({ useReducedMotion: () => reducedMotion.value }));

describe('Switch', () => {
  it('is a switch, not a button with two icons', () => {
    // The availability toggle it replaces announced "button" and carried its state only in
    // which lucide glyph was rendered, so a screen-reader user could not tell on from off.
    render(<Switch checked label="Dish available" onChange={() => {}} />);
    const control = screen.getByRole('switch', { name: 'Dish available' });
    expect(control).toHaveAttribute('aria-checked', 'true');
  });

  it('reports the next state to the caller', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} label="Dish available" onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('travels the thumb and crossfades the track', () => {
    const { rerender } = render(<Switch checked={false} label="Dish available" onChange={() => {}} />);
    const thumb = () => document.querySelector('[data-thumb]') as HTMLElement;
    const track = () => document.querySelector('[data-track]') as HTMLElement;

    expect(thumb().style.transform).toBe('translateX(0px)');
    expect(track().style.background).toBe('var(--color-paper-line)');

    rerender(<Switch checked label="Dish available" onChange={() => {}} />);
    expect(thumb().style.transform).toBe('translateX(18px)');
    expect(track().style.background).toBe('var(--color-success)');
    // transform, never left/margin: the thumb must not lay out on every frame.
    expect(thumb().style.transitionProperty).toBe('transform');
  });

  it('arrives instantly under reduced motion, in the same place', () => {
    reducedMotion.value = true;
    render(<Switch checked label="Dish available" onChange={() => {}} />);
    const thumb = document.querySelector('[data-thumb]') as HTMLElement;
    expect(thumb.style.transitionDuration).toBe('0s');
    // Same end state — reduced motion changes the travel, never the layout.
    expect(thumb.style.transform).toBe('translateX(18px)');
    reducedMotion.value = false;
  });

  it('does not report a change while disabled', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} disabled label="Dish available" onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
