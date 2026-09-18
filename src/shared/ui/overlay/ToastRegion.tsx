import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import React from 'react';
import { createPortal } from 'react-dom';

/**
 * The toast surface. Lives here because `shared/ui/overlay/` is the only place in the app
 * allowed to portal -- ToastContext keeps the state and this renders it.
 *
 * Built on the semantic tokens rather than the hard-coded hexes it replaces, which used
 * `#4ade80` for success and `#60a5fa` for info: two colours from no palette in this project.
 */

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const TONE: Record<ToastType, { color: string; Icon: typeof Info }> = {
  success: { color: 'var(--color-live)', Icon: CheckCircle2 },
  error: { color: 'var(--color-danger)', Icon: AlertCircle },
  info: { color: 'var(--color-info)', Icon: Info },
};

export function ToastRegion({ toasts }: { toasts: ToastItem[] }) {
  const reduceMotion = useReducedMotion();
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      // A live region: screen readers announce each toast as it arrives. The previous
      // implementation was visual-only, so nothing was announced at all.
      role="status"
      aria-live="polite"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const { color, Icon } = TONE[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={reduceMotion ? false : { opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }
              }
              className="flex items-center gap-3 px-6 py-3 pointer-events-auto text-sm font-medium"
              style={{
                background: 'var(--glass-overlay-bg)',
                backdropFilter: 'var(--blur-overlay)',
                WebkitBackdropFilter: 'var(--blur-overlay)',
                border: '1px solid var(--glass-overlay-line)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--elevation-4)',
                color: 'var(--color-ink)',
              }}
            >
              <Icon className="w-5 h-5 shrink-0" style={{ color }} aria-hidden="true" />
              <span>{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
