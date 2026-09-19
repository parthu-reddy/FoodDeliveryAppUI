import { useEffect, useState } from 'react';
import { deliveryApi } from '@/lib/zodiosClients';
import { DeliveryStatus, Order, OrderStatus } from '@/types';
import type { useConfirm } from '@shared/ui';
import { z } from 'zod';

/** Six digits, no spaces. The rider types this off a customer's phone screen. */
const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d+$/, 'OTP must contain only digits');

/**
 * Everything the rider does to a job: take it, refuse it, arrive, collect, hand over, or
 * give it back.
 *
 * Lifted verbatim from `DeliveryDashboard`. Both OTP flows, the abort path, the
 * customer-unavailable wait timer and the optimistic status updates lived in one file with
 * the markup; the wait timer in particular is a rule about money -- it is what decides when a
 * rider may leave -- and it was three `useState` calls and an interval in the middle of a
 * render function.
 */

interface UseRiderJobActionsOptions {
  currentJob: Order | null | undefined;
  deliveryExecutiveId: string;
  deliveryExecutiveName: string;
  /** The history the queue keeps, so a completed job can be reconciled against it. */
  historyRef: React.MutableRefObject<Order[]>;
  setActiveJobId: (id: string | null) => void;
  setPingJob: (job: Order | null) => void;
  setRejectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    deliveryStatus?: DeliveryStatus,
    extra?: { name?: string },
  ) => void;
  /**
   * The app's confirm, not the browser's — `ReturnType<typeof useConfirm>` rather than a
   * re-spelled signature, so this parameter cannot drift from the hook it is fed from. It
   * also tells the Phase 2 gate which `confirm(` this is: a bare one in a file that never
   * names `useConfirm` reads as the native dialog that phase removed.
   */
  confirm: ReturnType<typeof useConfirm>;
  showToast: (message: string) => void;
  showError: (message: string) => void;
  setIsOnline: (online: boolean) => void;
}

