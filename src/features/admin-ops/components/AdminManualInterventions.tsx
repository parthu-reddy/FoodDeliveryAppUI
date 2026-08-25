import { useToast } from "@/contexts/ToastContext";
import { usePolling } from "@/hooks/usePolling";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi, deliveryApi } from "@/lib/zodiosClients";
import { Button, Textarea } from '@shared/ui';
import { Shield, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { asUntyped, WirePage } from '../../../lib/untypedResponse';

export default function AdminManualInterventions() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'DISPATCH' | 'FINANCIAL'>('DISPATCH');
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [interventionsPage, setInterventionsPage] = useState(0);
  const [interventionsTotalPages, setInterventionsTotalPages] = useState(1);

  const [refundsPage, setRefundsPage] = useState(0);
  const [refundsTotalPages, setRefundsTotalPages] = useState(1);

  // Polling for interventions
  const { data: interventionsResponse, refetch: fetchInterventions } = usePolling({
    fetchFn: async () => {
      const res = await customerApi.adminOrderManual.get('/api/v1/internal/admin/orders/intervention', { queries: { page: interventionsPage } });
      return res;
    },
    intervalMs: 15000,
    enabled: true
  });
 

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [interventions, setInterventions] = useState<any[]>([]);
  useEffect(() => {
     
    if (interventionsResponse) {
      const content = asUntyped<WirePage<unknown>>(interventionsResponse).content ?? (Array.isArray(interventionsResponse) ? interventionsResponse : []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInterventions(Array.isArray(content) ? content : []);
      if (interventionsResponse.totalPages !== undefined) {
        setInterventionsTotalPages(interventionsResponse.totalPages);
      }
    }
  }, [interventionsResponse]);

  // Polling for failed refunds
  const { data: failedRefundsResponse, refetch: fetchFailedRefunds } = usePolling({
    fetchFn: async () => {
      const res = await customerApi.adminDlq.get('/api/v1/internal/admin/orders/dlq/refunds', { queries: { page: refundsPage } });
      return res;
    },
    intervalMs: 15000,
    enabled: true
   
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [failedRefunds, setFailedRefunds] = useState<any[]>([]);
   
  useEffect(() => {
    if (failedRefundsResponse) {
      const content = asUntyped<WirePage<unknown>>(failedRefundsResponse).content ?? (Array.isArray(failedRefundsResponse) ? failedRefundsResponse : []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailedRefunds(Array.isArray(content) ? content : []);
      if (failedRefundsResponse.totalPages !== undefined) {
        setRefundsTotalPages(failedRefundsResponse.totalPages);
      }
    }
  }, [failedRefundsResponse]);

   
  // Polling for available drivers
  const { data: driversList, refetch: fetchAvailableDrivers } = usePolling({
    fetchFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await deliveryApi.adminDelivery.get('/api/v1/internal/admin/delivery/drivers/available-with-location', { queries: { cityId: 'all' } } as any);
      const content = res;
      return Array.isArray(content) ? content : [];
    },
     
    intervalMs: 15000,
    enabled: true
   
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (driversList) setAvailableDrivers(driversList);
  }, [driversList]);

  const handleAssignDriverToIntervention = async (orderId: string, driverId: string) => {
    // Optimistic UI Update
    setInterventions(prev => prev.filter(o => o.id !== orderId));

    try {
      await customerApi.adminOrderManual.post('/api/v1/internal/admin/orders/intervention/:orderId/assign-driver', { deliveryExecutiveId: driverId }, { params: { orderId } });
      showSuccess("Driver manually assigned and order resumed!");
      fetchInterventions();
      setSelectedIntervention(null);
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, "Failed to manually assign driver").message);
      fetchInterventions(); // Revert
    }
  };

  const handleCancelIntervention = async (orderId: string) => {
    // Optimistic UI Update
    setInterventions(prev => prev.filter(o => o.id !== orderId));

    try {
      await customerApi.adminOrderManual.post('/api/v1/internal/admin/orders/intervention/:orderId/cancel', { reason: cancelReason || 'Cancelled by Admin' }, { params: { orderId } });
      showSuccess("Order cancelled successfully!");
      fetchInterventions();
      setSelectedIntervention(null);
      setCancelReason('');
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, "Failed to cancel order").message);
      fetchInterventions(); // Revert
    }
  };

  const handleRetryRefund = async (orderId: string) => {
    // Optimistic UI Update
    setFailedRefunds(prev => prev.filter(o => o.orderId !== orderId));

    try {
      await customerApi.adminDlq.post('/api/v1/internal/admin/orders/dlq/refunds/:orderId/retry', undefined, { params: { orderId } });
      showSuccess("Refund retry initiated successfully!");
      fetchFailedRefunds();
      setSelectedIntervention(null);
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, "Failed to retry refund").message);
      fetchFailedRefunds(); // Revert
    }
  };

  const handleForceCancel = async (orderId: string) => {
    try {
      await customerApi.adminOrderManual.post('/api/v1/internal/admin/orders/intervention/:orderId/force-cancel', { reason: cancelReason || 'Force Cancelled by Admin' }, { params: { orderId } });
      showSuccess("Order forcefully cancelled!");
      fetchInterventions();
      setSelectedIntervention(null);
      setCancelReason('');
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, "Failed to force cancel order").message);
    }
  };

  const handleForceRefund = async (orderId: string) => {
    try {
      await customerApi.adminOrderManual.post('/api/v1/internal/admin/orders/intervention/:orderId/force-refund', undefined, { params: { orderId } });
      showSuccess("Force refund requested!");
      fetchFailedRefunds();
      setSelectedIntervention(null);
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, "Failed to force refund").message);
    }
  };

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden">
      {/* Live Interventions List */}
      <div className="w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-rose-500/5 dark:bg-rose-500/10 backdrop-blur-xl shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 bg-white/20 dark:bg-slate-900/30">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg text-rose-600 dark:text-rose-400">Interventions</h3>
            <Button variant="ghost" onClick={() => { fetchInterventions(); fetchAvailableDrivers(); fetchFailedRefunds(); }}>Refresh</Button>
          </div>
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('DISPATCH'); setSelectedIntervention(null); }}
              className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'DISPATCH' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
            >
              Dispatch ({interventions.length})
            </button>
            <button
              onClick={() => { setActiveTab('FINANCIAL'); setSelectedIntervention(null); }}
              className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'FINANCIAL' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
            >
              Financial ({failedRefunds.length})
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'DISPATCH' ? (
            <>
              {interventions.map(order => (
                <button
                  key={order.id}
                  onClick={() => setSelectedIntervention(order)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedIntervention?.id === order.id ? 'glass-card !border-rose-500 shadow-md ring-1 ring-rose-500' : 'glass-card hover:border-rose-300'}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-500/20">
                    <Shield className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">#{order.id.substring(0, 8)}</p>
                    <p className="text-xs text-slate-500 truncate">{order.restaurantName || order.restaurantId}</p>
                  </div>
                </button>
              ))}
              {interventions.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No orders require dispatch intervention.</p>}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center mt-2">
                <Button
                  variant="outline"
                  onClick={() => setInterventionsPage(p => Math.max(0, p - 1))}
                  disabled={interventionsPage === 0}
                >
                  Prev
                </Button>
                <span className="text-xs font-bold text-slate-500">Page {interventionsPage + 1} of {interventionsTotalPages === 0 ? 1 : interventionsTotalPages}</span>
                <Button
                  variant="outline"
                  onClick={() => setInterventionsPage(p => Math.min(interventionsTotalPages - 1, p + 1))}
                  disabled={interventionsPage >= interventionsTotalPages - 1}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              {failedRefunds.map(refund => (
                <button
                  key={refund.paymentIntentId}
                  onClick={() => setSelectedIntervention(refund)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedIntervention?.paymentIntentId === refund.paymentIntentId ? 'glass-card !border-blue-500 shadow-md ring-1 ring-blue-500' : 'glass-card hover:border-blue-300'}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-500/20">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">#{refund.orderId.substring(0, 8)}</p>
                    <p className="text-xs text-red-500 font-bold">₹{refund.amount?.toFixed(2)} Failed</p>
                  </div>
                </button>
              ))}
              {failedRefunds.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No failed refunds require intervention.</p>}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center mt-2">
                <Button
                  variant="outline"
                  onClick={() => setRefundsPage(p => Math.max(0, p - 1))}
                  disabled={refundsPage === 0}
                >
                  Prev
                </Button>
                <span className="text-xs font-bold text-slate-500">Page {refundsPage + 1} of {refundsTotalPages === 0 ? 1 : refundsTotalPages}</span>
                <Button
                  variant="outline"
                  onClick={() => setRefundsPage(p => Math.min(refundsTotalPages - 1, p + 1))}
                  disabled={refundsPage >= refundsTotalPages - 1}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Intervention Detail View */}
      <div className="flex-1 flex flex-col p-8 bg-slate-50 dark:bg-[#0f111a] overflow-y-auto">
        {selectedIntervention ? (
          <div className="max-w-4xl mx-auto w-full">
            {activeTab === 'DISPATCH' ? (
              <div className="glass-panel border-rose-500/30 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 to-orange-500" />

                <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-rose-500" />
                  Order #{selectedIntervention.id.substring(0, 8)} requires intervention
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">This order failed to dispatch to any driver after multiple attempts.</p>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2">Assign Available Driver</h3>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                      {availableDrivers.map(driver => (
                        <div key={driver.id} className="flex items-center justify-between p-3 glass-card">
                          <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-indigo-500" />
                            <p className="font-bold text-sm">{driver.fullName || 'Driver'}</p>
                          </div>
                          <Button variant="success" onClick={() => handleAssignDriverToIntervention(selectedIntervention.id, driver.id)} className="shadow-lg shadow-emerald-500/20">
                            Force Assign
                          </Button>
                        </div>
                      ))}
                      {availableDrivers.length === 0 && <p className="text-sm text-slate-500">No online drivers available.</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 text-rose-500">Cancel Order</h3>
                    <p className="text-sm text-slate-500">If no driver can be found, cancel the order and trigger a refund.</p>
                    <Textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Reason for cancellation..."
                      className="min-h-[100px]"
                    />
                    <Button
                      variant="primary"
                      onClick={() => handleCancelIntervention(selectedIntervention.id)}
                      className="w-full !py-3 !bg-rose-500 hover:!bg-rose-600 shadow-lg shadow-rose-500/30"
                    >
                      Cancel & Refund (Normal)
                    </Button>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                      <h4 className="text-xs font-bold text-red-500 uppercase mb-2">Dangerous Actions</h4>
                      <Button
                        variant="danger"
                        onClick={() => handleForceCancel(selectedIntervention.id)}
                        className="w-full"
                      >
                        Force Cancel Order (Skip Saga)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel border-blue-500/30 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />

                <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-blue-500" />
                  Refund Failed for Order #{selectedIntervention.orderId.substring(0, 8)}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">This refund failed processing and is currently stuck in the DLQ.</p>

                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 mb-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Amount</p>
                      <p className="font-black text-xl text-slate-800 dark:text-white">₹{selectedIntervention.amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Retry Count</p>
                      <p className="font-bold text-lg text-slate-800 dark:text-white">{selectedIntervention.retryCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Order Status</p>
                      <p className="font-bold text-lg text-slate-800 dark:text-white">{selectedIntervention.orderStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Last Failed</p>
                      <p className="font-bold text-lg text-slate-800 dark:text-white">{new Date(selectedIntervention.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button
                    variant="primary"
                    onClick={() => handleRetryRefund(selectedIntervention.orderId)}
                    className="w-full !py-3 !bg-blue-500 hover:!bg-blue-600 shadow-lg shadow-blue-500/30 text-center"
                  >
                    Retry Refund Now
                  </Button>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-red-500 uppercase mb-2">Dangerous Actions</h4>
                    <Button
                      variant="danger"
                      onClick={() => handleForceRefund(selectedIntervention.orderId)}
                      className="w-full"
                    >
                      Force Refund Order (Skip DLQ)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Shield className="w-16 h-16 mb-4 opacity-30 text-rose-500" />
            <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-[#f0ede6]">Manual Interventions</h2>
            <p>Select an item that requires intervention to take action.</p>
          </div>
        )}
      </div>
    </div>
  );
}
