import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { ToastProvider } from '@/contexts/ToastContext';

const ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const getTickets = vi.fn();
const resolveTicket = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  customerApi: {
    adminRefund: {
      getTickets: (...a: unknown[]) => getTickets(...a),
      resolveTicket: (...a: unknown[]) => resolveTicket(...a),
    },
  },
}));
vi.mock('@/lib/tokenStore', () => ({ getUserProfile: () => ({ id: ADMIN_ID }) }));

import RefundQueue from './money/RefundQueue';

const wrap = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

describe('Admin Refund Queue', () => {
  beforeEach(() => {
    getTickets.mockReset();
    resolveTicket.mockReset().mockResolvedValue(undefined);
  });

  test('lists open refund tickets with the amount at its real value', async () => {
    getTickets.mockResolvedValue({
      content: [{
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        orderId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        customerId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        reason: 'ITEM_MISSING', status: 'OPEN', refundAmount: 275.5,
      }],
      totalPages: 1,
    });

    wrap(<RefundQueue />);

    await waitFor(() => expect(getTickets).toHaveBeenCalled());
    expect(await screen.findByText('₹275.50')).toBeInTheDocument();
  });

  test('reports an empty queue rather than rendering nothing', async () => {
    getTickets.mockResolvedValue({ content: [], totalPages: 1 });

    wrap(<RefundQueue />);

    await waitFor(() => expect(getTickets).toHaveBeenCalled());
    expect(screen.queryByText('₹275.50')).not.toBeInTheDocument();
  });
});
