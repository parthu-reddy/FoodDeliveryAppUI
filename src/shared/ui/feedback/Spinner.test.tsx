import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('announces itself to screen readers by default', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('can be silenced inside an already-labelled control', () => {
    const { container } = render(<Spinner label="" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('scales with the size prop', () => {
    const { container, rerender } = render(<Spinner size="xs" />);
    expect((container.firstChild as HTMLElement).style.width).toBe('12px');
    rerender(<Spinner size="lg" />);
    expect((container.firstChild as HTMLElement).style.width).toBe('32px');
  });

  it('inherits the surrounding text colour, with a transparent gap for the ring', () => {
    const { container } = render(<Spinner />);
    const style = (container.firstChild as HTMLElement).style;
    expect(style.borderTopColor).toBe('transparent');
    expect(style.borderRightColor.toLowerCase()).toBe('currentcolor');
  });
});
