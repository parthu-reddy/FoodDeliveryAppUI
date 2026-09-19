import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Button, Input, StatusPill, Surface } from '@shared/ui';
import { Reconciliation_controllerApi, PageReconciliationRun } from '../../../api/generated/schemas/ledger/reconciliation_controller';
import { Admin_dlq_controllerApi as PaymentDlqApi, PageResponseDtoWebhookDelivery } from '../../../api/generated/schemas/payment/admin_dlq_controller';
import { Admin_dlq_controllerApi as WalletDlqApi, PageResponseDtoOutboxEventEntity as WalletOutboxPage } from '../../../api/generated/schemas/wallet/admin_dlq_controller';
import { Admin_ledger_rejection_controllerApi as RejectionApi, PageResponseDtoLedgerRejectionDto } from '../../../api/generated/schemas/ledger/admin_ledger_rejection_controller';

export default function OperationsPage() {
  // Rejections first: a rejected ledger movement is money that was never booked, and since the
  // DLT path was changed to record one instead of publishing to a topic nobody consumed, this is
  // the only place a lost ledger event appears.
  const [activeTab, setActiveTab] = useState<'rejections' | 'reconciliation' | 'payment_dlq' | 'wallet_dlq'>('rejections');
  const [rejections, setRejections] = useState<z.infer<typeof PageResponseDtoLedgerRejectionDto> | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [reconRuns, setReconRuns] = useState<z.infer<typeof PageReconciliationRun> | null>(null);
  const [paymentWebhooks, setPaymentWebhooks] = useState<z.infer<typeof PageResponseDtoWebhookDelivery> | null>(null);
  const [walletOutbox, setWalletOutbox] = useState<z.infer<typeof WalletOutboxPage> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'rejections') {
        const res = await RejectionApi.list({ queries: { resolved: false, page: 0, size: 50 } });
        setRejections(res);
      } else if (activeTab === 'reconciliation') {
        const res = await Reconciliation_controllerApi.getRuns({ queries: { pageable: {} } });
        setReconRuns(res);
      } else if (activeTab === 'payment_dlq') {
        const res = await PaymentDlqApi.getFailedWebhooks({});
        setPaymentWebhooks(res);
      } else if (activeTab === 'wallet_dlq') {
        const res = await WalletDlqApi.getOutboxDlqEvents({});
        setWalletOutbox(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    // A fetch on mount sets its loading flag synchronously; see PayoutQueue for the same note.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const TABS = [
    ['rejections', 'Ledger Rejections'],
    ['reconciliation', 'Reconciliation Runs'],
    ['payment_dlq', 'Payment DLQ'],
    ['wallet_dlq', 'Wallet DLQ'],
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-ink)' }}>
        Money Operations
      </h1>

      <div
        className="flex gap-1 mb-6 pb-2"
        role="tablist"
        style={{ borderBottom: '1px solid var(--color-paper-line)' }}
      >
        {TABS.map(([key, label]) => (
          <Button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            variant={activeTab === key ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--color-ink-2)' }}>Loading data&hellip;</p>}

      {!loading && activeTab === 'rejections' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Rejected Ledger Movements</h2>
          {rejections?.content?.length === 0 ? <p>No unresolved rejections.</p> : (
            rejections?.content?.map((r) => (
              <Surface key={r.id} radius="lg" elevation={1} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm">{r.producer} · {r.eventId}</span>
                  <StatusPill
                    tone="danger"
                    label={r.ageMinutes != null ? `${r.ageMinutes} min unresolved` : 'unresolved'}
                  />
                </div>
                <p className="text-sm font-semibold text-rose-700 mt-1">{r.reason}</p>
                <Surface variant="sunken" radius="sm" elevation={0} className="mt-2 p-2 overflow-x-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: 'var(--color-ink-2)' }}>{r.payload}</pre>
                </Surface>
                {resolvingId === r.id ? (
                  <div className="mt-3 flex gap-2 items-center">
                    <Input
                      className="flex-1"
                      aria-label="Why this no longer needs booking"
                      placeholder="Why does this no longer need booking?"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!resolutionNote.trim()}
                      onClick={async () => {
                        await RejectionApi.resolve({ note: resolutionNote }, { params: { id: r.id ?? '' } });
                        setResolvingId(null);
                        setResolutionNote('');
                        fetchData();
                      }}
                    >
                      Confirm
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setResolvingId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() => { setResolvingId(r.id ?? null); setResolutionNote(''); }}
                  >
                    Resolve
                  </Button>
                )}
              </Surface>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Reconciliation Runs</h2>
          {reconRuns?.content?.length === 0 ? <p>No runs found.</p> : (
            reconRuns?.content?.map((run) => (
              <Surface key={run.id} radius="lg" elevation={1} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm text-slate-500">{run.id}</span>
                  <StatusPill
                    tone={run.status === 'SUCCESS' ? 'success' : 'danger'}
                    label={String(run.status)}
                  />
                </div>
                <p className="text-sm">Summary: {run.summary}</p>
                <p className="text-sm text-slate-500 mt-2">Started: {new Date(run.startedAt ?? '').toLocaleString()}</p>
              </Surface>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'payment_dlq' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Failed Payment Webhooks</h2>
          {paymentWebhooks?.content?.length === 0 ? <p>No failed webhooks found.</p> : (
            paymentWebhooks?.content?.map((hook) => (
              <Surface key={hook.id} radius="lg" elevation={1} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm">{hook.eventId}</span>
                  <StatusPill tone="danger" label={String(hook.processingStatus)} />
                </div>
                <p className="text-sm">Gateway: {hook.gatewayName}</p>
                <p className="text-sm font-semibold mt-1">Error: {hook.errorLog}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={async () => {
                    await PaymentDlqApi.retryWebhookEvent(undefined, { params: { eventId: hook.eventId ?? '' } });
                    fetchData();
                  }}
                >
                  Retry Event
                </Button>
              </Surface>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'wallet_dlq' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Wallet Outbox DLQ</h2>
          {walletOutbox?.content?.length === 0 ? <p>No wallet outbox events in DLQ.</p> : (
            walletOutbox?.content?.map((evt) => (
              <Surface key={evt.id} radius="lg" elevation={1} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm">{evt.aggregateType} - {evt.eventType}</span>
                  <StatusPill tone="danger" label={String(evt.status)} />
                </div>
                <p className="text-sm">Aggregate ID: {evt.aggregateId}</p>
                <p className="text-sm text-rose-600 mt-1">{evt.errorMessage}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={async () => {
                    await WalletDlqApi.retryOutboxDlqEvent(undefined, { params: { eventId: evt.id ?? '' } });
                    fetchData();
                  }}
                >
                  Retry Event
                </Button>
              </Surface>
            ))
          )}
        </div>
      )}
    </div>
  );
}
