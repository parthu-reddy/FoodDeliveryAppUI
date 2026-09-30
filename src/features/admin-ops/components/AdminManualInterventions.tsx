import { useToast } from "@/contexts/ToastContext";
import { usePolling } from "@/hooks/usePolling";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi, deliveryApi, restaurantApi } from "@/lib/zodiosClients";
import { readDispatchScope, readRestaurantCoordinates } from '@features/admin-ops/model/dispatchScope';
import { Button, Surface, Textarea, surfaceStyle, useConfirm } from '@shared/ui';
import { Shield, Truck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { OrderResponse as OrderSchema } from '@/api/generated/schemas/customer/common';
import { z } from 'zod';
type Order = z.infer<typeof OrderSchema>;

type PendingManualAssignment = {
  priorFailureCode?: string;
  priorFailureAt?: string;
};

const MANUAL_ASSIGNMENT_FAILURE_MESSAGES: Record<string, string> = {
  DRIVER_NOT_ELIGIBLE: 'The rider is not eligible for dispatch.',
  DRIVER_NOT_ONLINE: 'The rider is no longer online.',
  DRIVER_OUTSIDE_DISPATCH_CITY: 'The rider is outside this order’s dispatch city.',
  DRIVER_LOCATION_STALE: 'The rider no longer has a current location signal.',
  DRIVER_ALREADY_ASSIGNED: 'The rider already has another active assignment.',
  DRIVER_NOT_FOUND: 'The selected rider is no longer available.',
  ORDER_NOT_REASSIGNABLE: 'The order has progressed and cannot be reassigned.',
  ORDER_ALREADY_ASSIGNED: 'The selected rider already holds this order.',
  CURRENT_ASSIGNMENT_INCONSISTENT: 'The current assignment needs dispatch support review.',
};

export default function AdminManualInterventions() {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'DISPATCH'>('DISPATCH');
   
  const [selectedIntervention, setSelectedIntervention] = useState<Order | null>(null);
  const [assignmentReason, setAssignmentReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPending, setCancelPending] = useState(false);
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);
  const [pendingManualAssignments, setPendingManualAssignments] = useState<Map<string, PendingManualAssignment>>(
    () => new Map(),
  );
  // Retain an operation key after a network error so an explicit retry cannot enqueue the same
  // override twice. A successful request or changed action details creates a new operation.
  const operationKeys = useRef(new Map<string, string>());

  const [interventionsPage, setInterventionsPage] = useState(0);

  // Polling for interventions
  const { data: interventionsResponse, refetch: fetchInterventions } = usePolling({
    fetchFn: async () => {
      const res = await customerApi.adminOrderManual.get('/api/v1/internal/admin/orders/intervention', { queries: { page: interventionsPage } });
      return res;
    },
    intervalMs: 15000,
    enabled: true,
    refreshKey: interventionsPage,
  });
 

  const interventions = useMemo(() => (interventionsResponse?.content ?? []) as Order[], [interventionsResponse]);
  const interventionsTotalPages = interventionsResponse?.totalPages ?? 1;
  const selectedInterventionId = selectedIntervention?.id ?? null;

  useEffect(() => {
    if (!selectedInterventionId) return;
    const refreshed = interventions.find((order) => order.id === selectedInterventionId);
    if (!refreshed) {
      window.setTimeout(() => {
        setSelectedIntervention(null);
        setPendingManualAssignments((current) => {
          if (!current.has(selectedInterventionId)) return current;
          const next = new Map(current);
          next.delete(selectedInterventionId);
          return next;
        });
      }, 0);
      return;
    }
    
    // We only update if there's an actual change to avoid cascading renders
    if (selectedIntervention?.id !== refreshed.id || 
        selectedIntervention?.manualInterventionFailureCode !== refreshed.manualInterventionFailureCode) {
      window.setTimeout(() => setSelectedIntervention(refreshed), 0);
    }
    
    const pending = pendingManualAssignments.get(selectedInterventionId);
    const isNewFailure = pending !== undefined
      && Boolean(refreshed.manualInterventionFailureCode)
      && (refreshed.manualInterventionFailureCode !== pending.priorFailureCode
        || refreshed.manualInterventionFailedAt !== pending.priorFailureAt);
    if (isNewFailure) {
      window.setTimeout(() => {
        setPendingManualAssignments((current) => {
          if (!current.has(selectedInterventionId)) return current;
          const next = new Map(current);
          next.delete(selectedInterventionId);
          return next;
        });
      }, 0);
    }
  }, [interventions, selectedIntervention, pendingManualAssignments, selectedInterventionId]);

  // A force-assignment candidate must be scoped to the selected order's
  // dispatch city, restaurant location, and configured search radius.
  const {
    data: driversList,
    dataRefreshKey: driverCandidatesOrderId,
    refetch: fetchAvailableDrivers,
    isLoading: driversLoading,
    error: driversError,
  } = usePolling<Record<string, unknown>[]>({
    fetchFn: async () => {
      if (!selectedIntervention) return [];
      const dispatchScope = readDispatchScope(selectedIntervention);
      if (!dispatchScope) {
        throw new Error('This order is missing dispatch location details. Driver assignment is unavailable.');
      }

      const restRes = await restaurantApi.restaurantOutlet.get('/api/v1/restaurants/:id', { params: { id: selectedIntervention.restaurantId } });
      const restaurantCoordinates = readRestaurantCoordinates(restRes);
      if (!restaurantCoordinates) {
        throw new Error('The restaurant location is unavailable. Driver assignment is unavailable.');
      }

      return deliveryApi.adminDelivery.get('/api/v1/internal/admin/delivery/drivers/available-with-location', {
        queries: {
          cityId: dispatchScope.cityId,
          lat: restaurantCoordinates.lat,
          lng: restaurantCoordinates.lng,
          radiusKm: dispatchScope.radiusKm,
        },
      });
    },
     
    intervalMs: 15000,
    enabled: Boolean(selectedIntervention),
    refreshKey: selectedInterventionId,
   
  });

  const hasCurrentDriverCandidates = Boolean(selectedIntervention)
    && driverCandidatesOrderId === selectedInterventionId;
  const availableDrivers = hasCurrentDriverCandidates ? driversList ?? [] : [];

  const idempotencyKeyFor = (action: string, orderId: string, details: string) => {
    const operation = `${action}:${orderId}:${details}`;
    let key = operationKeys.current.get(operation);
    if (!key) {
      key = crypto.randomUUID();
      operationKeys.current.set(operation, key);
    }
    return { operation, key };
  };

  const handleAssignDriverToIntervention = async (orderId: string, driverId: string) => {
    if (assigningDriverId || pendingManualAssignments.has(orderId)) return;
    if (!hasCurrentDriverCandidates || selectedInterventionId !== orderId || driversLoading) {
      showError('Wait for location-scoped driver candidates before assigning a driver.');
      return;
    }
    const reason = assignmentReason.trim();
    if (reason.length < 5) {
      showError('Enter an assignment reason of at least 5 characters.');
      return;
    }
    // Force-assign queues an audited override for a specific rider. Dispatch validates the
    // current order and rider readiness before the rider is notified.
    const ok = await confirm({
      title: 'Force-assign this driver?',
      description:
        'This queues an audited override. Dispatch verifies the current order and rider '
        + 'readiness before notifying the rider. It cannot be undone from here.',
      confirmLabel: 'Force assign',
      tone: 'danger',
    });
    if (!ok) return;

    setAssigningDriverId(driverId);
    const idempotency = idempotencyKeyFor('assign', orderId, `${driverId}:${reason}`);
    try {
      await customerApi.adminOrderManual.post(
        '/api/v1/internal/admin/orders/intervention/:orderId/assign-driver',
        { deliveryExecutiveId: driverId, reason },
        { params: { orderId }, headers: { 'Idempotency-Key': idempotency.key } },
      );
      showSuccess("Driver assignment requested. The queue will update when dispatch confirms it.");
      fetchInterventions();
      setAssignmentReason('');
      setSelectedIntervention((current) => current?.id === orderId
        ? { ...current, manualInterventionFailureCode: undefined, manualInterventionFailedAt: undefined }
        : current);
      setPendingManualAssignments((current) => {
        const next = new Map(current);
        next.set(orderId, {
          priorFailureCode: selectedIntervention?.manualInterventionFailureCode,
          priorFailureAt: selectedIntervention?.manualInterventionFailedAt,
        });
        return next;
      });
      operationKeys.current.delete(idempotency.operation);
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, "Failed to manually assign driver").message);
      fetchInterventions();
    } finally {
      setAssigningDriverId(null);
    }
  };

  const handleCancelIntervention = async (orderId: string) => {
    if (pendingManualAssignments.has(orderId)) return;
    const reason = cancelReason.trim();
    if (reason.length < 5) {
      showError('Enter a cancellation reason of at least 5 characters.');
      return;
    }

    const ok = await confirm({
      title: `Request cancellation for order #${orderId.substring(0, 8)}?`,
      description:
        'This requests cancellation and starts the refund workflow when the order is eligible. '
        + 'The order remains visible until the server confirms the change.',
      confirmLabel: 'Request cancellation',
      tone: 'danger',
    });
    if (!ok) return;

    setCancelPending(true);
    const idempotency = idempotencyKeyFor('cancel', orderId, reason);
    try {
      await customerApi.adminOrderManual.post(
        '/api/v1/internal/admin/orders/intervention/:orderId/cancel',
        { reason },
        { params: { orderId }, headers: { 'Idempotency-Key': idempotency.key } },
      );
      showSuccess("Cancellation requested. The queue will update when processing finishes.");
      fetchInterventions();
      setSelectedIntervention(null);
      setCancelReason('');
      operationKeys.current.delete(idempotency.operation);
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, "Failed to cancel order").message);
      fetchInterventions();
    } finally {
      setCancelPending(false);
    }
  };
  const assignmentPending = selectedInterventionId !== null && pendingManualAssignments.has(selectedInterventionId);
  const failureCode = selectedIntervention?.manualInterventionFailureCode;
  const failureMessage = failureCode && !assignmentPending
    ? MANUAL_ASSIGNMENT_FAILURE_MESSAGES[failureCode] ?? 'Dispatch rejected the prior assignment. Select another ready rider or request cancellation.'
    : null;
  return (
    <div className="flex-1 flex w-full h-full overflow-hidden">
      {/* Live Interventions List */}
      <Surface
        variant="sunken"
        radius="none"
        elevation={0}
        className="w-80 flex flex-col border-r shrink-0"
      >
        <Surface elevation={0} className="p-4 border-b flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg text-rose-600 dark:text-rose-400">Interventions</h3>
            <Button variant="ghost" onClick={() => { fetchInterventions(); fetchAvailableDrivers(); }}>Refresh</Button>
          </div>
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('DISPATCH'); setSelectedIntervention(null); }}
              className="flex-1 py-1 text-xs font-bold rounded-md transition"
              style={{
                background: activeTab === 'DISPATCH' ? 'var(--color-paper)' : 'transparent',
                color: activeTab === 'DISPATCH' ? 'var(--color-ink)' : 'var(--color-ink-2)',
              }}
            >
              Dispatch ({interventions.length})
            </button>
          </div>
        </Surface>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'DISPATCH' ? (
            <>
              {interventions.map(order => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedIntervention(order);
                    setAssignmentReason('');
                    setCancelReason('');
                  }}
                  style={surfaceStyle({ variant: 'glass-chrome', elevation: 3, radius: 'lg' })}
                  className={`w-full flex items-center gap-3 p-3 text-left transition ${selectedIntervention?.id === order.id ? '!border-rose-500 ring-1 ring-rose-500' : 'hover:border-rose-300'}`}
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
          ) : null}
        </div>
      </Surface>

      {/* Intervention Detail View */}
      <div className="flex-1 flex flex-col p-8 bg-slate-50 dark:bg-[#0f111a] overflow-y-auto">
        {selectedIntervention ? (
          <div className="max-w-4xl mx-auto w-full">
            {activeTab === 'DISPATCH' ? (
              <Surface elevation={2} radius="xl" className="border-rose-500/30 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 to-amber-500" />

                <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-rose-500" />
                  Order #{selectedIntervention.id.substring(0, 8)} requires intervention
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">This order failed to dispatch to any driver after multiple attempts.</p>
                {assignmentPending && (
                  <p role="status" className="mb-5 rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    Manual assignment is being validated. The controls will reopen if dispatch rejects it.
                  </p>
                )}
                {failureMessage && (
                  <p role="alert" className="mb-5 rounded-lg border border-rose-400/50 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                    The previous manual assignment was not applied: {failureMessage}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2">Assign Available Driver</h3>
                    <Textarea
                      value={assignmentReason}
                      onChange={(e) => setAssignmentReason(e.target.value)}
                      placeholder="Reason for this manual assignment..."
                      className="min-h-[88px]"
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                      {availableDrivers.map(driver => (
                        <Surface elevation={2} radius="lg" key={driver.id as string} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-rose-500" />
                            <p className="font-bold text-sm">{driver.fullName as string || 'Driver'}</p>
                          </div>
                          <Button
                            variant="success"
                            onClick={() => handleAssignDriverToIntervention(selectedIntervention.id, driver.id as string)}
                            disabled={!hasCurrentDriverCandidates || Boolean(assigningDriverId) || assignmentPending || assignmentReason.trim().length < 5}
                            loading={assigningDriverId === driver.id}
                          >
                            Force Assign
                          </Button>
                        </Surface>
                      ))}
                      {driversError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{driversError.message}</p>}
                      {driversLoading && <p role="status" className="text-sm text-slate-500">Loading nearby drivers…</p>}
                      {!driversLoading && !driversError && availableDrivers.length === 0 && <p className="text-sm text-slate-500">No online drivers available nearby.</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 text-rose-500">Cancel Order</h3>
                    <p className="text-sm text-slate-500">If no driver can be found, request cancellation and begin the refund workflow.</p>
                    <Textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Reason for cancellation..."
                      className="min-h-[100px]"
                    />
                    <Button
                      variant="primary"
                      onClick={() => handleCancelIntervention(selectedIntervention.id)}
                      className="w-full !py-3 !bg-rose-500 hover:!bg-rose-600"
                      disabled={cancelReason.trim().length < 5 || assignmentPending}
                      loading={cancelPending}
                    >
                      Request Cancellation & Refund Review
                    </Button>
                  </div>
                </div>
              </Surface>
            ) : null}
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
