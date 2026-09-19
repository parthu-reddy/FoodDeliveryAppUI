import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatementTable } from './StatementTable';

describe('StatementTable', () => {
  it('announces loading rather than printing it as body text', () => {
    // Was a bare "Loading statement..." text node. It is the shared spinner now, which
    // carries role=status, so assistive technology is told a table is loading instead of
    // reading a sentence that happens to be sitting where the rows will go.
    render(<StatementTable rows={[]} isLoading={true} />);
    expect(screen.getByRole('status', { name: 'Loading Statement' })).toBeInTheDocument();
  });

  it('names the table for assistive technology', () => {
    render(<StatementTable rows={[{ id: '1', date: '2026-09-01T12:00:00Z', description: 'x', debit: 0, credit: 1 }]} />);
    expect(screen.getByRole('table', { name: 'Statement' })).toBeInTheDocument();
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
