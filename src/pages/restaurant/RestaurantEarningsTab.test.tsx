import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { customerApi } from '@/lib/zodiosClients';
import RestaurantEarningsTab from './RestaurantEarningsTab';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import '@testing-library/jest-dom';

// Mock zodiosClients
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: {
    restaurantMoney: {
      fetchSummary: vi.fn().mockResolvedValue({
        netEarnings: 1500000,
        pendingBalance: 50000,
        clawbacks: 0,
        lastPayout: {
          amount: 50000,
          status: 'COMPLETED',
          createdAt: new Date().toISOString()
        }
      }),
      fetchStatement: vi.fn().mockResolvedValue({
        content: [],
        totalPages: 1
      })
    }
  }
}));

describe('RestaurantEarningsTab', () => {
  it('keeps previously loaded financial data hidden throughout a denied-access retry', async () => {
    vi.useFakeTimers();
    try {
      const denied = new AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, undefined,
        { status: 403 } as AxiosResponse);
      const summary = { netEarnings: 1250, pendingBalance: 25, clawbacks: 0 };
      type Statement = Awaited<ReturnType<typeof customerApi.restaurantMoney.fetchStatement>>;
      const statement: Statement = { content: [], totalPages: 1, totalElements: 0,
        last: true, size: 20, number: 0, first: true, numberOfElements: 0, empty: true };
      let restoreSummary: ((value: typeof summary) => void) | undefined;
      let restoreStatement: ((value: Statement) => void) | undefined;
      vi.mocked(customerApi.restaurantMoney.fetchSummary)
        .mockResolvedValueOnce(summary as never).mockRejectedValueOnce(denied)
        .mockImplementationOnce(() => new Promise(resolve => { restoreSummary = resolve as typeof restoreSummary; }));
      vi.mocked(customerApi.restaurantMoney.fetchStatement)
        .mockResolvedValueOnce(statement)
        .mockRejectedValueOnce(denied)
        .mockRejectedValueOnce(denied)
        .mockImplementationOnce(() => new Promise<Statement>(resolve => { restoreStatement = resolve; }));

      render(<ThemeProvider><ToastProvider><RestaurantEarningsTab outletId="123" /></ToastProvider></ThemeProvider>);
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(screen.getByText('₹1,250.00')).toBeInTheDocument();

      await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
      expect(screen.getAllByText('Not permitted')).toHaveLength(3);
      expect(screen.queryByText('₹1,250.00')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Check access again' }));
      expect(screen.getAllByText('Not permitted')).toHaveLength(3);
      expect(screen.queryByText('Account Statement')).not.toBeInTheDocument();
      expect(screen.queryByText('₹1,250.00')).not.toBeInTheDocument();

      await act(async () => { restoreSummary?.(summary); restoreStatement?.(statement); });
      expect(screen.getByText('₹1,250.00')).toBeInTheDocument();
      expect(screen.queryByText('Not permitted')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders loading state initially or renders stats correctly', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <RestaurantEarningsTab outletId="123" />
        </ToastProvider>
      </ThemeProvider>
    );
    
    // It should render some stat text eventually
    const netEarnings = await screen.findByText('Net Earnings');
    expect(netEarnings).toBeInTheDocument();
    // The outlet's calendar month (the summary's default period), beside the exact label the E2E suite finds the card by.
    expect(await screen.findByText('This month')).toBeInTheDocument();
    
    const accountStatement = await screen.findByText('Account Statement');
    expect(accountStatement).toBeInTheDocument();
  });

  /**
   * The clawbacks are the ledger's, and a figure the ledger could not report arrives as null. It used
   * to be shown as ₹0 (the clawbacks were a hardcoded zero on the server as well).
   */
  it('shows the clawbacks the server reports, and a missing figure as unavailable rather than zero', async () => {
    vi.mocked(customerApi.restaurantMoney.fetchSummary).mockResolvedValueOnce({
      netEarnings: 1250, pendingBalance: null, clawbacks: 75.25,
    } as never);
    render(
      <ThemeProvider>
        <ToastProvider>
          <RestaurantEarningsTab outletId="123" />
        </ToastProvider>
      </ThemeProvider>
    );

    const card = async (label: string) => within((await screen.findByText(label)).parentElement as HTMLElement).getByRole('heading');
    expect(await card('Clawbacks')).toHaveTextContent('₹75.25');
    expect(await card('Pending Balance')).toHaveTextContent('—');
    expect(await card('Pending Balance')).not.toHaveTextContent('₹');
    expect(await card('Net Earnings')).toHaveTextContent('₹1,250.00');
  });
});
