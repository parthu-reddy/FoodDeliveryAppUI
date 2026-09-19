import React from 'react';

/**
 * The single way a status is rendered anywhere in the app.
 *
 * It deliberately knows nothing about orders, payouts or refund tickets: each domain owns its
 * own status -> {label, tone} map and hands the result here. That is what stops the same
 * status looking different in the customer, restaurant and admin views, which is what four
 * independently hand-written `getStatusBadge` switches had produced.
 *
 * The tones are the Phase 1 semantic tokens, so two statuses can no longer collide by
 * accident -- which they did: PAID and CANCELLED payouts both rendered amber, as did OPEN and
 * RESOLVED refund tickets.
 */

export type StatusTone = 'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'live';

const TONE: Record<StatusTone, React.CSSProperties> = {
  neutral: {
    color: 'var(--color-ink-2)',
    background: 'var(--color-paper-sunken)',
    borderColor: 'var(--color-paper-line)',
  },
  success: {
    color: 'var(--color-success)',
    background: 'var(--color-success-bg)',
    borderColor: 'var(--color-success-line)',
  },
  warning: {
    color: 'var(--color-warning)',
    background: 'var(--color-warning-bg)',
    borderColor: 'var(--color-warning-line)',
  },
  info: {
    color: 'var(--color-info)',
    background: 'var(--color-info-bg)',
    borderColor: 'var(--color-info-line)',
  },
  danger: {
    color: 'var(--color-danger)',
    background: 'var(--color-danger-bg)',
    borderColor: 'var(--color-danger-line)',
  },
  live: {
    color: 'var(--color-success)',
    background: 'var(--color-success-bg)',
    borderColor: 'var(--color-success-line)',
  },
};

type PillSize = 'sm' | 'md';

const SIZE: Record<PillSize, React.CSSProperties> = {
  sm: { fontSize: 10, padding: '3px 7px', letterSpacing: '.3px' },
  md: { fontSize: 11, padding: '4px 9px', letterSpacing: '.4px' },
};

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  size?: PillSize;
  /** Adds a pulsing dot. Only for a state that is genuinely in motion right now. */
  live?: boolean;
  className?: string;
}

export function StatusPill({
  label,
  tone = 'neutral',
  size = 'sm',
  live = false,
  className = '',
}: StatusPillProps) {
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center gap-1.5 font-extrabold uppercase whitespace-nowrap ${className}`}
      style={{
        ...TONE[tone],
        ...SIZE[size],
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 'var(--radius-full)',
        // A status change is information arriving; it crossfades rather than snapping.
        // Colour only — nothing here moves, so there is no reduced-motion branch to make.
        transitionProperty: 'background-color, color, border-color',
        transitionDuration: 'var(--duration-fast)',
        transitionTimingFunction: 'var(--ease-out)',
      }}
    >
      {live && (
        <span
          aria-hidden="true"
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: 'var(--color-live)' }}
        />
      )}
      {label}
    </span>
  );
}
