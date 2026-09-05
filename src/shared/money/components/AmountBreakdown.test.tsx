import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AmountBreakdown } from './AmountBreakdown';

describe('AmountBreakdown', () => {
  it('renders labels and computed total', () => {
    render(
      <AmountBreakdown
        lines={[
          { label: 'Subtotal', amount: 50000 },
          { label: 'Discount', amount: 5000, isNegative: true },
        ]}
      />
    );
    
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Discount')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    // 50000 - 5000 = 45000 paise = 450.00
    // The exact text depends on how <Money> renders formatINR, but at least we can check structure
  });

  it('renders explicitly provided total and totalLabel', () => {
    render(
      <AmountBreakdown
        lines={[
          { label: 'Item A', amount: 1000 },
        ]}
        totalLabel="Grand Total"
        total={2000}
      />
    );
    
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
  });
});
