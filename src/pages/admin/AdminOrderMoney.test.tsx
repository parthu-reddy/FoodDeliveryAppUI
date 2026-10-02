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
  test('renders real transaction ids on both ledger legs and preserves a signed restaurant balance', async () => {
    const transactionId='e0000000-0000-4000-8000-000000000001';
    const line={transactionId,referenceId:'o1',ownerId:'owner1',ownerType:'RESTAURANT_PAYABLE',
      category:'FOOD_COST',amount:10,createdAt:'2026-10-02T00:00:00Z'};
    getOrderMoney.mockResolvedValue({totalAmount:20,foodCost:10,deliveryFee:5,customerPlatformFee:3,sgst:1,cgst:1,
      restaurantPayout:-5,restaurantPlatformFee:3,restaurantDeliveryContribution:10,platformBonus:2,
      driverGrossPayout:10,driverTaxes:1,driverNetPayout:9,
      ledgerLines:[{...line,accountId:'account1',direction:'DEBIT'},{...line,accountId:'account2',direction:'CREDIT'}]});
    wrap(<AdminOrderMoney orderId="o1" />);
    expect(await screen.findByText('-₹5.00')).toBeInTheDocument();
    expect(screen.getAllByText(transactionId.substring(0,8))).toHaveLength(2);
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    expect(screen.getByText('Platform Bonus Deduction')).toBeInTheDocument();
    expect(screen.getByText('Delivery Taxes (SGST/CGST)')).toBeInTheDocument();
  });

  test('shows missing individual money values as unavailable while preserving an explicit zero', async () => {
    getOrderMoney.mockResolvedValue({totalAmount:100,foodCost:100,deliveryFee:0,sgst:1,
      ledgerLines:[{transactionId:'e0000000-0000-4000-8000-000000000001',accountId:'account1',
        ownerId:'owner1',ownerType:'RESTAURANT_PAYABLE',category:'FOOD_COST',direction:'CREDIT',
        createdAt:'2026-10-02T00:00:00Z'}]});
    wrap(<AdminOrderMoney orderId="o1" />);
    expect((await screen.findAllByText('₹100.00')).length).toBe(3);
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(5);
    expect(screen.getAllByText('₹0.00')).toHaveLength(1);
  });

});
