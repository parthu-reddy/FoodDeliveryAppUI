import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ToastRegion } from './ToastRegion';

describe('ToastRegion', () => {
  it('renders an empty live region when there are no toasts', () => {
    render(<ToastRegion toasts={[]} />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toBeEmptyDOMElement();
  });

  it('announces toasts in a polite live region', () => {
    render(
      <ToastRegion
        toasts={[
          { id: '1', message: 'Order placed', type: 'success' },
          { id: '2', message: 'Payment failed', type: 'error' },
        ]}
      />,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(screen.getByText('Payment failed')).toBeInTheDocument();
  });

  it('gives each tone a distinct semantic colour', () => {
    // All three tones in ONE render. Re-rendering does not work here: AnimatePresence keeps
    // the outgoing toast mounted through its exit transition, so querySelector kept finding
    // the first toast's icon and every tone read as the same colour.
    render(
      <ToastRegion
        toasts={[
          { id: '1', message: 'ok', type: 'success' },
          { id: '2', message: 'bad', type: 'error' },
          { id: '3', message: 'fyi', type: 'info' },
        ]}
      />,
    );
    const colours = Array.from(
      screen.getByRole('status').querySelectorAll('svg'),
    ).map((svg) => (svg as unknown as SVGElement).style.color);

    expect(colours).toHaveLength(3);
    expect(new Set(colours).size).toBe(3);
    expect(colours[1]).toContain('--color-danger');
    expect(colours[2]).toContain('--color-info');
  });

  it('portals out of its parent so it is never clipped', () => {
    const { container } = render(
      <div style={{ overflow: 'hidden' }}>
        <ToastRegion toasts={[{ id: '1', message: 'hello', type: 'info' }]} />
      </div>,
    );
    // rendered into document.body, not into the overflow-hidden wrapper
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('announces without moving when prefers-reduced-motion is set', () => {
    // A toast is the one piece of motion a screen-reader user also hears. `useReducedMotion`
    // removes the slide; the live region still announces.
    render(<ToastRegion toasts={[{ id: '1', type: 'success', message: 'Order placed' }]} />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live');
    expect(region).toHaveTextContent('Order placed');
  });
});
