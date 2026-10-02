import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderRefundState } from './OrderRefundState';
import type { RefundView } from '@/types';

describe('authoritative refund status', () => {
  it('shows a failed read and retries without pretending it is an empty successful read', () => {
    let retries = 0;
    render(<OrderRefundState refunds={[]} error="Could not refresh refund details. Please retry."
      retry={() => { retries++; }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not refresh');
    fireEvent.click(screen.getByRole('button', { name: 'Retry refund details' }));
    expect(retries).toBe(1);
    expect(screen.queryByText(/Returned to/)).not.toBeInTheDocument();
  });
  it.each(['REQUESTED', 'PROCESSING', 'FAILED', 'CANCELLED'] as const)('%s never claims money returned', status => {
    render(<OrderRefundState refunds={[{ id: 'r1', amount: 120.5, status, destination: 'ORIGINAL_METHOD' }]} />);
    expect(screen.getByTestId('refund-state')).toHaveTextContent('₹120.50');
    expect(screen.getByTestId('refund-state')).toHaveTextContent(status);
    expect(screen.queryByText(/^Returned to/)).not.toBeInTheDocument();
  });
  it.each(['STORE_CREDIT', 'ORIGINAL_METHOD'] as const)('completed money shows its %s destination', destination => {
    render(<OrderRefundState refunds={[{ id: 'r1', amount: 120.5, status: 'COMPLETED', destination }]} />);
    expect(screen.getByTestId('refund-state')).toHaveTextContent(destination === 'STORE_CREDIT'
      ? 'Returned to your wallet as store credit' : 'Returned to your original payment method');
  });
  it('missing money or destination is unavailable without inventing zero or a return', () => {
    render(<OrderRefundState refunds={[{ id: 'r1', status: 'COMPLETED' } as RefundView]} />);
    expect(screen.getByTestId('refund-state')).toHaveTextContent('Amount unavailable');
    expect(screen.getByTestId('refund-state')).toHaveTextContent('Refund details unavailable');
    expect(screen.queryByText(/₹0/)).not.toBeInTheDocument();
  });
});
