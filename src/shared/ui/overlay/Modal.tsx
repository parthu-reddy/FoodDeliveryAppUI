import { X } from 'lucide-react';
import React from 'react';
import { Surface } from '../surface/Surface';
import { Overlay } from './Overlay';

/** Sizes are max-widths; every modal is full-width below the sm breakpoint. */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-4xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Required, and always the dialog's accessible name — even when `header` replaces the
   * visible heading. The component this replaces made the title optional, so the three
   * modals that passed a custom `header` were announced to screen readers as just "dialog".
   */
  title: string;
  size?: ModalSize;
  /** Renders as a bottom sheet on small screens. */
  sheet?: boolean;
  /** Replaces the visible heading only. The close button and accessible name remain. */
  header?: React.ReactNode;
  /**
   * Renders no header bar at all, for modals whose content carries its own heading and
   * dismiss control. `title` is still required and still names the dialog — Escape and the
   * backdrop still close it, so this never creates a trap.
   */
  headerless?: boolean;
  footer?: React.ReactNode;
  dismissOnBackdrop?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  sheet = false,
  header,
  headerless = false,
  footer,
  dismissOnBackdrop = true,
  className = '',
  children,
}: ModalProps) {
  return (
    <Overlay
      open={open}
      onClose={onClose}
      label={title}
      placement={sheet ? 'bottom' : 'center'}
      dismissOnBackdrop={dismissOnBackdrop}
      className={`w-full ${SIZE[size]} ${className}`}
    >
      <Surface
        variant="glass-overlay"
        elevation={4}
        radius="xl"
        className="flex flex-col max-h-[85vh] overflow-hidden w-full"
      >
        {!headerless && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-paper-line)' }}
        >
          {header ?? (
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid place-items-center w-11 h-11 -mr-2 rounded-full"
            style={{
              color: 'var(--color-ink-2)',
              transitionProperty: 'background-color',
              transitionDuration: 'var(--duration-fast)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div
            className="px-4 py-3 shrink-0"
            style={{ borderTop: '1px solid var(--color-paper-line)' }}
          >
            {footer}
          </div>
        )}
      </Surface>
    </Overlay>
  );
}
