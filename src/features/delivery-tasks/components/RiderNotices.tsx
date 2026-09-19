import { ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React from 'react';
import { Surface } from '@shared/ui';

/**
 * The three things the rider screen says when it is not showing a job: an error toast, a lost
 * dispatch connection, and "you are off duty".
 *
 * All three were inline in the dashboard, which is part of why it ran to 1,124 lines. They
 * are grouped here because they are one concern — the state of the shift rather than the
 * state of a delivery.
 */

export function RiderToast({ message }: { message: string | null }) {
  const presets = useMotionPresets();
  return (
    <AnimatePresence>
      {message && (
        <motion.div {...presets.scaleIn}
          className="fixed top-12 left-0 right-0 mx-auto max-w-sm z-[100] px-4"
          role="status"
        >
          <Surface variant="glass-overlay" radius="xl" elevation={4} className="p-4">
            <p className="font-medium text-sm" style={{ color: 'var(--color-danger)' }}>
              {message}
            </p>
          </Surface>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shown while on duty but disconnected — the rider is not receiving pings and must know. */
export function ConnectionBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="px-5 py-2 flex items-center gap-2"
      role="alert"
      style={{
        background: 'var(--color-danger-bg)',
        borderBottom: '1px solid var(--color-danger-line)',
      }}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse shrink-0"
        style={{ background: 'var(--color-danger)' }}
      />
      <p className="text-xs font-bold" style={{ color: 'var(--color-danger)' }}>
        Connection lost. Reconnecting to dispatch&hellip;
      </p>
    </div>
  );
}

/**
 * On duty, but the device has not produced a position yet.
 *
 * Previously invisible: the app broadcast a hardcoded Bangalore-centre coordinate until
 * geolocation resolved, so the rider read as online and correctly placed while dispatch
 * matched them against a spot they were never at.
 */
export function LocationBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="px-5 py-2 flex items-center gap-2"
      role="alert"
      style={{
        background: 'var(--color-warning-bg)',
        borderBottom: '1px solid var(--color-warning-line)',
      }}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse shrink-0"
        style={{ background: 'var(--color-warning)' }}
      />
      <p className="text-xs font-bold" style={{ color: 'var(--color-warning)' }}>
        Waiting for your location &mdash; you will not receive trips until it is found.
      </p>
    </div>
  );
}

export function RiderOfflineState() {
  const presets = useMotionPresets();
  return (
    <motion.div
      key="offline" {...presets.fade}
      className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4"
      style={{ color: 'var(--color-ink-2)' }}
    >
      <span className="p-4 rounded-full" style={{ background: 'var(--color-paper-sunken)' }}>
        <ShieldAlert className="w-12 h-12" aria-hidden="true" />
      </span>
      <h4 className="font-bold text-lg" style={{ color: 'var(--color-ink)' }}>
        You are currently Duty Offline
      </h4>
      <p className="text-xs max-w-xs leading-relaxed">
        Switch your duty status to Online at the top right to start receiving dispatch jobs,
        navigating maps, and pocketing payouts.
      </p>
    </motion.div>
  );
}
