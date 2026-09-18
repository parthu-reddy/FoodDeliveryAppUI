import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '../action/Button';
import { Surface } from '../surface/Surface';
import { Overlay } from './Overlay';

/**
 * Promise-based replacement for window.confirm().
 *
 *   const confirm = useConfirm();
 *   if (!await confirm({ title: 'Clear your cart?', tone: 'danger' })) return;
 *
 * The API shape is deliberate. A declarative <ConfirmDialog isOpen> forces every call site to
 * thread its own boolean state and split one decision across two callbacks, which is why all
 * eleven native dialogs in this codebase were still native: window.confirm() was simply less
 * work. Awaiting a boolean is less work still, so the correct thing is now the easy thing.
 *
 * Native confirm() also blocks the JS thread, cannot be themed, and on iOS Safari announces
 * the site's domain to the user mid-flow.
 */

export type ConfirmTone = 'danger' | 'primary';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>');
  }
  return ctx;
}

interface PendingState {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  // The handlers close over the pending promise from the render that showed the dialog,
  // so there is no ref to keep in sync and nothing is written during render.
  const settle = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending],
  );

  const value = useMemo(() => confirm, [confirm]);
  const options = pending?.options;
  const tone = options?.tone ?? 'danger';

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Overlay
        open={pending !== null}
        onClose={() => settle(false)}
        label={options?.title ?? 'Confirm'}
        placement="center"
        className="w-full sm:max-w-sm"
      >
        <Surface variant="glass-overlay" elevation={4} radius="xl" className="w-full p-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
            {options?.title}
          </h2>
          {options?.description && (
            <p className="mt-2 text-sm" style={{ color: 'var(--color-ink-2)' }}>
              {options.description}
            </p>
          )}
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => settle(false)}>
              {options?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              fullWidth
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </div>
        </Surface>
      </Overlay>
    </ConfirmContext.Provider>
  );
}
