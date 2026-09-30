import { MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets, Surface } from '@shared/ui';
import React from 'react';

interface OtpNotificationProps {
  open: boolean;
  otp: string;
  onAutofill: () => void;
}

/**
 * A Dev-only UI affordance. Its parent mounts it only after the server advertises and returns a
 * restricted Dev OTP; ordinary and production logins never render this notification.
 */
export function OtpNotification({ open, otp, onAutofill }: OtpNotificationProps) {
  const presets = useMotionPresets();
  return (
    <AnimatePresence>
      {open && (
        <motion.div {...presets.scaleIn} className="absolute left-4 right-4 top-4 max-w-md mx-auto z-50">
          <Surface as="div" variant="glass-overlay" radius="xl" elevation={4} className="p-0 overflow-hidden">
            <button
              type="button"
              onClick={onAutofill}
              aria-label="Use this development code"
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
                  <span className="font-bold text-xs font-mono tracking-wider" style={{ color: 'var(--color-warning)' }}>
                    DEVELOPMENT OTP
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-ink-3)' }}>Just now</span>
                </span>
                <span className="block text-sm font-semibold mt-1" style={{ color: 'var(--color-ink)' }}>
                  Your development login code is{' '}
                  <span
                    className="font-mono text-base font-bold underline decoration-dotted"
                    style={{ color: 'var(--color-warning)' }}
                  >
                    {otp}
                  </span>
                </span>
                <span className="block text-[10px] mt-0.5" style={{ color: 'var(--color-ink-2)' }}>
                  Tap to autofill and proceed.
                </span>
              </span>
            </button>
          </Surface>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
