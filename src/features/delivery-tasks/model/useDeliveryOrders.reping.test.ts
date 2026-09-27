import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
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

const server: { pingTimeoutAt: number | null } = { pingTimeoutAt: null };

vi.mock('@/lib/zodiosClients', () => ({
  deliveryApi: {
    deliveryOrder: {
      get: vi.fn(async (path: string) => {
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

function renderRider() {
  return renderHook(() => useDeliveryOrders({
    deliveryExecutiveId: RIDER,
    deliveryExecutiveName: 'Rider',
    cityId: 'BLR',
    isOnline: true,
    setIsOnline: vi.fn(),
    showToast: vi.fn(),
    setShowPermissionsPrompt: vi.fn(),
    showHistory: false,
  }));
}

describe('a lapsed dispatch offer that the server makes again', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-09-27T10:00:00Z'));
    server.pingTimeoutAt = null;
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
