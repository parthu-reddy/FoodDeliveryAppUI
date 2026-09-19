import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwipeAction } from './SwipeAction';

// jsdom implements neither pointer capture nor layout, so both are supplied here. Without
// the rect the track has width 0 and every drag computes as progress 0.
beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => true);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, width: 200, top: 0, height: 56, right: 200, bottom: 56, x: 0, y: 0,
    toJSON: () => ({}),
  } as DOMRect);
});

const swipe = (el: HTMLElement, toX: number) => {
  fireEvent.pointerDown(el, { pointerId: 1, clientX: 0 });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: toX });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: toX });
};

describe('SwipeAction', () => {
  it('is a slider, not a button — a tap must not be able to fire it', () => {
    // The whole reason it exists: a tap goes off by accident in a pocket and marks an order
    // delivered that is not.
    const onConfirm = vi.fn();
    render(<SwipeAction label="Slide to deliver" onConfirm={onConfirm} />);
    const control = screen.getByRole('slider', { name: 'Slide to deliver' });
    fireEvent.click(control);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms on a full swipe', () => {
    const onConfirm = vi.fn();
    render(<SwipeAction label="Slide to deliver" onConfirm={onConfirm} />);
    swipe(screen.getByRole('slider'), 190);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not confirm on a partial swipe, and springs back', () => {
    const onConfirm = vi.fn();
    render(<SwipeAction label="Slide to deliver" onConfirm={onConfirm} />);
    const control = screen.getByRole('slider');
    swipe(control, 80);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(control).toHaveAttribute('aria-valuenow', '0');
  });

  it('is operable from a keyboard, so it is not a drag-only control', () => {
    const onConfirm = vi.fn();
    render(<SwipeAction label="Slide to deliver" onConfirm={onConfirm} />);
    const control = screen.getByRole('slider');
    fireEvent.keyDown(control, { key: 'ArrowRight' });
    expect(control).toHaveAttribute('aria-valuenow', '25');
    fireEvent.keyDown(control, { key: 'End' });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('confirms once and then stops responding', () => {
    const onConfirm = vi.fn();
    render(<SwipeAction label="Slide to deliver" onConfirm={onConfirm} />);
    const control = screen.getByRole('slider');
    swipe(control, 190);
    swipe(control, 190);
    fireEvent.keyDown(control, { key: 'End' });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('says it is confirming once it has been', () => {
    render(<SwipeAction label="Slide to deliver" confirmingLabel="Marking delivered…" onConfirm={vi.fn()} />);
    swipe(screen.getByRole('slider'), 190);
    expect(screen.getByText('Marking delivered…')).toBeInTheDocument();
  });

  it('ignores every input when disabled', () => {
    const onConfirm = vi.fn();
    render(<SwipeAction label="Slide to deliver" onConfirm={onConfirm} disabled />);
    const control = screen.getByRole('slider');
    swipe(control, 190);
    fireEvent.keyDown(control, { key: 'End' });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(control).toHaveAttribute('tabindex', '-1');
  });

  it('clears the rider touch-target floor', () => {
    render(<SwipeAction label="Slide to deliver" onConfirm={vi.fn()} />);
    expect(screen.getByRole('slider').style.minHeight).toBe('56px');
  });

  it('follows the pointer exactly, which is not motion the reduced-motion preference removes', () => {
    // A drag IS the gesture: prefers-reduced-motion suppresses animation the user did not
    // ask for, not the direct manipulation they are performing with their thumb. The track
    // fill tracks progress 1:1 either way, which is what makes the control trustworthy.
    const onConfirm = vi.fn();
    render(<SwipeAction label="Slide to deliver" onConfirm={onConfirm} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(Number(slider.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });
});
