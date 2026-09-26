import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { RiderWalletSection } from './RiderWalletSection';
import { customerApi } from '@/lib/zodiosClients';
import '@testing-library/jest-dom';

vi.mock('@/lib/zodiosClients', () => ({
  customerApi: {
    driverMoney: {
      get: vi.fn((path: string) => Promise.resolve(path.endsWith('/summary')
        ? { pendingBalance: 1240.5, tips: 320 }
        : { content: [], totalPages: 1 })),
    },
  },
}));

// 01:00Z on 26 September is still the 25th (22:30) in St John's, the zone this run is pinned to.
const NOW = new Date('2026-09-26T01:00:00Z');

describe('RiderWalletSection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sums tips over the 30 calendar days up to and including the rider’s today, as its label says', async () => {
    render(<RiderWalletSection userId="rider-1" />);

    await waitFor(() => expect(customerApi.driverMoney.get).toHaveBeenCalledWith(
      '/api/v1/money/driver/summary',
      // 27 August 00:00 to 26 September 00:00, St John's time (NDT, -02:30).
      { queries: { from: '2026-08-27T02:30:00.000Z', to: '2026-09-26T02:30:00.000Z' } },
    ));
    expect(await screen.findByTestId('rider-tips')).toHaveTextContent('last 30 days');
  });

  it('shows a balance the ledger could not report as unavailable, not ₹0', async () => {
    vi.mocked(customerApi.driverMoney.get).mockImplementation(((path: string) => Promise.resolve(path.endsWith('/summary')
      ? { pendingBalance: null, tips: 0 }
      : { content: [], totalPages: 1 })) as never);

    render(<RiderWalletSection userId="rider-1" />);

    const heading = await screen.findByRole('heading', { name: 'Earnings Wallet' });
    const balance = heading.parentElement as HTMLElement;
    // The balance starts out empty, so wait until the summary has been applied: the statement is
    // only requested after it, and the loading state clears after that.
    await waitFor(() => expect(customerApi.driverMoney.get).toHaveBeenCalledWith('/api/v1/money/driver/statement', expect.anything()));
    await act(async () => {});
    expect(balance).toHaveTextContent('—');
    expect(balance).not.toHaveTextContent('₹');
  });

  it('shows the balance the ledger reports', async () => {
    vi.mocked(customerApi.driverMoney.get).mockImplementation(((path: string) => Promise.resolve(path.endsWith('/summary')
      ? { pendingBalance: 1240.5, tips: 0 }
      : { content: [], totalPages: 1 })) as never);

    render(<RiderWalletSection userId="rider-1" />);

    const heading = await screen.findByRole('heading', { name: 'Earnings Wallet' });
    await waitFor(() => expect(heading.parentElement as HTMLElement).toHaveTextContent('₹1,240.50'));
  });
});
