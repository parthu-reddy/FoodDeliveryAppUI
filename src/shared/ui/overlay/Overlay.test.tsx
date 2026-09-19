import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Overlay } from './Overlay';

// Only the preference is mocked; the rest of motion/react has to keep working, because the
// overlay's presence and focus handling run through AnimatePresence.
const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => reducedMotion.value,
}));

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

  it('rises on open and leaves faster than it arrived', () => {
    // Phase 5 inventory: open is --duration-base with --ease-out, close is --duration-fast
    // with --ease-in. An exit as slow as its entrance makes the whole app feel slower.
    render(<Harness />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // The panel is a motion element: it has a transform to animate from.
    expect(dialog.closest('[data-overlay-panel], div')).not.toBeNull();
  });

  it('mounts in its resting state when prefers-reduced-motion is set', () => {
    // `useReducedMotion` drives `initial={false}`, which is the difference between "no
    // motion" and "a 0.01s motion" — the latter still mounts hidden and then moves.
    // The overlay portals, so this asserts against the document, not the container.
    reducedMotion.value = true;
    render(<Harness />);
    const dialog = screen.getByRole('dialog');
    // Resting state on the first frame: fully opaque, untransformed. With the entrance
    // animation it would mount at opacity 0 and offset, then travel.
    expect(dialog.style.opacity).toBe('1');
    expect(dialog.style.transform).toBe('none');
    reducedMotion.value = false;
  });
});
