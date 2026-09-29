import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastContext';

const statementGet = vi.fn();
const payoutGet = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  ledgerApi: {
    ledgerStatement: { get: (...args: unknown[]) => statementGet(...args) },
    payout: { get: (...args: unknown[]) => payoutGet(...args) },
  },
}));

import PayoutDrawer from './PayoutDrawer';

const PAYEE_ID = 'a0000000-0000-4000-8000-000000000001';
const ORDER_ID = 'a0000000-0000-4000-8000-000000000002';
const PAYOUT_ID = 'a0000000-0000-4000-8000-000000000003';

const account = {
  payeeType: 'RESTAURANT',
  payeeId: PAYEE_ID,
  displayName: 'Fixture Kitchen',
  nameResolved: true,
  unsettledAmount: 120.5,
  lineCount: 2,
  beneficiaryStatus: { verified: true },
};

describe('PayoutDrawer order-money links', () => {
  beforeEach(() => {
    statementGet.mockReset().mockResolvedValue({
      content: [
        {
          transactionId: 'a0000000-0000-4000-8000-000000000011',
          referenceId: ORDER_ID,
          accountId: 'a0000000-0000-4000-8000-000000000012',
          ownerId: PAYEE_ID,
          ownerType: 'RESTAURANT_PAYABLE',
          category: 'FOOD_COST',
          amount: 120.5,
          direction: 'CREDIT',
          createdAt: '2026-09-29T00:00:00Z',
          description: 'Order food proceeds',
        },
        {
          transactionId: 'a0000000-0000-4000-8000-000000000013',
          referenceId: PAYOUT_ID,
          accountId: 'a0000000-0000-4000-8000-000000000012',
          ownerId: PAYEE_ID,
          ownerType: 'RESTAURANT_PAYABLE',
          category: 'PAYOUT_TRANSFER',
          amount: 120.5,
          direction: 'DEBIT',
          createdAt: '2026-09-29T00:01:00Z',
          description: 'Payout CREATE',
        },
      ],
    });
    payoutGet.mockReset().mockResolvedValue({ content: [] });
  });

  test('links a UUID order reference and leaves a payout-transfer UUID as plain text', async () => {
    render(
      <ToastProvider>
        <PayoutDrawer account={account} onClose={() => {}} onPayoutCreated={() => {}} />
      </ToastProvider>,
    );

    const orderReference = await screen.findByRole('link', { name: `Ref: ${ORDER_ID}` });
    expect(orderReference).toHaveAttribute('href', `/admin/orders/${ORDER_ID}/money`);

    expect(screen.queryByRole('link', { name: `Ref: ${PAYOUT_ID}` })).not.toBeInTheDocument();
    expect(screen.getByText(`Ref: ${PAYOUT_ID}`)).toBeInTheDocument();
  });
});
