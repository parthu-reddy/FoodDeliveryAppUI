import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

// The press motion reads the OS preference, so the tests have to be able to set it.
const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', () => ({ useReducedMotion: () => reducedMotion.value }));

describe('Button', () => {
  it('renders a real button element', () => {
    render(<Button>Place order</Button>);
    expect(screen.getByRole('button', { name: 'Place order' }).tagName).toBe('BUTTON');
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('meets the 44px touch-target floor at md and lg', () => {
    const { rerender } = render(<Button size="md">Tap</Button>);
    expect(screen.getByRole('button').style.minHeight).toBe('44px');
    rerender(<Button size="lg">Tap</Button>);
    expect(screen.getByRole('button').style.minHeight).toBe('50px');
  });

  it('gives success and warning visibly different fills', () => {
    const { rerender } = render(<Button variant="success">Done</Button>);
    const success = screen.getByRole('button').style.background;
    rerender(<Button variant="warning">Careful</Button>);
    const warning = screen.getByRole('button').style.background;
    expect(success).not.toBe(warning);
    expect(success).toContain('--color-success');
    expect(warning).toContain('--color-warning');
  });

  it('shows a spinner and blocks clicks while loading', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Pay</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Pay</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires when enabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Pay</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('travels on press and springs back on release', () => {
    // Phase 5: a surface that does not move when pressed is a picture of a button. This
    // one declared `transitionProperty: transform` and then never changed the transform.
    render(<Button>Pay</Button>);
    const button = screen.getByRole('button', { name: 'Pay' });
    expect(button).not.toHaveAttribute('data-pressed');

    fireEvent.pointerDown(button);
    expect(button).toHaveAttribute('data-pressed', 'true');
    expect(button.style.transform).toBe('scale(.97) translateY(1px)');

    fireEvent.pointerUp(button);
    expect(button).not.toHaveAttribute('data-pressed');
    expect(button.style.transform).toBe('');
    // Release springs; the press itself eases out. Leaving a press should feel like release,
    // not like another press in reverse.
    expect(button.style.transitionTimingFunction).toBe('var(--ease-spring)');
  });

  it('does not travel when the pointer leaves mid-press', () => {
    render(<Button>Pay</Button>);
    const button = screen.getByRole('button', { name: 'Pay' });
    fireEvent.pointerDown(button);
    fireEvent.pointerLeave(button);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('does not travel when the button is inert', () => {
    render(<Button disabled>Pay</Button>);
    const button = screen.getByRole('button', { name: 'Pay' });
    fireEvent.pointerDown(button);
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('does not travel at all under reduced motion', () => {
    // Reduced motion means no motion, not a shorter one: there is no slower version of a
    // 90ms press.
    reducedMotion.value = true;
    render(<Button>Pay</Button>);
    const button = screen.getByRole('button', { name: 'Pay' });
    fireEvent.pointerDown(button);
    expect(button).not.toHaveAttribute('data-pressed');
    expect(button.style.transform).toBe('');
    reducedMotion.value = false;
  });
});
