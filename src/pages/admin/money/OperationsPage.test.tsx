import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@shared/ui';

const getRuns = vi.fn();
const listRejections = vi.fn();
const resolveRejection = vi.fn();
const getFailedWebhooks = vi.fn();
const retryWebhookEvent = vi.fn();
const getOutboxDlqEvents = vi.fn();
const retryOutboxDlqEvent = vi.fn();
const getFailedRefunds = vi.fn();
const retryRefund = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  customerApi: {
    adminDlq: {
      getFailedRefunds: (...a: unknown[]) => getFailedRefunds(...a),
      retryRefund: (...a: unknown[]) => retryRefund(...a),
    },
  },
  ledgerApi: {
    adminLedgerRejection: {
      list: (...a: unknown[]) => listRejections(...a),
      resolve: (...a: unknown[]) => resolveRejection(...a),
    },
    reconciliation: { getRuns: (...a: unknown[]) => getRuns(...a) },
  },
  paymentApi: {
    adminDlq: {
      getFailedWebhooks: (...a: unknown[]) => getFailedWebhooks(...a),
      retryWebhookEvent: (...a: unknown[]) => retryWebhookEvent(...a),
    },
  },
  walletApi: {
    adminDlq: {
      getOutboxDlqEvents: (...a: unknown[]) => getOutboxDlqEvents(...a),
      retryOutboxDlqEvent: (...a: unknown[]) => retryOutboxDlqEvent(...a),
    },
  },
}));

import OperationsPage from './OperationsPage';

const renderPage = () => render(
  <ToastProvider>
    <ConfirmProvider>
      <OperationsPage />
    </ConfirmProvider>
  </ToastProvider>,
);

/**
 * The page an operator works when money is stuck. Every tab must show what is stuck and offer the
 * action that clears it.
 */
