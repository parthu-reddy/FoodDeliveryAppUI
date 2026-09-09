import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

const payoutGet = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  ledgerApi: {
    payout: { get: (...a: unknown[]) => payoutGet(...a), post: vi.fn() },
    ledgerStatement: { get: vi.fn() },
  },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }));

import AdminPayoutsPage from './AdminPayoutsPage';

/**
 * The screen an administrator uses to pay restaurants and riders.
 *
 * <p>It had no test at all -- the Phase 6 gate named one, but under the wrong filename, so check 10
 * could never be satisfied and stopped being read. The paths matter as much as the rendering: the
 * admin payout endpoints moved behind /api/v1/internal/admin/** so the gateway can require the
 * role, and a screen still asking for the old public path reaches nothing.
 */
describe('AdminPayoutsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // /pending answers a bare array; the history endpoint answers a page. The component reads
    // each accordingly, so the stub has to distinguish them.
    payoutGet.mockImplementation((path: string) =>
      String(path).endsWith('/pending')
        ? Promise.resolve([])
        : Promise.resolve({ content: [], totalPages: 1 }));
  });

  it('opens on the pending queue', async () => {
    render(<AdminPayoutsPage />);
    expect(await screen.findByText('Pending Queue')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('asks the gateway-routed admin path for the pending queue', async () => {
    render(<AdminPayoutsPage />);
    await waitFor(() => expect(payoutGet).toHaveBeenCalled());

    const paths = payoutGet.mock.calls.map((c) => String(c[0]));
    expect(paths).toContain('/api/v1/internal/admin/payouts/pending');
    // The pre-2026-09-08 path. Nothing routes it, so a request there dies at the gateway.
    expect(paths.every((p) => !p.startsWith('/api/v1/ledger/payouts'))).toBe(true);
  });

  it('reads the payout history from the admin path once a payee is named', async () => {
    render(<AdminPayoutsPage />);
    fireEvent.click(await screen.findByText('History'));

    // History is per payee: it refuses to fetch until one is given.
    const payeeId = await screen.findByPlaceholderText(/enter uuid/i);
    fireEvent.change(payeeId, { target: { value: '11111111-1111-1111-1111-111111111111' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      const paths = payoutGet.mock.calls.map((c) => String(c[0]));
      expect(paths).toContain('/api/v1/internal/admin/payouts');
    });
  });

  it('survives a queue the service could not return', async () => {
    payoutGet.mockRejectedValue(new Error('ledger-service unreachable'));
    render(<AdminPayoutsPage />);
    // The tabs must still be usable; a failed fetch is not a blank screen.
    expect(await screen.findByText('Pending Queue')).toBeInTheDocument();
  });
});
