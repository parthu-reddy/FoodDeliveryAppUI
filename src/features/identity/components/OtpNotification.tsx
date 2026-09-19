import { MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React from 'react';
import { Surface } from '@shared/ui';

/**
 * The simulated SMS that carries the dev OTP.
 *
 * A button, not a div: it is tappable — that is its whole purpose — and it was previously a
 * `<div onClick>`, which is invisible to a keyboard. Phase 2 removed eleven of those; this
 * one came back in because it was nested inside a 470-line file where nobody was looking.
 */

interface OtpNotificationProps {
  open: boolean;
  otp: string;
  onAutofill: () => void;
}

export function OtpNotification({ open, otp, onAutofill }: OtpNotificationProps) {
  const presets = useMotionPresets();
  return (
    <AnimatePresence>
      {open && (
        <motion.div {...presets.scaleIn}
          className="absolute left-4 right-4 top-4 max-w-md mx-auto z-50"
        >
          <Surface
            as="div"
            variant="glass-overlay"
            radius="xl"
            elevation={4}
            className="p-0 overflow-hidden"
          >
            <button
              type="button"
              onClick={onAutofill}
              className="w-full flex items-start gap-3 p-4 text-left cursor-pointer"
            >
              <span
                className="p-2 rounded-xl shrink-0"
                style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
              >
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex justify-between items-center">
                  <span
                    className="font-bold text-xs font-mono tracking-wider"
                    style={{ color: 'var(--color-warning)' }}
                  >
                    SMS GATEWAY
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-ink-3)' }}>
                    Just now
                  </span>
                </span>
                <span
                  className="block text-sm font-semibold mt-1"
                  style={{ color: 'var(--color-ink)' }}
                >
                  Your La Bouffe Login OTP is{' '}
                  <span
                    className="font-mono text-base font-bold underline decoration-dotted"
                    style={{ color: 'var(--color-warning)' }}
                  >
                    {otp}
                  </span>
                </span>
                <span className="block text-[10px] mt-0.5" style={{ color: 'var(--color-ink-2)' }}>
                  Tap this notification to autofill and proceed.
                </span>
              </span>
            </button>
          </Surface>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
