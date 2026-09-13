import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StarRating } from './StarRating';

/**
 * The one star control in the app, so the properties it must hold are worth pinning: it is operable
 * without a mouse, it announces what it is, and read-only mode offers nothing to press.
 */
describe('StarRating', () => {
  it('renders read-only as an image with the value in its label', () => {
    render(<StarRating value={4.3} label="Bombay Canteen" />);

    const control = screen.getByRole('img');
    expect(control).toHaveAttribute(
      'aria-label',
      expect.stringContaining('4.3 out of 5 stars'),
    );
    // Read-only means no radios to press and nothing in the tab order.
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(control).not.toHaveAttribute('tabindex');
  });

  it('exposes five radios and marks the selected one when interactive', () => {
    render(<StarRating value={3} onChange={() => {}} label="Bombay Canteen" />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('reports a click on a star', () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('4 stars'));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('is operable from the keyboard', () => {
    const onChange = vi.fn();
    render(<StarRating value={3} onChange={onChange} label="Bombay Canteen" />);
    const group = screen.getByRole('radiogroup');

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(4);

    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(2);

    // Number keys set the value outright -- the fastest path for someone who knows their answer.
    fireEvent.keyDown(group, { key: '5' });
    expect(onChange).toHaveBeenLastCalledWith(5);

    fireEvent.keyDown(group, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('does not step past either end', () => {
    const onChange = vi.fn();
    const { rerender } = render(<StarRating value={5} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(5);

    rerender(<StarRating value={1} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('ignores keys that are not ratings', () => {
    const onChange = vi.fn();
    render(<StarRating value={3} onChange={onChange} />);

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: '9' });
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'a' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
