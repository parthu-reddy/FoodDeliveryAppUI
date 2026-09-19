import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Stepper } from './Stepper';

const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', () => ({ useReducedMotion: () => reducedMotion.value }));

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('Stepper', () => {
  it('names both controls and the value', () => {
    // The cart drawer's version was `-`, a bare <span>, and `+`: a screen reader got two
    // unnamed buttons and never heard the quantity change at all.
    render(<Stepper value={2} label="Margherita" onIncrement={() => {}} onDecrement={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add one Margherita' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove one Margherita' })).toBeInTheDocument();
    expect(screen.getByLabelText('Margherita quantity')).toHaveTextContent('2');
  });

  it('announces the quantity as it changes', () => {
    render(<Stepper value={2} label="Margherita" onIncrement={() => {}} onDecrement={() => {}} />);
    expect(screen.getByLabelText('Margherita quantity')).toHaveAttribute('aria-live', 'polite');
  });

  it('pops the value on change, then settles', () => {
    // The pop is the confirmation that a tap registered. Without it, a slow update is
    // indistinguishable from a tap that did nothing — which is how people add four.
    const { rerender } = render(
      <Stepper value={1} label="Margherita" onIncrement={() => {}} onDecrement={() => {}} />,
    );
    const value = () => screen.getByLabelText('Margherita quantity');
    expect(value().style.transform).toBe('scale(1)');

    rerender(<Stepper value={2} label="Margherita" onIncrement={() => {}} onDecrement={() => {}} />);
    expect(value().style.transform).toBe('scale(1.35)');

    act(() => { vi.advanceTimersByTime(300); });
    expect(value().style.transform).toBe('scale(1)');
  });

  it('does not pop under reduced motion', () => {
    reducedMotion.value = true;
    const { rerender } = render(
      <Stepper value={1} label="Margherita" onIncrement={() => {}} onDecrement={() => {}} />,
    );
    rerender(<Stepper value={2} label="Margherita" onIncrement={() => {}} onDecrement={() => {}} />);
    const value = screen.getByLabelText('Margherita quantity');
    expect(value.style.transform).toBe('scale(1)');
    expect(value.style.transitionDuration).toBe('0s');
    reducedMotion.value = false;
  });

  it('stops at its bounds', () => {
    const onDecrement = vi.fn();
    render(
      <Stepper value={0} min={0} label="Margherita" onIncrement={() => {}} onDecrement={onDecrement} />,
    );
    const minus = screen.getByRole('button', { name: 'Remove one Margherita' });
    expect(minus).toBeDisabled();
    fireEvent.click(minus);
    expect(onDecrement).not.toHaveBeenCalled();
  });
});
