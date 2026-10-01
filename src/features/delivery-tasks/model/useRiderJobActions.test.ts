import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deliveryApi } from '@/lib/zodiosClients';
import { DeliveryStatus, Order, OrderStatus } from '@/types';
import { useRiderJobActions } from './useRiderJobActions';

const RIDER = '4f4a4e37-6ca5-5598-94f1-43ef1628f631';
const ORDER = '5cfdd73d-3e7e-4e5a-a7a2-d1aed623d6f3';

vi.mock('@/lib/zodiosClients', () => ({
  deliveryApi: {
    deliveryExecutive: { post: vi.fn() },
  },
}));

const delivery = (): Order => ({
  id: ORDER,
  deliveryExecutiveId: RIDER,
  status: OrderStatus.HANDED_OVER,
  deliveryStatus: DeliveryStatus.OUT_FOR_DELIVERY,
  createdAt: '2026-09-27T09:00:00Z',
} as Order);

function renderActions(requestPayoutReconciliation = vi.fn()) {
  const historyRef = { current: [] as Order[] };
  const setActiveJobId = vi.fn();
  const onUpdateOrderStatus = vi.fn();
  const showToast = vi.fn();
  const showError = vi.fn();
  const result = renderHook(() => useRiderJobActions({
    currentJob: delivery(),
    deliveryExecutiveId: RIDER,
    deliveryExecutiveName: 'Rider',
    historyRef,
    requestPayoutReconciliation,
    setActiveJobId,
    setPingJob: vi.fn(),
    setRejectedIds: vi.fn(),
    onUpdateOrderStatus,
    confirm: vi.fn().mockResolvedValue(true) as never,
    showToast,
    showError,
    setIsOnline: vi.fn(),
  }));
  return { ...result, historyRef, requestPayoutReconciliation, setActiveJobId, onUpdateOrderStatus, showToast, showError };
}

afterEach(() => vi.clearAllMocks());

describe('delivery payout reconciliation', () => {
  it('starts only after the delivery-status update succeeds', async () => {
    let resolveStatusPost: (() => void) | undefined;
    vi.mocked(deliveryApi.deliveryExecutive.post).mockImplementationOnce(
      () => new Promise<void>(resolve => { resolveStatusPost = resolve; }) as never,
    );
    const { result, historyRef, requestPayoutReconciliation } = renderActions();

    act(() => result.current.setEnteredOtp('123456'));
    let completion: Promise<void>;
    act(() => { completion = result.current.handleCompleteDelivery(); });
    await act(async () => { await Promise.resolve(); });

    expect(requestPayoutReconciliation).not.toHaveBeenCalled();
    expect(historyRef.current).toEqual([]);

    resolveStatusPost?.();
    await act(async () => { await completion!; });

    expect(requestPayoutReconciliation).toHaveBeenCalledWith(
      expect.objectContaining({ id: ORDER, deliveryStatus: DeliveryStatus.DELIVERED }),
    );
    expect(historyRef.current).toEqual([
      expect.objectContaining({ id: ORDER, deliveryStatus: DeliveryStatus.DELIVERED }),
    ]);
  });

  it('does not start reconciliation when delivery confirmation fails', async () => {
    vi.mocked(deliveryApi.deliveryExecutive.post).mockRejectedValueOnce(new Error('request failed'));
    const { result, historyRef, requestPayoutReconciliation } = renderActions();

    act(() => result.current.setEnteredOtp('123456'));
    await act(async () => { await result.current.handleCompleteDelivery(); });

    expect(requestPayoutReconciliation).not.toHaveBeenCalled();
    expect(historyRef.current).toEqual([]);
  });
});


describe.each(['handleAcceptPing', 'handleAcceptJob'] as const)('%s assignment confirmation', (handler) => {
  it('does not activate the job or start dependent subscriptions before the server confirms acceptance', async () => {
    let resolveAccept!: () => void;
    vi.mocked(deliveryApi.deliveryExecutive.post).mockImplementationOnce(
      () => new Promise<void>(resolve => { resolveAccept = resolve; }) as never,
    );
    const { result, setActiveJobId, onUpdateOrderStatus } = renderActions();
    const offered = { ...delivery(), deliveryExecutiveId: undefined, deliveryStatus: DeliveryStatus.PENDING };
    let completion!: Promise<void>;
    act(() => { completion = result.current[handler](offered); });
    expect(setActiveJobId).not.toHaveBeenCalled();
    expect(onUpdateOrderStatus).not.toHaveBeenCalled();
    expect(deliveryApi.deliveryExecutive.post).toHaveBeenCalledWith(
      '/api/delivery/drivers/:driverId/orders/:orderId/accept', undefined,
      { params: { driverId: RIDER, orderId: ORDER } },
    );
    resolveAccept();
    await act(async () => { await completion; });
    expect(setActiveJobId).toHaveBeenCalledExactlyOnceWith(ORDER);
    expect(onUpdateOrderStatus).toHaveBeenCalledExactlyOnceWith(ORDER, offered.status, DeliveryStatus.ASSIGNED, { name: 'Rider' });
  });

  it('keeps an unsuccessful acceptance unassigned and allows a subsequent attempt', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(deliveryApi.deliveryExecutive.post).mockRejectedValueOnce(
      { response: { data: { message: 'Dispatch already accepted' } } },
    ).mockResolvedValueOnce(undefined as never);
    const { result, setActiveJobId, onUpdateOrderStatus, showToast, showError } = renderActions();
    await act(async () => { await result.current[handler](delivery()); });
    expect(setActiveJobId).not.toHaveBeenCalled();
    expect(onUpdateOrderStatus).not.toHaveBeenCalled();
    expect(handler === 'handleAcceptPing' ? showToast : showError).toHaveBeenCalledWith('Dispatch already accepted');
    await act(async () => { await result.current[handler](delivery()); });
    expect(setActiveJobId).toHaveBeenCalledExactlyOnceWith(ORDER);
    consoleError.mockRestore();
  });

  it('ignores repeated acceptance clicks while the first request is pending', async () => {
    let resolveAccept!: () => void;
    const pending = new Promise<void>(resolve => { resolveAccept = resolve; });
    vi.mocked(deliveryApi.deliveryExecutive.post).mockImplementation(() => pending as never);
    const { result, setActiveJobId } = renderActions();
    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current[handler](delivery());
      second = result.current[handler](delivery());
    });
    expect(deliveryApi.deliveryExecutive.post).toHaveBeenCalledTimes(1);
    resolveAccept();
    await act(async () => { await Promise.all([first, second]); });
    expect(setActiveJobId).toHaveBeenCalledExactlyOnceWith(ORDER);
  });
});
