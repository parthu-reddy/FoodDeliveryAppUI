import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { customerApi, deliveryApi } from '@/lib/zodiosClients';
import type { Order } from '@/types';
import { useDeliveryOrders } from './useDeliveryOrders';

/**
 * The backend offers an order again after a rider lets the first offer lapse: the timeout poller
 * releases them, the order goes back on the delayed-dispatch queue, and the same rider is pinged
 * again until they have let it lapse five times. These drive the real hook through that sequence
 * with the server modelled on DeliveryOrderController#getAvailableOrders: the order is listed with
 * `remainingPingSeconds` only while its ping window is open, and nothing is listed between pings.
 */

const RIDER = '4f4a4e37-6ca5-5598-94f1-43ef1628f631';
const ORDER = '0b8d7c1e-2f3a-4b5c-9d6e-7f8a9b0c1d2e';
const WINDOW_MS = 60_000;

const server: { pingTimeoutAt: number | null; historyResponse: unknown; payoutResponses: unknown[] } = {
  pingTimeoutAt: null,
  historyResponse: null,
  payoutResponses: [],
};

vi.mock('@/lib/zodiosClients', () => ({
  deliveryApi: {
    deliveryOrder: {
      get: vi.fn(async (path: string) => {
        if (path.endsWith('/history')) return server.historyResponse ?? [];
        if (path.endsWith('/available')) {
          const t = server.pingTimeoutAt;
          if (t === null || t <= Date.now()) return [];
          return [{
            id: ORDER,
            status: 'PREPARING',
            remainingPingSeconds: Math.floor((t - Date.now()) / 1000),
          }];
        }
        return [];
      }),
    },
    deliveryExecutive: { post: vi.fn() },
  },
  customerApi: {
    driverMoney: {
      get: vi.fn(async () => {
        const response = server.payoutResponses.shift() ?? {};
        if (response instanceof Error) throw response;
        return response;
      }),
    },
  },
}));
vi.mock('@/lib/notificationPermissions', () => ({
  showDeliveryAssignmentNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/tokenStore', () => ({ getToken: () => 'token' }));
vi.mock('@microsoft/fetch-event-source', () => ({ fetchEventSource: vi.fn() }));

class FakeSocket {
  static last: FakeSocket | null = null;
  static OPEN = 1;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  constructor() { FakeSocket.last = this; }
  send() {}
  close() {}
}

/** What CandidateFoundStrategy does: open a window, and push over the rider socket. */
function serverPings() {
  server.pingTimeoutAt = Date.now() + WINDOW_MS;
  FakeSocket.last?.onmessage?.({ data: JSON.stringify({ type: 'NEW_ORDER_DISPATCH', orderId: ORDER }) });
}

async function advance(ms: number) {
  for (let t = 0; t < ms; t += 1000) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  }
}

function renderRider({
  isOnline = true,
  showHistory = false,
  externalOrders,
}: {
  isOnline?: boolean;
  showHistory?: boolean;
  externalOrders?: Order[];
} = {}) {
  return renderHook(() => useDeliveryOrders({
    deliveryExecutiveId: RIDER,
    deliveryExecutiveName: 'Rider',
    cityId: 'BLR',
    isOnline,
    setIsOnline: vi.fn(),
    showToast: vi.fn(),
    setShowPermissionsPrompt: vi.fn(),
    showHistory,
    externalOrders,
  }));
}

describe('a lapsed dispatch offer that the server makes again', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-09-27T10:00:00Z'));
    server.pingTimeoutAt = null;
    server.historyResponse = null;
    server.payoutResponses = [];
    vi.mocked(deliveryApi.deliveryOrder.get).mockClear();
    vi.mocked(customerApi.driverMoney.get).mockClear();
    vi.stubGlobal('WebSocket', FakeSocket);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true, value: { watchPosition: vi.fn(() => 1), clearWatch: vi.fn() },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('prompts the rider again on the second offer', async () => {
    const { result } = renderRider();
    await advance(1000);

    serverPings();
    await advance(1000);
    expect(result.current.pingJob?.id).toBe(ORDER);

    // The rider does nothing; the window closes on both sides.
    await advance(WINDOW_MS + 1000);
    expect(result.current.pingJob).toBeNull();

    // Timeout poller + 15 s delayed dispatch + Kafka round trip.
    await advance(25_000);
    serverPings();
    await advance(6000);

    expect(result.current.pingJob?.id).toBe(ORDER);
    expect(result.current.pingTimer).toBeGreaterThan(50);
  });

  it('loads completed deliveries while the rider is offline', async () => {
    const completedOrder = {
      id: '31cce3db-c9f3-47b8-9df3-4d1a3bf09929',
      deliveryExecutiveId: RIDER,
      status: 'HANDED_OVER',
      deliveryStatus: 'DELIVERED',
      createdAt: '2026-09-27T09:00:00Z',
      earnings: { netPayout: 75 },
    };
    server.historyResponse = { content: [completedOrder], totalElements: 1 };

    const { result } = renderRider({ isOnline: false, showHistory: true });

    await act(async () => { await Promise.resolve(); });

    expect(result.current.paginatedHistoryJobs.map(order => order.id))
      .toContain(completedOrder.id);
    expect(deliveryApi.deliveryOrder.get).toHaveBeenCalledWith(
      '/api/v1/delivery/orders/history',
      expect.objectContaining({ queries: expect.objectContaining({ from: expect.any(String), to: expect.any(String) }) }),
    );
    expect(deliveryApi.deliveryOrder.get).not.toHaveBeenCalledWith('/api/v1/delivery/orders/active', expect.anything());
  });

  it('keeps the dashboard usable while a just-delivered payout is still enriching', async () => {
    const justDelivered = {
      id: '1cfdd73d-3e7e-4e5a-a7a2-d1aed623d6f3',
      deliveryExecutiveId: RIDER,
      status: 'HANDED_OVER',
      deliveryStatus: 'DELIVERED',
      createdAt: '2026-09-27T09:00:00Z',
    } as Order;

    const { result } = renderRider({ isOnline: false, externalOrders: [justDelivered] });

    await act(async () => { await Promise.resolve(); });

    expect(result.current.todayCompletedCount).toBe(1);
    expect(result.current.todayPayoutUpdatingCount).toBe(0);
    expect(result.current.todayEarnings).toBe(0);
  });

  it('reconciles a confirmed delivery payout while the rider is offline', async () => {
    const justDelivered = {
      id: '2cfdd73d-3e7e-4e5a-a7a2-d1aed623d6f3',
      deliveryExecutiveId: RIDER,
      status: 'HANDED_OVER',
      deliveryStatus: 'DELIVERED',
      createdAt: '2026-09-27T09:00:00Z',
    } as Order;
    server.payoutResponses = [
      {},
      { netPayout: 75, customerContribution: 40, restaurantContribution: 35 },
    ];

    const { result } = renderRider({ isOnline: false, externalOrders: [justDelivered] });
    await act(async () => { await Promise.resolve(); });

    act(() => result.current.requestPayoutReconciliation(justDelivered));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(result.current.payoutReconciliationByOrderId[justDelivered.id]).toBe('refreshing');
    expect(customerApi.driverMoney.get).toHaveBeenCalledWith(
      '/api/v1/money/driver/:driverId/orders/:orderId',
      expect.objectContaining({ params: { driverId: RIDER, orderId: justDelivered.id } }),
    );

    await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });

    expect(customerApi.driverMoney.get).toHaveBeenCalledTimes(2);
    expect(result.current.payoutReconciliationByOrderId[justDelivered.id]).toBeUndefined();
    expect(result.current.todayEarnings).toBe(75);

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(customerApi.driverMoney.get).toHaveBeenCalledTimes(2);
  });

  it('keeps an exact payout when an older history response arrives afterwards', async () => {
    const justDelivered = {
      id: '6cfdd73d-3e7e-4e5a-a7a2-d1aed623d6f3',
      deliveryExecutiveId: RIDER,
      status: 'HANDED_OVER',
      deliveryStatus: 'DELIVERED',
      createdAt: '2026-09-27T09:00:00Z',
    } as Order;
    let resolveHistory: ((value: unknown) => void) | undefined;
    server.historyResponse = new Promise(resolve => { resolveHistory = resolve; });
    server.payoutResponses = [{ netPayout: 75, customerContribution: 40, restaurantContribution: 35 }];

    const { result } = renderRider({ isOnline: false, externalOrders: [justDelivered] });
    await act(async () => { await Promise.resolve(); });
    act(() => result.current.requestPayoutReconciliation(justDelivered));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(result.current.todayEarnings).toBe(75);
    resolveHistory?.({ content: [justDelivered] });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.historyRef.current.find(order => order.id === justDelivered.id)?.earnings?.netPayout).toBe(75);
    expect(result.current.todayEarnings).toBe(75);
  });

  it('marks a payout unavailable after four unsuccessful reads', async () => {
    const justDelivered = {
      id: '3cfdd73d-3e7e-4e5a-a7a2-d1aed623d6f3',
      deliveryExecutiveId: RIDER,
      status: 'HANDED_OVER',
      deliveryStatus: 'DELIVERED',
      createdAt: '2026-09-27T09:00:00Z',
    } as Order;
    server.payoutResponses = [{}, {}, {}, {}];

    const { result } = renderRider({ isOnline: false, externalOrders: [justDelivered] });
    await act(async () => { await Promise.resolve(); });
    act(() => result.current.requestPayoutReconciliation(justDelivered));
    await act(async () => { await vi.advanceTimersByTimeAsync(17_000); });

    expect(customerApi.driverMoney.get).toHaveBeenCalledTimes(4);
    expect(result.current.payoutReconciliationByOrderId[justDelivered.id]).toBe('unavailable');

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(customerApi.driverMoney.get).toHaveBeenCalledTimes(4);
  });

  it('clears an unavailable payout when history later supplies the confirmed amount', async () => {
    const justDelivered = {
      id: '7cfdd73d-3e7e-4e5a-a7a2-d1aed623d6f3',
      deliveryExecutiveId: RIDER,
      status: 'HANDED_OVER',
      deliveryStatus: 'DELIVERED',
      createdAt: '2026-09-27T09:00:00Z',
    } as Order;
    server.payoutResponses = [{}, {}, {}, {}];

    const { result } = renderRider({ isOnline: false, externalOrders: [justDelivered] });
    await act(async () => { await Promise.resolve(); });
    act(() => result.current.requestPayoutReconciliation(justDelivered));
    await act(async () => { await vi.advanceTimersByTimeAsync(17_000); });
    expect(result.current.payoutReconciliationByOrderId[justDelivered.id]).toBe('unavailable');

    server.historyResponse = {
      content: [{
        ...justDelivered,
        earnings: { netPayout: 75, customerContribution: 40, restaurantContribution: 35 },
      }],
    };
    act(() => result.current.setHistoryDateFilter('2026-09-26'));
    act(() => result.current.setHistoryDateFilter('2026-09-27'));
    await act(async () => { await Promise.resolve(); });

    expect(result.current.payoutReconciliationByOrderId[justDelivered.id]).toBeUndefined();
    expect(result.current.todayEarnings).toBe(75);
  });

  it('does not retry after the rider screen unmounts', async () => {
    const justDelivered = {
      id: '4cfdd73d-3e7e-4e5a-a7a2-d1aed623d6f3',
      deliveryExecutiveId: RIDER,
      status: 'HANDED_OVER',
      deliveryStatus: 'DELIVERED',
      createdAt: '2026-09-27T09:00:00Z',
    } as Order;
    server.payoutResponses = [{}];

    const { result, unmount } = renderRider({ isOnline: false, externalOrders: [justDelivered] });
    await act(async () => { await Promise.resolve(); });
    act(() => result.current.requestPayoutReconciliation(justDelivered));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(customerApi.driverMoney.get).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(customerApi.driverMoney.get).toHaveBeenCalledTimes(1);
  });

  it('does not disguise an authorization failure as a pending payout', async () => {
    const justDelivered = {
      id: '5cfdd73d-3e7e-4e5a-a7a2-d1aed623d6f3',
      deliveryExecutiveId: RIDER,
      status: 'HANDED_OVER',
      deliveryStatus: 'DELIVERED',
      createdAt: '2026-09-27T09:00:00Z',
    } as Order;
    server.payoutResponses = [Object.assign(new Error('forbidden'), { response: { status: 403 } })];

    const { result } = renderRider({ isOnline: false, externalOrders: [justDelivered] });
    await act(async () => { await Promise.resolve(); });
    act(() => result.current.requestPayoutReconciliation(justDelivered));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(result.current.payoutReconciliationByOrderId[justDelivered.id]).toBe('unavailable');
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(customerApi.driverMoney.get).toHaveBeenCalledTimes(1);
  });

  it('prompts again when the second offer arrives only through polling (socket push missed)', async () => {
    const { result } = renderRider();
    await advance(1000);
    serverPings();
    await advance(1000);
    expect(result.current.pingJob?.id).toBe(ORDER);

    await advance(WINDOW_MS + 1000);
    await advance(25_000);
    server.pingTimeoutAt = Date.now() + WINDOW_MS; // no socket message this time
    await advance(6000);

    expect(result.current.pingJob?.id).toBe(ORDER);
  });
});
