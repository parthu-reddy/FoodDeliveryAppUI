import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    
    const accountStatement = await screen.findByText('Account Statement');
    expect(accountStatement).toBeInTheDocument();
  });
});
