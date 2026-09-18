import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConfirmProvider, useConfirm } from './ConfirmDialog';

function Harness({ onResult }: { onResult: (value: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await confirm({
          title: 'Clear your cart?',
          description: 'Switching outlets removes the items you already added.',
          confirmLabel: 'Clear it',
          tone: 'danger',
        });
        onResult(ok);
      }}
    >
      switch outlet
    </button>
  );
}

function renderHarness(onResult: (value: boolean) => void) {
  return render(
    <ConfirmProvider>
      <Harness onResult={onResult} />
    </ConfirmProvider>,
  );
}

describe('useConfirm', () => {
  it('shows nothing until asked', () => {
    renderHarness(() => {});
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves true when confirmed', async () => {
    const results: boolean[] = [];
    renderHarness((v) => results.push(v));

    fireEvent.click(screen.getByRole('button', { name: 'switch outlet' }));
    expect(await screen.findByRole('dialog')).toHaveAttribute('aria-label', 'Clear your cart?');
    expect(screen.getByText(/Switching outlets removes/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear it' }));
    await waitFor(() => expect(results).toEqual([true]));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('resolves false when cancelled', async () => {
    const results: boolean[] = [];
    renderHarness((v) => results.push(v));

    fireEvent.click(screen.getByRole('button', { name: 'switch outlet' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(results).toEqual([false]));
  });

  it('resolves false when dismissed with Escape', async () => {
    const results: boolean[] = [];
    renderHarness((v) => results.push(v));

    fireEvent.click(screen.getByRole('button', { name: 'switch outlet' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(results).toEqual([false]));
  });

  it('throws if used outside the provider', () => {
    const Bare = () => {
      useConfirm();
      return null;
    };
    expect(() => render(<Bare />)).toThrow(/ConfirmProvider/);
  });
});
