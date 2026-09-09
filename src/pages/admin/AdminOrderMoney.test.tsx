import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { ToastProvider } from '@/contexts/ToastContext';

const getOrderMoney = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: { adminMoney: { getOrderMoney: (...a: unknown[]) => getOrderMoney(...a) } },
}));

import AdminOrderMoney from './money/AdminOrderMoney';

const wrap = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

describe('Admin Order Money View', () => {
  beforeEach(() => getOrderMoney.mockReset());

  test('shows every party on the order at its real value', async () => {
    getOrderMoney.mockResolvedValue({
      orderId: 'o1',
      foodCost: 400, deliveryFee: 30, customerPlatformFee: 5, sgst: 10, cgst: 10, totalAmount: 455,
      restaurantPayout: 355, restaurantPlatformFee: 25, restaurantDeliveryContribution: 20,
      driverGrossPayout: 50, driverTaxes: 5, driverNetPayout: 45, platformBonus: 0,
      ledgerLines: [],
    });

    wrap(<AdminOrderMoney orderId="o1" />);

    // Rupees: a 455.00 total is ₹455.00, not ₹4.55.
    expect(await screen.findByText('₹455.00')).toBeInTheDocument();
    expect(screen.getByText('₹355.00')).toBeInTheDocument();
    expect(screen.getByText('₹45.00')).toBeInTheDocument();
    expect(screen.getByText('Customer Paid')).toBeInTheDocument();
    expect(screen.getByText('Restaurant Payout')).toBeInTheDocument();
    expect(screen.getByText('Rider Payout')).toBeInTheDocument();
  });

  test('says so when the breakdown cannot be loaded rather than showing zeros', async () => {
    // A breakdown that does not come back must not be rendered as a page of ₹0.00 figures, which
    // an administrator would read as "this order moved no money".
    getOrderMoney.mockResolvedValue(null);

    wrap(<AdminOrderMoney orderId="o1" />);

    expect(await screen.findByText('Failed to load breakdown.')).toBeInTheDocument();
    expect(screen.queryByText('₹0.00')).not.toBeInTheDocument();
  });
});