describe('OperationsPage', () => {
  beforeEach(() => {
    getRuns.mockReset().mockResolvedValue({ content: [] });
    listRejections.mockReset().mockResolvedValue({ content: [] });
    resolveRejection.mockReset().mockResolvedValue(undefined);
    getFailedWebhooks.mockReset().mockResolvedValue({ content: [] });
    getOutboxDlqEvents.mockReset().mockResolvedValue({ content: [] });
    retryWebhookEvent.mockReset().mockResolvedValue(undefined);
    retryOutboxDlqEvent.mockReset().mockResolvedValue(undefined);
    getFailedRefunds.mockReset().mockResolvedValue({ content: [] });
    retryRefund.mockReset().mockResolvedValue({ success: true });
  });

  it('opens on ledger rejections, because that is where money goes missing', async () => {
    renderPage();
    expect(await screen.findByText('Rejected Ledger Movements')).toBeInTheDocument();
    await waitFor(() => expect(listRejections).toHaveBeenCalled());
  });

  it('shows a rejection with its reason, payload and age', async () => {
    listRejections.mockResolvedValue({ content: [{
      id: 'r-1', eventId: 'evt-1', producer: 'customer-application',
      reason: 'transactionId is not derivable from (producer, reference, leg)',
      payload: '{"transactionId":"0000"}', ageMinutes: 185,
    }]});

    renderPage();

    expect(await screen.findByText(/customer-application/)).toBeInTheDocument();
    expect(screen.getByText('transactionId is not derivable from (producer, reference, leg)')).toBeInTheDocument();
    expect(screen.getByText('185 min unresolved')).toBeInTheDocument();
  });

  it('will not resolve a rejection without a note', async () => {
    listRejections.mockResolvedValue({ content: [{
      id: 'r-1', eventId: 'evt-1', producer: 'customer-application', reason: 'boom', payload: '{}', ageMinutes: 5,
    }]});

    renderPage();
    fireEvent.click(await screen.findByText('Resolve'));

    const confirm = screen.getByText('Confirm');
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(resolveRejection).not.toHaveBeenCalled();
  });

  it('resolves a rejection with the note the operator typed', async () => {
    listRejections.mockResolvedValue({ content: [{
      id: 'r-1', eventId: 'evt-1', producer: 'customer-application', reason: 'boom', payload: '{}', ageMinutes: 5,
    }]});

    renderPage();
    fireEvent.click(await screen.findByText('Resolve'));
    fireEvent.change(screen.getByPlaceholderText('Why does this no longer need booking?'),
      { target: { value: 'replayed by the producer' } });
    fireEvent.click(screen.getByText('Confirm'));
    fireEvent.click(await screen.findByRole('button', { name: 'Resolve movement' }));

    await waitFor(() => expect(resolveRejection).toHaveBeenCalledTimes(1));
    const [body, opts] = resolveRejection.mock.calls[0] as [{ note: string }, { params: { id: string } }];
    expect(body.note).toBe('replayed by the producer');
    expect(opts.params.id).toBe('r-1');
  });

  it('shows reconciliation runs on its own tab', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Reconciliation Runs'));
    expect(await screen.findByText('Recent Reconciliation Runs')).toBeInTheDocument();
    await waitFor(() => expect(getRuns).toHaveBeenCalled());
  });

  it('shows a partial run as a failure, not as success', async () => {
    getRuns.mockResolvedValue({ content: [
      { id: 'r1', status: 'PARTIAL', summary: 'gateway check failed', startedAt: '2026-09-07T01:00:00Z' },
    ]});

    renderPage();
    fireEvent.click(screen.getByText('Reconciliation Runs'));

    // Asserted on the semantic tone, not a utility class. This test previously pinned
    // `bg-rose-100`, then `bg-red-100` before that — it has now been rewritten twice because
    // it was testing how the pill was painted rather than what it means.
    const status = await screen.findByText('PARTIAL');
    expect(status.closest('[data-tone]')).toHaveAttribute('data-tone', 'danger');
  });

  it('shows a successful run in green', async () => {
    getRuns.mockResolvedValue({ content: [
      { id: 'r2', status: 'SUCCESS', summary: 'clean', startedAt: '2026-09-07T01:00:00Z' },
    ]});

    renderPage();
    fireEvent.click(screen.getByText('Reconciliation Runs'));

    const status = await screen.findByText('SUCCESS');
    expect(status.closest('[data-tone]')).toHaveAttribute('data-tone', 'success');
  });

  it('says when there is nothing stuck rather than showing a blank panel', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Reconciliation Runs'));
    expect(await screen.findByText('No runs found.')).toBeInTheDocument();
  });

  it('lists failed payment webhooks with the gateway and the error', async () => {
    getFailedWebhooks.mockResolvedValue({ content: [
      { id: 'w1', eventId: 'evt_1', processingStatus: 'DEAD_LETTER', gatewayName: 'RAZORPAY', errorLog: 'signature mismatch' },
    ]});

    renderPage();
    fireEvent.click(screen.getByText('Payment DLQ'));

    expect(await screen.findByText('evt_1')).toBeInTheDocument();
    expect(screen.getByText('Gateway: RAZORPAY')).toBeInTheDocument();
    expect(screen.getByText('Error: signature mismatch')).toBeInTheDocument();
  });

  it('retries a dead-lettered webhook by its event id and refreshes', async () => {
    getFailedWebhooks.mockResolvedValue({ content: [
      { id: 'w1', eventId: 'evt_1', processingStatus: 'DEAD_LETTER', gatewayName: 'RAZORPAY', errorLog: 'boom' },
    ]});

    renderPage();
    fireEvent.click(screen.getByText('Payment DLQ'));
    fireEvent.click(await screen.findByText('Retry Event'));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry webhook' }));

    await waitFor(() => expect(retryWebhookEvent).toHaveBeenCalledTimes(1));
    expect((retryWebhookEvent.mock.calls[0][1] as { params: { eventId: string } }).params.eventId).toBe('evt_1');
  });

  it('lists wallet outbox events stuck in the DLQ', async () => {
    getOutboxDlqEvents.mockResolvedValue({ content: [
      { id: 'o1', aggregateType: 'WALLET', eventType: 'WALLET_DEBITED', status: 'DLQ', aggregateId: 'agg-1', errorMessage: 'ledger unreachable' },
    ]});

    renderPage();
    fireEvent.click(screen.getByText('Wallet DLQ'));

    expect(await screen.findByText('WALLET - WALLET_DEBITED')).toBeInTheDocument();
    expect(screen.getByText('ledger unreachable')).toBeInTheDocument();
  });

  it('retries a wallet outbox event by its id', async () => {
    getOutboxDlqEvents.mockResolvedValue({ content: [
      { id: 'o1', aggregateType: 'WALLET', eventType: 'WALLET_DEBITED', status: 'DLQ', aggregateId: 'agg-1', errorMessage: 'boom' },
    ]});

    renderPage();
    fireEvent.click(screen.getByText('Wallet DLQ'));
    fireEvent.click(await screen.findByText('Retry Event'));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry outbox event' }));

    await waitFor(() => expect(retryOutboxDlqEvent).toHaveBeenCalledTimes(1));
    expect((retryOutboxDlqEvent.mock.calls[0][1] as { params: { eventId: string } }).params.eventId).toBe('o1');
  });

  it('surfaces a fetch failure to the operator', async () => {
    listRejections.mockRejectedValue(new Error('ledger service is unavailable'));

    renderPage();

    expect(await screen.findByText('ledger service is unavailable')).toBeInTheDocument();
  });

  it('keeps a rejected movement open and shows the mutation failure', async () => {
    listRejections.mockResolvedValue({ content: [{
      id: 'r-1', eventId: 'evt-1', producer: 'customer-application', reason: 'boom', payload: '{}', ageMinutes: 5,
    }]});
    resolveRejection.mockRejectedValue(new Error('resolution was rejected by the ledger'));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Resolve' }));
    fireEvent.change(screen.getByPlaceholderText('Why does this no longer need booking?'), {
      target: { value: 'confirmed in the reconciliation record' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Resolve movement' }));

    expect(await screen.findByText('resolution was rejected by the ledger')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Why does this no longer need booking?')).toHaveValue(
      'confirmed in the reconciliation record',
    );
  });

  it('does not retry a webhook until the operator confirms the action', async () => {
    getFailedWebhooks.mockResolvedValue({ content: [
      { id: 'w1', eventId: 'evt_1', processingStatus: 'DEAD_LETTER', gatewayName: 'RAZORPAY', errorLog: 'boom' },
    ]});

    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Payment DLQ' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry Event' }));

    expect(retryWebhookEvent).not.toHaveBeenCalled();
    expect(await screen.findByRole('dialog', { name: 'Retry payment webhook?' })).toBeInTheDocument();
  });

  it('prevents a duplicate webhook retry while the request is pending', async () => {
    getFailedWebhooks.mockResolvedValue({ content: [
      { id: 'w1', eventId: 'evt_1', processingStatus: 'DEAD_LETTER', gatewayName: 'RAZORPAY', errorLog: 'boom' },
    ]});
    let finishRetry: (() => void) | undefined;
    retryWebhookEvent.mockImplementation(() => new Promise<void>((resolve) => { finishRetry = resolve; }));

    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Payment DLQ' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry Event' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry webhook' }));

    const retryButton = await screen.findByRole('button', { name: 'Retrying payment webhook' });
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveAttribute('aria-busy', 'true');

    finishRetry?.();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry Event' })).toBeEnabled());
  });

  it('surfaces a failed wallet retry instead of silently leaving it in the queue', async () => {
    getOutboxDlqEvents.mockResolvedValue({ content: [
      { id: 'o1', aggregateType: 'WALLET', eventType: 'WALLET_DEBITED', status: 'DLQ', aggregateId: 'agg-1', errorMessage: 'boom' },
    ]});
    retryOutboxDlqEvent.mockRejectedValue(new Error('wallet publisher is unavailable'));

    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Wallet DLQ' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry Event' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry outbox event' }));

    expect(await screen.findByText('wallet publisher is unavailable')).toBeInTheDocument();
  });

  describe('failed refunds', () => {
    const failed = { refundId: 'r-1', orderId: 'o-1', amount: 1.13, status: 'FAILED', errorMessage: 'Gateway rejected refund initiation', createdAt: '2026-10-03T02:00:00Z' };

    it('lists a failed refund with its amount, order and reason', async () => {
      getFailedRefunds.mockResolvedValue({ content: [failed] });
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: 'Failed Refunds' }));

      expect(await screen.findByText('Refund r-1')).toBeInTheDocument();
      expect(screen.getByText('Order o-1')).toBeInTheDocument();
      expect(screen.getByText('Gateway rejected refund initiation')).toBeInTheDocument();
      expect(getFailedRefunds).toHaveBeenCalledWith({ queries: { page: 0, size: 50 } });
    });

    it('retries the exact refund only after the operator confirms, then refreshes', async () => {
      getFailedRefunds.mockResolvedValue({ content: [failed] });
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: 'Failed Refunds' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Retry Refund' }));

      expect(retryRefund).not.toHaveBeenCalled();
      expect(await screen.findByRole('dialog', { name: 'Retry refund of ₹1.13?' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Retry refund' }));

      await waitFor(() => expect(retryRefund).toHaveBeenCalledTimes(1));
      expect((retryRefund.mock.calls[0][1] as { params: { refundId: string } }).params.refundId).toBe('r-1');
      await waitFor(() => expect(getFailedRefunds).toHaveBeenCalledTimes(2));
    });

    it('says when no refund has failed', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: 'Failed Refunds' }));
      expect(await screen.findByText('No failed refunds.')).toBeInTheDocument();
    });

    it('surfaces a refused retry instead of looking queued', async () => {
      getFailedRefunds.mockResolvedValue({ content: [failed] });
      retryRefund.mockRejectedValue(new Error('REFUND_EXCEEDS_REMAINING'));
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: 'Failed Refunds' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Retry Refund' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Retry refund' }));

      expect(await screen.findByText(/REFUND_EXCEEDS_REMAINING|Failed to retry refund/)).toBeInTheDocument();
      expect(screen.queryByText('Refund retry queued; completion is pending.')).not.toBeInTheDocument();
    });
  });
});
