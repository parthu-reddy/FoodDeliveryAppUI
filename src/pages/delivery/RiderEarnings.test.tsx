import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiderEarnings from './RiderEarnings';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
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
          createdAt: new Date().toISOString()
        }
      }),
      fetchStatement_1: vi.fn().mockResolvedValue({
        content: [],
        totalPages: 1
      })
    }
  }
}));

describe('RiderEarnings', () => {
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
    
    const accountStatement = await screen.findByText('Account Statement');
    expect(accountStatement).toBeInTheDocument();
  });
});
