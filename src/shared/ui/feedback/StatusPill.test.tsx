import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusPill } from './StatusPill';
import { payoutStatus } from '@features/ledger/model/payoutStatus';
import { refundTicketStatus } from '@features/admin-ops/model/refundStatus';

describe('StatusPill', () => {
  it('renders the label', () => {
    render(<StatusPill label="Paid" />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('gives every tone a different colour', () => {
    const tones = ['neutral', 'success', 'warning', 'info', 'danger'] as const;
    const colours = tones.map((tone) => {
      const { unmount, getByText } = render(<StatusPill label={tone} tone={tone} />);
      const colour = getByText(tone).style.color;
      unmount();
      return colour;
    });
    expect(new Set(colours).size).toBe(tones.length);
  });

  it('only shows the live dot when asked', () => {
    const { rerender, container } = render(<StatusPill label="Queued" />);
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(0);
    rerender(<StatusPill label="On the way" live />);
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(1);
  });
});

describe('status models', () => {
  // These two pairs rendered IDENTICALLY before Phase 3: both amber. An admin could not tell
  // a completed payout from a cancelled one, nor an open ticket from a resolved one.
  it('payout PAID and CANCELLED no longer share a tone', () => {
    expect(payoutStatus('PAID').tone).not.toBe(payoutStatus('CANCELLED').tone);
    expect(payoutStatus('PAID').tone).toBe('success');
  });

  it('refund OPEN and RESOLVED no longer share a tone', () => {
    expect(refundTicketStatus('OPEN').tone).not.toBe(refundTicketStatus('RESOLVED').tone);
    expect(refundTicketStatus('RESOLVED').tone).toBe('success');
  });

  it('every payout status maps to a distinct tone', () => {
    const tones = ['DRAFT', 'APPROVED', 'PAID', 'FAILED', 'CANCELLED'].map(
      (s) => payoutStatus(s).tone,
    );
    expect(new Set(tones).size).toBe(tones.length);
  });

  it('falls back readably for an unknown status', () => {
    expect(payoutStatus('SOME_NEW_STATE')).toEqual({
      label: 'SOME NEW STATE',
      tone: 'neutral',
    });
    expect(payoutStatus(undefined).label).toBe('Unknown');
  });

  it('crossfades when the status changes', () => {
    // A status change is information arriving. Before this the pill swapped colour between
    // frames, which reads as a glitch rather than an update.
    const { rerender } = render(<StatusPill label="Preparing" tone="info" />);
    const pill = screen.getByText('Preparing');
    expect(pill.style.transitionProperty).toBe('background-color, color, border-color');
    expect(pill.style.transitionDuration).toBe('var(--duration-fast)');
    rerender(<StatusPill label="On the way" tone="live" />);
    expect(screen.getByText('On the way').style.transitionProperty)
      .toBe('background-color, color, border-color');
  });

  it('transitions colour only, so prefers-reduced-motion is handled in CSS', () => {
    render(<StatusPill label="Delivered" tone="success" />);
    const pill = screen.getByText('Delivered');
    expect(pill.style.transitionProperty).not.toMatch(/transform/);
  });
});
