import { MapPinOff, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React from 'react';
import type { Order } from '@/types';
import { formatINR } from '@shared/money';
import { Button, Surface } from '@shared/ui';

/**
 * A job being offered, and the seconds left to take it.
 *
 * The payout is shown **before** acceptance, which is the only moment it can affect the
 * decision. The countdown is a real ring rather than a number alone, because a rider glances
 * at this while doing something else.
 */

const PING_WINDOW_SECONDS = 60;

interface DispatchPingCardProps {
  job: Order;
  secondsLeft: number;
  onAccept: (job: Order) => void;
  onDecline: (jobId: string) => void;
}

function Stop({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-1 w-6 h-6 rounded flex items-center justify-center shrink-0"
        style={{ background: 'var(--color-paper-sunken)', color: 'var(--color-ink-2)' }}
      >
        {icon}
      </span>
      <span>
        <span
          className="block text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--color-ink-3)' }}
        >
          {label}
        </span>
        <span className="block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          {value}
        </span>
      </span>
    </div>
  );
}

export function DispatchPingCard({ job, secondsLeft, onAccept, onDecline }: DispatchPingCardProps) {
  const presets = useMotionPresets();
  return (
    <motion.div {...presets.rise}
      className="fixed inset-x-4 bottom-4 z-50"
      role="alert"
    >
      <Surface variant="glass-overlay" radius="xl" elevation={4} className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3
              className="font-black text-lg uppercase flex items-center gap-2"
              style={{ color: 'var(--color-ink)' }}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ background: 'var(--color-success)' }}
              />
              New Dispatch
            </h3>
            <p
              className="text-xs font-mono font-bold mt-1"
              style={{ color: 'var(--color-success)' }}
            >
              Est. Delivery Fee:{' '}
              {job.deliveryFee ? formatINR(job.deliveryFee) : 'Calculating…'}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm relative"
            style={{ border: '2px solid var(--color-warning-line)', color: 'var(--color-warning)' }}
            role="timer"
            aria-label={`${secondsLeft} seconds left to accept`}
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
              <circle
                cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2"
                strokeDasharray="100"
                strokeDashoffset={100 - (secondsLeft / PING_WINDOW_SECONDS) * 100}
                style={{ transitionProperty: 'stroke-dashoffset', transitionDuration: '1s', transitionTimingFunction: 'linear' }}
              />
            </svg>
            {secondsLeft}s
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <Stop icon={<Store className="w-3.5 h-3.5" />} label="Pickup" value={job.restaurantName} />
          <Stop icon={<MapPinOff className="w-3.5 h-3.5" />} label="Dropoff" value={job.deliveryAddress} />
        </div>

        <div className="flex gap-3">
          <Button size="touch" variant="outline" className="flex-1" onClick={() => onDecline(job.id)}>
            Decline
          </Button>
          <Button size="touch" variant="success" className="flex-[2]" onClick={() => onAccept(job)}>
            Accept Order
          </Button>
        </div>
      </Surface>
    </motion.div>
  );
}
