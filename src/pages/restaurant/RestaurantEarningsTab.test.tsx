import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
  it('renders loading state initially or renders stats correctly', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <RestaurantEarningsTab restaurantId="123" />
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
          <RestaurantEarningsTab restaurantId="123" />
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
