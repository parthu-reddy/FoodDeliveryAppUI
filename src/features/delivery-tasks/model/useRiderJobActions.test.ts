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
  const result = renderHook(() => useRiderJobActions({
    currentJob: delivery(),
    deliveryExecutiveId: RIDER,
    deliveryExecutiveName: 'Rider',
    historyRef,
    requestPayoutReconciliation,
    setActiveJobId: vi.fn(),
    setPingJob: vi.fn(),
    setRejectedIds: vi.fn(),
    onUpdateOrderStatus: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true) as never,
    showToast: vi.fn(),
    showError: vi.fn(),
    setIsOnline: vi.fn(),
  }));
  return { ...result, historyRef, requestPayoutReconciliation };
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
