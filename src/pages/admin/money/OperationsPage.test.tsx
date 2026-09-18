import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

const getRuns = vi.fn();
const listRejections = vi.fn();
const resolveRejection = vi.fn();
const getFailedWebhooks = vi.fn();
const retryWebhookEvent = vi.fn();
const getOutboxDlqEvents = vi.fn();
const retryOutboxDlqEvent = vi.fn();

// Spread the real module: the generated facades import createApiClient from these files, so
// replacing them wholesale breaks every unrelated client at import time.
vi.mock('../../../api/generated/schemas/ledger/admin_ledger_rejection_controller', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Admin_ledger_rejection_controllerApi: {
    list: (...a: unknown[]) => listRejections(...a),
    resolve: (...a: unknown[]) => resolveRejection(...a),
  },
}));
vi.mock('../../../api/generated/schemas/ledger/reconciliation_controller', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Reconciliation_controllerApi: { getRuns: (...a: unknown[]) => getRuns(...a) },
}));
vi.mock('../../../api/generated/schemas/payment/admin_dlq_controller', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Admin_dlq_controllerApi: {
    getFailedWebhooks: (...a: unknown[]) => getFailedWebhooks(...a),
    retryWebhookEvent: (...a: unknown[]) => retryWebhookEvent(...a),
  },
}));
vi.mock('../../../api/generated/schemas/wallet/admin_dlq_controller', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Admin_dlq_controllerApi: {
    getOutboxDlqEvents: (...a: unknown[]) => getOutboxDlqEvents(...a),
    retryOutboxDlqEvent: (...a: unknown[]) => retryOutboxDlqEvent(...a),
  },
}));

import OperationsPage from './OperationsPage';

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
  });

  it('opens on ledger rejections, because that is where money goes missing', async () => {
    render(<OperationsPage />);
    expect(await screen.findByText('Rejected Ledger Movements')).toBeInTheDocument();
    await waitFor(() => expect(listRejections).toHaveBeenCalled());
  });

  it('shows a rejection with its reason, payload and age', async () => {
    listRejections.mockResolvedValue({ content: [{
      id: 'r-1', eventId: 'evt-1', producer: 'customer-application',
      reason: 'transactionId is not derivable from (producer, reference, leg)',
      payload: '{"transactionId":"0000"}', ageMinutes: 185,
    }]});

    render(<OperationsPage />);

    expect(await screen.findByText(/customer-application/)).toBeInTheDocument();
    expect(screen.getByText('transactionId is not derivable from (producer, reference, leg)')).toBeInTheDocument();
    expect(screen.getByText('185 min unresolved')).toBeInTheDocument();
  });

  it('will not resolve a rejection without a note', async () => {
    listRejections.mockResolvedValue({ content: [{
      id: 'r-1', eventId: 'evt-1', producer: 'customer-application', reason: 'boom', payload: '{}', ageMinutes: 5,
    }]});

    render(<OperationsPage />);
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

    render(<OperationsPage />);
    fireEvent.click(await screen.findByText('Resolve'));
    fireEvent.change(screen.getByPlaceholderText('Why does this no longer need booking?'),
      { target: { value: 'replayed by the producer' } });
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => expect(resolveRejection).toHaveBeenCalledTimes(1));
    const [body, opts] = resolveRejection.mock.calls[0] as [{ note: string }, { params: { id: string } }];
    expect(body.note).toBe('replayed by the producer');
    expect(opts.params.id).toBe('r-1');
  });

  it('shows reconciliation runs on its own tab', async () => {
    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Reconciliation Runs'));
    expect(await screen.findByText('Recent Reconciliation Runs')).toBeInTheDocument();
    await waitFor(() => expect(getRuns).toHaveBeenCalled());
  });

  it('shows a partial run as a failure, not as success', async () => {
    getRuns.mockResolvedValue({ content: [
      { id: 'r1', status: 'PARTIAL', summary: 'gateway check failed', startedAt: '2026-09-07T01:00:00Z' },
    ]});

    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Reconciliation Runs'));

    const status = await screen.findByText('PARTIAL');
    expect(status.className).toContain('bg-rose-100');
  });

  it('shows a successful run in green', async () => {
    getRuns.mockResolvedValue({ content: [
      { id: 'r2', status: 'SUCCESS', summary: 'clean', startedAt: '2026-09-07T01:00:00Z' },
    ]});

    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Reconciliation Runs'));

    const status = await screen.findByText('SUCCESS');
    expect(status.className).toContain('bg-amber-100');
  });

  it('says when there is nothing stuck rather than showing a blank panel', async () => {
    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Reconciliation Runs'));
    expect(await screen.findByText('No runs found.')).toBeInTheDocument();
  });

  it('lists failed payment webhooks with the gateway and the error', async () => {
    getFailedWebhooks.mockResolvedValue({ content: [
      { id: 'w1', eventId: 'evt_1', processingStatus: 'DEAD_LETTER', gatewayName: 'RAZORPAY', errorLog: 'signature mismatch' },
    ]});

    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Payment DLQ'));

    expect(await screen.findByText('evt_1')).toBeInTheDocument();
    expect(screen.getByText('Gateway: RAZORPAY')).toBeInTheDocument();
    expect(screen.getByText('Error: signature mismatch')).toBeInTheDocument();
  });

  it('retries a dead-lettered webhook by its event id and refreshes', async () => {
    getFailedWebhooks.mockResolvedValue({ content: [
      { id: 'w1', eventId: 'evt_1', processingStatus: 'DEAD_LETTER', gatewayName: 'RAZORPAY', errorLog: 'boom' },
    ]});

    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Payment DLQ'));
    fireEvent.click(await screen.findByText('Retry Event'));

    await waitFor(() => expect(retryWebhookEvent).toHaveBeenCalledTimes(1));
    expect((retryWebhookEvent.mock.calls[0][1] as { params: { eventId: string } }).params.eventId).toBe('evt_1');
  });

  it('lists wallet outbox events stuck in the DLQ', async () => {
    getOutboxDlqEvents.mockResolvedValue({ content: [
      { id: 'o1', aggregateType: 'WALLET', eventType: 'WALLET_DEBITED', status: 'DLQ', aggregateId: 'agg-1', errorMessage: 'ledger unreachable' },
    ]});

    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Wallet DLQ'));

    expect(await screen.findByText('WALLET - WALLET_DEBITED')).toBeInTheDocument();
    expect(screen.getByText('ledger unreachable')).toBeInTheDocument();
  });

  it('retries a wallet outbox event by its id', async () => {
    getOutboxDlqEvents.mockResolvedValue({ content: [
      { id: 'o1', aggregateType: 'WALLET', eventType: 'WALLET_DEBITED', status: 'DLQ', aggregateId: 'agg-1', errorMessage: 'boom' },
    ]});

    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Wallet DLQ'));
    fireEvent.click(await screen.findByText('Retry Event'));

    await waitFor(() => expect(retryOutboxDlqEvent).toHaveBeenCalledTimes(1));
    expect((retryOutboxDlqEvent.mock.calls[0][1] as { params: { eventId: string } }).params.eventId).toBe('o1');
  });
});
