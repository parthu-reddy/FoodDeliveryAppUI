import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * The single overlay implementation: portal, focus trap, scroll lock, Escape, backdrop.
 *
 * Modal, BottomSheet, Drawer and ConfirmDialog are thin compositions of this. Nothing else
 * in the app may portal or hand-roll a `fixed inset-0` shell -- the Phase 2 gate checks both.
 *
 * The previous Modal rendered in place with no portal (so z-index fought the page), no focus
 * trap, no scroll lock, no Escape handling and no aria-modal. Seventeen components copied
 * that shape, each slightly differently.
 */

export type OverlayPlacement = 'center' | 'bottom' | 'right' | 'left';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Required: a dialog without one is announced as "dialog", nothing more. */
  label: string;
  placement?: OverlayPlacement;
  /** Clicking the backdrop closes. Off for flows that must not be dismissed by accident. */
  dismissOnBackdrop?: boolean;
  /** Escape closes. Off only for genuinely blocking flows. */
  dismissOnEscape?: boolean;
  className?: string;
  children: React.ReactNode;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function enterFrom(placement: OverlayPlacement) {
  switch (placement) {
    case 'bottom':
      return { y: '100%' };
    case 'right':
      return { x: '100%' };
    case 'left':
      return { x: '-100%' };
    case 'center':
    default:
      return { opacity: 0, scale: 0.96, y: 16 };
  }
}

function restingState(placement: OverlayPlacement) {
  return placement === 'center' ? { opacity: 1, scale: 1, y: 0 } : { x: 0, y: 0 };
}

const POSITION: Record<OverlayPlacement, string> = {
  center: 'items-center justify-center p-4',
  bottom: 'items-end justify-center',
  right: 'items-stretch justify-end',
  left: 'items-stretch justify-start',
};

export function Overlay({
  open,
  onClose,
  label,
  placement = 'center',
  dismissOnBackdrop = true,
  dismissOnEscape = true,
  className = '',
  children,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  // Remember what had focus, and give it back on close. Without this, closing a dialog
  // drops focus to <body> and keyboard users lose their place entirely.
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    return () => {
      restoreFocusTo.current?.focus?.();
    };
  }, [open]);

  // Scroll lock. Preserves the existing inline value rather than assuming it was empty.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && dismissOnEscape) {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.closest('[hidden]') && el.getAttribute('aria-hidden') !== 'true',
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [dismissOnEscape, onClose],
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
          className={`fixed inset-0 z-[100] flex ${POSITION[placement]}`}
          style={{ background: 'rgba(18, 22, 28, 0.44)' }}
          onMouseDown={(event) => {
            if (dismissOnBackdrop && event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={reduceMotion ? false : enterFrom(placement)}
            animate={restingState(placement)}
            exit={reduceMotion ? undefined : enterFrom(placement)}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', damping: 30, stiffness: 320 }
            }
            className={`outline-none ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
