import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { ConfirmMoneyAction } from './ConfirmMoneyAction';

/**
 * The typed confirmation on large amounts. It was gated on `amount >= 1000000` while amounts are
 * rupees, so it only appeared above ₹10,00,000 instead of ₹10,000 -- and nothing tested it.
 */
describe('ConfirmMoneyAction', () => {
  beforeEach(() => {
    if (!globalThis.crypto?.randomUUID) {
      Object.defineProperty(globalThis, 'crypto', {
        value: { randomUUID: () => '11111111-1111-1111-1111-111111111111' },
        configurable: true,
      });
    }
  });

  it('submits a small amount on one click', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmMoneyAction amount={2500} effectSummary="Pay the rider" buttonLabel="Pay" onConfirm={onConfirm} />);

    expect(screen.queryByPlaceholderText('2500')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pay' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('demands the amount be typed at ₹10,000 and above', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmMoneyAction amount={10000} effectSummary="Pay the outlet" buttonLabel="Pay" onConfirm={onConfirm} />);

    const button = screen.getByRole('button', { name: 'Pay' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('stays disabled while the typed amount is wrong', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmMoneyAction amount={15000} effectSummary="Pay the outlet" buttonLabel="Pay" onConfirm={onConfirm} />);

    fireEvent.change(screen.getByPlaceholderText('15000'), { target: { value: '1500' } });
    expect(screen.getByRole('button', { name: 'Pay' })).toBeDisabled();
  });

  it('enables once the exact amount is typed, and passes an idempotency key', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmMoneyAction amount={15000} effectSummary="Pay the outlet" buttonLabel="Pay" onConfirm={onConfirm} />);

    fireEvent.change(screen.getByPlaceholderText('15000'), { target: { value: '15000' } });
    const button = screen.getByRole('button', { name: 'Pay' });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0]).toBeTruthy();
  });

  it('shows the effect of the action and blocks a second click while pending', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmMoneyAction amount={500} effectSummary="Record a payout" buttonLabel="Record" onConfirm={onConfirm} isPending />);

    expect(screen.getByText('Record a payout')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Processing...' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
