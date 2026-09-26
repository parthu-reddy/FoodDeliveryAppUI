import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import RiderEarnings from './RiderEarnings';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { customerApi } from '@/lib/zodiosClients';
import '@testing-library/jest-dom';

// Mock zodiosClients
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: {
    driverMoney: {
      fetchSummary_1: vi.fn().mockResolvedValue({
        net: 45000,
        pendingBalance: 40000,
        lastPayout: {
          amount: 15000,
          status: 'COMPLETED',
          createdAt: '2026-09-28T10:00:00Z'
        }
      }),
      fetchStatement_1: vi.fn().mockResolvedValue({
        content: [],
        totalPages: 1
      })
    }
  }
}));

// 01:00Z on 1 October: already October in UTC, still 30 September (22:30) in St John's, the zone
// this test run is pinned to (vitest.config.ts).
const NOW = new Date('2026-10-01T01:00:00Z');

describe('RiderEarnings', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially or renders stats correctly', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <RiderEarnings />
        </ToastProvider>
      </ThemeProvider>
    );

    const netEarnings = await screen.findByText('Net Earnings');
    expect(netEarnings).toBeInTheDocument();
    // The period it covers, beside the exact label the E2E suite finds the card by.
    expect(await screen.findByText('This month')).toBeInTheDocument();

    const accountStatement = await screen.findByText('Account Statement');
    expect(accountStatement).toBeInTheDocument();
  });

  it('asks for this month on the rider’s calendar, not the UTC one', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <RiderEarnings />
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => expect(customerApi.driverMoney.fetchSummary_1).toHaveBeenCalled());
    expect(customerApi.driverMoney.fetchSummary_1).toHaveBeenLastCalledWith({
      queries: { from: '2026-09-01T02:30:00.000Z', to: '2026-10-01T02:30:00.000Z' },
    });
  });

  it('shows a pending balance the ledger could not report as unavailable, not ₹0', async () => {
    vi.mocked(customerApi.driverMoney.fetchSummary_1).mockResolvedValueOnce({ net: 812.5, pendingBalance: null } as never);
    render(
      <ThemeProvider>
        <ToastProvider>
          <RiderEarnings />
        </ToastProvider>
      </ThemeProvider>
    );

    const card = async (label: string) => within((await screen.findByText(label)).parentElement as HTMLElement).getByRole('heading');
    expect(await card('Pending Balance')).toHaveTextContent('—');
    expect(await card('Pending Balance')).not.toHaveTextContent('₹');
    expect(await card('Net Earnings')).toHaveTextContent('₹812.50');
  });
});
