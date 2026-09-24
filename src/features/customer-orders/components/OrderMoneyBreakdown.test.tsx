import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderMoneyBreakdown } from './OrderMoneyBreakdown';

const base = { itemTotal: 580, deliveryFee: 30, customerPlatformFee: 5, sgst: 14.5, cgst: 14.5 };

describe('OrderMoneyBreakdown', () => {
  it('lists the rider tip, so the lines add up to the total paid', () => {
    render(<OrderMoneyBreakdown order={{ ...base, tipAmount: 20, totalAmount: 664 }} />);
    expect(screen.getByText('Rider tip')).toBeInTheDocument();
  });

  it('has no tip line without a tip', () => {
    render(<OrderMoneyBreakdown order={{ ...base, totalAmount: 644 }} />);
    expect(screen.queryByText('Rider tip')).not.toBeInTheDocument();
  });
});
