import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Card } from '../../../shared/ui';
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Money Operations</h1>
      
      <div className="flex space-x-4 mb-6 border-b pb-2">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'rejections' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('rejections')}
        >
          Ledger Rejections
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'reconciliation' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('reconciliation')}
        >
          Reconciliation Runs
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'payment_dlq' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('payment_dlq')}
        >
          Payment DLQ
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'wallet_dlq' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('wallet_dlq')}
        >
          Wallet DLQ
        </button>
      </div>

      {loading && <p>Loading data...</p>}

      {!loading && activeTab === 'rejections' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Rejected Ledger Movements</h2>
          {rejections?.content?.length === 0 ? <p>No unresolved rejections.</p> : (
            rejections?.content?.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm">{r.producer} · {r.eventId}</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">
                    {r.ageMinutes != null ? `${r.ageMinutes} min unresolved` : 'unresolved'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-red-700 mt-1">{r.reason}</p>
                <pre className="text-xs font-mono bg-gray-100 p-2 rounded mt-2 overflow-x-auto whitespace-pre-wrap">{r.payload}</pre>
                {resolvingId === r.id ? (
                  <div className="mt-3 flex gap-2 items-center">
                    <input
                      className="border rounded px-2 py-1 text-sm flex-1"
                      placeholder="Why does this no longer need booking?"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                    />
                    <button
                      className="px-3 py-1 bg-primary text-white rounded text-sm disabled:opacity-50"
                      disabled={!resolutionNote.trim()}
                      onClick={async () => {
                        await RejectionApi.resolve({ note: resolutionNote }, { params: { id: r.id ?? '' } });
                        setResolvingId(null);
                        setResolutionNote('');
                        fetchData();
                      }}
                    >
                      Confirm
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-500" onClick={() => setResolvingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button
                    className="mt-3 px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark"
                    onClick={() => { setResolvingId(r.id ?? null); setResolutionNote(''); }}
                  >
                    Resolve
                  </button>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Reconciliation Runs</h2>
          {reconRuns?.content?.length === 0 ? <p>No runs found.</p> : (
            reconRuns?.content?.map((run) => (
              <Card key={run.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm text-gray-500">{run.id}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${run.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {run.status}
                  </span>
                </div>
                <p className="text-sm">Summary: {run.summary}</p>
                <p className="text-sm text-gray-500 mt-2">Started: {new Date(run.startedAt ?? '').toLocaleString()}</p>
              </Card>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'payment_dlq' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Failed Payment Webhooks</h2>
          {paymentWebhooks?.content?.length === 0 ? <p>No failed webhooks found.</p> : (
            paymentWebhooks?.content?.map((hook) => (
              <Card key={hook.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm">{hook.eventId}</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">{hook.processingStatus}</span>
                </div>
                <p className="text-sm">Gateway: {hook.gatewayName}</p>
                <p className="text-sm font-semibold mt-1">Error: {hook.errorLog}</p>
                <button 
                  className="mt-3 px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark"
                  onClick={async () => {
                    await PaymentDlqApi.retryWebhookEvent(undefined, { params: { eventId: hook.eventId ?? '' } });
                    fetchData();
                  }}
                >
                  Retry Event
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'wallet_dlq' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Wallet Outbox DLQ</h2>
          {walletOutbox?.content?.length === 0 ? <p>No wallet outbox events in DLQ.</p> : (
            walletOutbox?.content?.map((evt) => (
              <Card key={evt.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm">{evt.aggregateType} - {evt.eventType}</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">{evt.status}</span>
                </div>
                <p className="text-sm">Aggregate ID: {evt.aggregateId}</p>
                <p className="text-sm text-red-600 mt-1">{evt.errorMessage}</p>
                <button 
                  className="mt-3 px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark"
                  onClick={async () => {
                    await WalletDlqApi.retryOutboxDlqEvent(undefined, { params: { eventId: evt.id ?? '' } });
                    fetchData();
                  }}
                >
                  Retry Event
                </button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