export function useRiderJobActions({
  currentJob,
  deliveryExecutiveId,
  deliveryExecutiveName,
  historyRef,
  setActiveJobId,
  setPingJob,
  setRejectedIds,
  onUpdateOrderStatus,
  confirm,
  showToast,
  showError,
  setIsOnline,
}: UseRiderJobActionsOptions) {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [enteredPickupOtp, setEnteredPickupOtp] = useState('');
  const [pickupOtpError, setPickupOtpError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isUpdatingPickup, setIsUpdatingPickup] = useState(false);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [goOfflineAfter, setGoOfflineAfter] = useState(false);
  const [waitTimerSeconds, setWaitTimerSeconds] = useState(0);
  const [isWaitTimerActive, setIsWaitTimerActive] = useState(false);

const handleAcceptPing = async (job: Order) => {
  // Optimistic UI update
  setActiveJobId(job.id);
  onUpdateOrderStatus(job.id, job.status, DeliveryStatus.ASSIGNED, {
    name: deliveryExecutiveName,
  });
  try {
    await deliveryApi.deliveryExecutive.post(
      "/api/delivery/drivers/:driverId/orders/:orderId/accept",
      undefined,
      { params: { driverId: deliveryExecutiveId, orderId: job.id } }
    );
  } catch (e: unknown) {
    // Revert on error
    setActiveJobId(null);
    // Wait, can't easily revert onUpdateOrderStatus without knowing previous state, but we can rely on polling to fix it soon
      const errObj = e as { response?: { data?: { message?: string } } };
      showToast(
        errObj.response?.data?.message ||
          "Failed to accept order. Ping expired or order already accepted."
      );
  } finally {
    setPingJob(null);
  }
};

const handleRejectPing = async (jobId: string) => {
  // Optimistic UI update
  setRejectedIds((prev) => new Set(prev).add(jobId));
  setPingJob(null);
  try {
    await deliveryApi.deliveryExecutive.post(
      "/api/delivery/drivers/:driverId/orders/:orderId/reject",
      undefined,
      { params: { driverId: deliveryExecutiveId, orderId: jobId } }
    );
  } catch (e: unknown) {
    // Not fire-and-forget. The backend reverts its Redis state when it cannot record the decline
    // and answers 503, which means this ping WILL come back on the next poll. Silently undoing
    // the optimistic update made that reappearance look like the app had ignored the tap.
    setRejectedIds((prev) => {
      const n = new Set(prev);
      n.delete(jobId);
      return n;
    });
    const errObj = e as { response?: { data?: { message?: string } } };
    showToast(
      errObj.response?.data?.message ||
        "Could not record the decline. This order may appear again."
    );
  }
};

const handleAcceptJob = async (order: Order) => {
  // Optimistic UI update
  setActiveJobId(order.id);
  onUpdateOrderStatus(order.id, order.status, DeliveryStatus.ASSIGNED, {
    name: deliveryExecutiveName,
  });
  try {
    await deliveryApi.deliveryExecutive.post(
      "/api/delivery/drivers/:driverId/orders/:orderId/accept",
      undefined,
      { params: { driverId: deliveryExecutiveId, orderId: order.id } }
    );
  } catch (e: unknown) {
    console.error("Failed to accept job", e);
    // Revert on error
    setActiveJobId(null);
    const errObj = e as { response?: { data?: { message?: string } } };
    showError(errObj.response?.data?.message || "Failed to accept job.");
  }
};

const handleArrivedAtRestaurant = async () => {
  if (!currentJob) return;
  const previousStatus = currentJob.status;
  onUpdateOrderStatus(
    currentJob.id,
    currentJob.status,
    DeliveryStatus.AT_RESTAURANT
  );
  try {
    await deliveryApi.deliveryExecutive.post(
      "/api/delivery/drivers/:driverId/orders/:orderId/status",
      { status: DeliveryStatus.AT_RESTAURANT },
      { params: { driverId: deliveryExecutiveId, orderId: currentJob.id } }
    );
  } catch (e: unknown) {
    onUpdateOrderStatus(
      currentJob.id,
      previousStatus,
      currentJob.deliveryStatus
    );
    const errObj = e as { response?: { data?: { message?: string } } };
    showToast(errObj.response?.data?.message || "Failed to update status.");
  }
};

const handleAbortJob = async () => {
  if (!currentJob) return;
  const proceed = await confirm({
    title: 'Abort this delivery?',
    description: 'The order goes back to the pool and this will affect your rating.',
    confirmLabel: 'Abort delivery',
    tone: 'danger',
  });
  if (!proceed) return;

  try {
    await deliveryApi.deliveryExecutive.post(
      "/api/delivery/drivers/:driverId/orders/:orderId/abort",
      undefined,
      { params: { driverId: deliveryExecutiveId, orderId: currentJob.id } }
    );
    setActiveJobId(null);
    showToast("Delivery aborted. You will be placed back in the pool.");
  } catch (e: unknown) {
    const errObj = e as { response?: { data?: { message?: string } } };
    showToast(errObj.response?.data?.message || "Failed to abort delivery.");
  }
};

const handleCustomerUnavailable = async () => {
  if (!currentJob) return;
  const proceed = await confirm({
    title: 'Mark customer unavailable?',
    description: 'Try calling them first. This is recorded against the order.',
    confirmLabel: 'Mark unavailable',
    tone: 'danger',
  });
  if (!proceed) return;

  const previousStatus = currentJob.status;
  onUpdateOrderStatus(
    currentJob.id,
    currentJob.status,
    DeliveryStatus.FAILED
  );
  try {
    await deliveryApi.deliveryExecutive.post(
      "/api/delivery/drivers/:driverId/orders/:orderId/status",
      { status: DeliveryStatus.FAILED, goOfflineAfter },
      { params: { driverId: deliveryExecutiveId, orderId: currentJob.id } }
    );
    setActiveJobId(null);

    if (goOfflineAfter) {
      setIsOnline(false);
    }
    showToast("Delivery marked as failed.");
  } catch (e: unknown) {
    onUpdateOrderStatus(
      currentJob.id,
      previousStatus,
      currentJob.deliveryStatus
    );
    const errObj = e as { response?: { data?: { message?: string } } };
    showToast(errObj.response?.data?.message || "Failed to mark as unavailable.");
  }
};

const handlePickUpFood = async (e: React.FormEvent) => {
  e.preventDefault();
  setPickupOtpError("");
  const validation = otpSchema.safeParse(enteredPickupOtp);
  if (!validation.success) {
    setPickupOtpError(validation.error.issues[0].message);
    return;
  }

  if (!currentJob) return;
  const previousStatus = currentJob.status;
  onUpdateOrderStatus(
    currentJob.id,
    OrderStatus.HANDED_OVER,
    DeliveryStatus.OUT_FOR_DELIVERY
  );
  setIsUpdatingPickup(true);

  try {
    await deliveryApi.deliveryExecutive.post(
      "/api/delivery/drivers/:driverId/orders/:orderId/status",
      {
        status: DeliveryStatus.OUT_FOR_DELIVERY,
        pickupOtp: enteredPickupOtp,
      },
      { params: { driverId: deliveryExecutiveId, orderId: currentJob.id } }
    );
    setIsUpdatingPickup(false);
    setEnteredPickupOtp("");
  } catch (e: unknown) {
    setIsUpdatingPickup(false);
    onUpdateOrderStatus(
      currentJob.id,
      previousStatus,
      currentJob.deliveryStatus
    );
    const errObj = e as { response?: { data?: { message?: string } } };
    setPickupOtpError(errObj.response?.data?.message || "Failed to verify OTP.");
  }
};

const handleCompleteDelivery = async (e: React.FormEvent) => {
  e.preventDefault();
  setOtpError("");
  const validation = otpSchema.safeParse(enteredOtp);
  if (!validation.success) {
    setOtpError(validation.error.issues[0].message);
    return;
  }

  if (!currentJob) return;

  const previousStatus = currentJob.status;
  onUpdateOrderStatus(
    currentJob.id,
    OrderStatus.HANDED_OVER,
    DeliveryStatus.DELIVERED
  );
  setIsUpdatingDelivery(true);

  try {
    await deliveryApi.deliveryExecutive.post(
      "/api/delivery/drivers/:driverId/orders/:orderId/status",
      {
        status: DeliveryStatus.DELIVERED,
        deliveryOtp: enteredOtp,
        goOfflineAfter,
      },
      { params: { driverId: deliveryExecutiveId, orderId: currentJob.id } }
    );
    setIsUpdatingDelivery(false);

    historyRef.current = [
      { ...currentJob, deliveryStatus: DeliveryStatus.DELIVERED },
      ...historyRef.current,
    ];

    setActiveJobId(null);
    if (goOfflineAfter) {
      setIsOnline(false);
    }
  } catch (e: unknown) {
    setIsUpdatingDelivery(false);
    onUpdateOrderStatus(
      currentJob.id,
      previousStatus,
      currentJob.deliveryStatus
    );
    const errObj = e as { response?: { data?: { message?: string } } };
    setOtpError(
      errObj.response?.data?.message || "Failed to verify Delivery OTP."
    );
  }
};
useEffect(() => {
  if (currentJob?.status) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsUpdatingPickup(false);
    setIsUpdatingDelivery(false);

    if (
      currentJob.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY &&
      !isWaitTimerActive
    ) {
      setIsWaitTimerActive(true);
      setWaitTimerSeconds(0);
    }
   
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentJob?.status]);

useEffect(() => {
  let interval: ReturnType<typeof setInterval>;
  if (
    isWaitTimerActive &&
    currentJob?.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY
  ) {
    interval = setInterval(() => {
      setWaitTimerSeconds((prev) => prev + 1);
     
    }, 1000);
  } else {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsWaitTimerActive(false);
    setWaitTimerSeconds(0);
  }
  return () => clearInterval(interval);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [isWaitTimerActive, currentJob?.status]);
  return {
    enteredOtp, setEnteredOtp,
    enteredPickupOtp, setEnteredPickupOtp,
    pickupOtpError, otpError,
    isUpdatingPickup, isUpdatingDelivery,
    goOfflineAfter, setGoOfflineAfter,
    waitTimerSeconds,
    handleAcceptPing, handleRejectPing, handleAcceptJob,
    handleArrivedAtRestaurant, handleAbortJob, handleCustomerUnavailable,
    handlePickUpFood, handleCompleteDelivery,
  };
}
