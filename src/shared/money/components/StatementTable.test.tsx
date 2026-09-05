import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatementTable } from './StatementTable';

describe('StatementTable', () => {
  it('renders loading state', () => {
    render(<StatementTable rows={[]} isLoading={true} />);
    expect(screen.getByText('Loading statement...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<StatementTable rows={[]} />);
    expect(screen.getByText('No transactions found for this period.')).toBeInTheDocument();
  });

  it('renders rows with date, description, debit, credit and balance', () => {
    render(
      <StatementTable
        rows={[
          {
            id: '1',
            date: '2026-09-01T12:00:00Z',
            description: 'Payout Transfer',
            referenceId: 'TXN123',
            debit: 50000,
            credit: 0,
            runningBalance: 0
          }
        ]}
      />
    );

    expect(screen.getByText('Payout Transfer')).toBeInTheDocument();
    expect(screen.getByText('Ref: TXN123')).toBeInTheDocument();
  });
});
