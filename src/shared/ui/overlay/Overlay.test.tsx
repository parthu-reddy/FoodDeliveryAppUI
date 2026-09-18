import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Overlay } from './Overlay';

function Harness({ onClose = () => {}, open = true }: { onClose?: () => void; open?: boolean }) {
  return (
    <div>
      <button type="button">outside trigger</button>
      <Overlay open={open} onClose={onClose} label="Test dialog">
        <div>
          <button type="button">first</button>
          <button type="button">second</button>
        </div>
      </Overlay>
    </div>
  );
}

describe('Overlay', () => {
  it('exposes a labelled modal dialog', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test dialog');
  });

  it('renders nothing when closed', () => {
    render(<Harness open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves focus into the dialog on open', async () => {
    render(<Harness />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
    });
  });

  it('returns focus to the previously focused element on close', async () => {
    const { rerender } = render(<Harness open={false} />);
    const trigger = screen.getByRole('button', { name: 'outside trigger' });
    trigger.focus();
    expect(trigger).toHaveFocus();

    rerender(<Harness open />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'first' })).toHaveFocus());

    rerender(<Harness open={false} />);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab inside the dialog', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog');
    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('locks body scroll while open and restores it after', () => {
    const { rerender } = render(<Harness open={false} />);
    const before = document.body.style.overflow;

    rerender(<Harness open />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Harness open={false} />);
    expect(document.body.style.overflow).toBe(before);
  });
});
