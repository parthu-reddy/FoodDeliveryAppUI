import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { ToastProvider } from '@/contexts/ToastContext';

const ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_ADMIN_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PAYOUT_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const payoutGet = vi.fn();
const payoutPost = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  ledgerApi: {
    payout: { get: (...args: unknown[]) => payoutGet(...args), post: (...args: unknown[]) => payoutPost(...args) },
    statement: { get: vi.fn().mockResolvedValue({ content: [] }) },
  },
}));

vi.mock('@/lib/tokenStore', () => ({ getUserProfile: () => ({ id: ADMIN_ID }) }));

import PayoutQueue from './money/PayoutQueue';
import PayoutDetail from './money/PayoutDetail';

const wrap = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

const detail = (overrides: Record<string, unknown> = {}) => ({
  id: PAYOUT_ID,
  payeeType: 'RESTAURANT',
  payeeId: '11111111-1111-1111-1111-111111111111',
  payeeDisplayName: 'Kanti Sweets (Kanti)',
  amount: 1200,
  currency: 'INR',
  status: 'DRAFT',
  createdBy: OTHER_ADMIN_ID,
  createdAt: '2026-09-01T10:15:30Z',
  beneficiary: { accountNumberMasked: 'XXXX4321', ifsc: 'HDFC0001', beneficiaryName: 'Kanti Sweets', verified: true },
  lines: [
    { id: 'l1', ledgerEntryId: 'e1', referenceId: 'o1', category: 'ORDER_TOTAL', direction: 'CREDIT', amount: 800, entryCreatedAt: '2026-08-30T09:00:00Z' },
    { id: 'l2', ledgerEntryId: 'e2', referenceId: 'o2', category: 'ORDER_TOTAL', direction: 'CREDIT', amount: 400, entryCreatedAt: '2026-08-31T09:00:00Z' },
  ],
  ...overrides,
});

describe('Admin Payout Workflow', () => {
  beforeEach(() => {
    payoutGet.mockReset();
    payoutPost.mockReset().mockResolvedValue(undefined);
  });

  test('the queue names a resolved payee and shows what they are owed', async () => {
    payoutGet.mockResolvedValue([{
      payeeType: 'RESTAURANT', payeeId: '11111111-1111-1111-1111-111111111111',
      displayName: 'Kanti Sweets (Kanti)', nameResolved: true,
      unsettledAmount: 1200, lineCount: 2, unsettledSince: '2026-08-30T09:00:00Z',
      beneficiaryStatus: { verified: true },
    }]);

    wrap(<PayoutQueue onSelectRow={() => {}} />);

    expect(await screen.findByText('Kanti Sweets (Kanti)')).toBeInTheDocument();
    // Rupees, not paise: 1200 is ₹1,200.00, not ₹12.00.
    expect(screen.getByText('₹1,200.00')).toBeInTheDocument();
    expect(screen.queryByText('Unresolved')).not.toBeInTheDocument();
  });

  test('a payee the owning service could not name is marked unresolved, never given a fake name', async () => {
    payoutGet.mockResolvedValue([{
      payeeType: 'DRIVER', payeeId: '22222222-2222-2222-2222-222222222222',
      displayName: 'DRIVER 22222222-2222-2222-2222-222222222222', nameResolved: false,
      unsettledAmount: 340, lineCount: 1, unsettledSince: '2026-08-30T09:00:00Z',
      beneficiaryStatus: { verified: false },
    }]);

    wrap(<PayoutQueue onSelectRow={() => {}} />);

    expect(await screen.findByText('Unresolved')).toBeInTheDocument();
    expect(screen.queryByText('DRIVER 22222222-2222-2222-2222-222222222222')).not.toBeInTheDocument();
  });

  test('the detail shows the settled lines and they sum to the payout amount', async () => {
    payoutGet.mockResolvedValue(detail());

    wrap(<PayoutDetail payoutId={PAYOUT_ID} onBack={() => {}} />);

    expect(await screen.findByText('Settled Lines (2)')).toBeInTheDocument();
    expect(screen.getByText(/Lines total/)).toBeInTheDocument();
    // 800 + 400 = the 1200 payout, so no mismatch warning.
    expect(screen.queryByText('does not match the payout amount')).not.toBeInTheDocument();
    expect(screen.getByText('Kanti Sweets (Kanti)')).toBeInTheDocument();
    expect(screen.getByText('XXXX4321')).toBeInTheDocument();
  });

  test('lines that do not sum to the payout are called out rather than shown silently', async () => {
    payoutGet.mockResolvedValue(detail({ amount: 5000 }));

    wrap(<PayoutDetail payoutId={PAYOUT_ID} onBack={() => {}} />);

    expect(await screen.findByText('does not match the payout amount')).toBeInTheDocument();
  });

  test('approve is disabled for the administrator who raised the payout', async () => {
    payoutGet.mockResolvedValue(detail({ createdBy: ADMIN_ID }));

    wrap(<PayoutDetail payoutId={PAYOUT_ID} onBack={() => {}} />);

    const approve = await screen.findByRole('button', { name: 'Approve' });
    expect(approve).toBeDisabled();
    fireEvent.click(approve);
    expect(payoutPost).not.toHaveBeenCalled();
  });

  test('approve is offered to a second administrator', async () => {
    payoutGet.mockResolvedValue(detail({ createdBy: OTHER_ADMIN_ID }));

    wrap(<PayoutDetail payoutId={PAYOUT_ID} onBack={() => {}} />);

    const approve = await screen.findByRole('button', { name: 'Approve' });
    expect(approve).toBeEnabled();
  });

  test('marking paid will not proceed without a bank reference', async () => {
    payoutGet.mockResolvedValue(detail({ status: 'APPROVED' }));

    wrap(<PayoutDetail payoutId={PAYOUT_ID} onBack={() => {}} />);

    fireEvent.click(await screen.findByRole('button', { name: /Mark Paid/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm Payment' }));

    await waitFor(() => expect(screen.getByText('Bank reference is required')).toBeInTheDocument());
    expect(payoutPost).not.toHaveBeenCalled();
  });

  test('marking paid sends the bank reference and an idempotency key', async () => {
    payoutGet.mockResolvedValue(detail({ status: 'APPROVED' }));

    wrap(<PayoutDetail payoutId={PAYOUT_ID} onBack={() => {}} />);

    fireEvent.click(await screen.findByRole('button', { name: /Mark Paid/ }));
    fireEvent.change(screen.getByPlaceholderText('e.g. UTR-123456789'), { target: { value: 'UTR-99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Payment' }));

    await waitFor(() => expect(payoutPost).toHaveBeenCalledTimes(1));
    const [path, , opts] = payoutPost.mock.calls[0] as
        [string, unknown, { queries: Record<string, unknown>; headers: Record<string, string> }];
    expect(path).toBe('/api/v1/internal/admin/payouts/:payoutId/mark-paid');
    expect(opts.queries.bankReference).toBe('UTR-99');
    expect(opts.headers['Idempotency-Key']).toBeTruthy();
  });
});
