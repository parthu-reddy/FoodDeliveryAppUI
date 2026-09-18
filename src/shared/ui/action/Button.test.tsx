import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

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
});
