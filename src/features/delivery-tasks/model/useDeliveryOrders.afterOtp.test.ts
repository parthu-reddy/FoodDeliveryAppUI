import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { DeliveryStatus, OrderStatus } from '@/types';
import { useDeliveryOrders } from './useDeliveryOrders';

/**
 * `/orders/active` is served from the customer service's copy of the order, which catches up with
 * the delivery service a few seconds after an OTP is accepted. These drive the real hook with a
 * server that keeps answering with the step before, as it does in that window.
 */

const RIDER = '4f4a4e37-6ca5-5598-94f1-43ef1628f631';
const ORDER = '0b8d7c1e-2f3a-4b5c-9d6e-7f8a9b0c1d2e';
const server: { deliveryStatus: DeliveryStatus | null } = { deliveryStatus: null };

vi.mock('@/lib/zodiosClients', () => ({
  deliveryApi: {
    deliveryOrder: {
      get: vi.fn(async (path: string) => {
        if (path.endsWith('/active') && server.deliveryStatus) {
          return { content: [{ id: ORDER, status: 'READY_FOR_PICKUP', deliveryStatus: server.deliveryStatus, deliveryExecutiveId: RIDER }] };
        }
        return [];
      }),
    },
    deliveryExecutive: { post: vi.fn() },
  },
}));
vi.mock('@/lib/notificationPermissions', () => ({ showDeliveryAssignmentNotification: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/tokenStore', () => ({ getToken: () => 'token' }));
vi.mock('@microsoft/fetch-event-source', () => ({ fetchEventSource: vi.fn() }));

class FakeSocket { readyState = 0; onopen = null; onmessage = null; onclose = null; onerror = null; send() {} close() {} }

async function advance(ms: number) {
  for (let t = 0; t < ms; t += 1000) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  }
}

function renderRider() {
  return renderHook(() => useDeliveryOrders({
    deliveryExecutiveId: RIDER, deliveryExecutiveName: 'Rider', cityId: 'BLR', isOnline: true,
    setIsOnline: vi.fn(), showToast: vi.fn(), setShowPermissionsPrompt: vi.fn(), showHistory: false,
  }));
}

describe('the rider screen right after an accepted OTP', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-09-27T10:00:00Z'));
    vi.stubGlobal('WebSocket', FakeSocket);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true, value: { watchPosition: vi.fn(() => 1), clearWatch: vi.fn() },
    });
    server.deliveryStatus = DeliveryStatus.AT_RESTAURANT;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('stays on "deliver to door" after pickup while polls still say at the restaurant', async () => {
    const { result } = renderRider();
    await advance(1000);
    expect(result.current.currentJob?.deliveryStatus).toBe(DeliveryStatus.AT_RESTAURANT);

    act(() => result.current.onUpdateOrderStatus(ORDER, OrderStatus.HANDED_OVER, DeliveryStatus.OUT_FOR_DELIVERY));
    await advance(15_000); // three stale polls

    expect(result.current.currentJob?.deliveryStatus).toBe(DeliveryStatus.OUT_FOR_DELIVERY);

    server.deliveryStatus = DeliveryStatus.OUT_FOR_DELIVERY; // the event has landed
    await advance(6000);
    expect(result.current.currentJob?.deliveryStatus).toBe(DeliveryStatus.OUT_FOR_DELIVERY);
  });

  it('does not bring a delivered job back as the active contract', async () => {
    server.deliveryStatus = DeliveryStatus.OUT_FOR_DELIVERY;
    const { result } = renderRider();
    await advance(1000);
    expect(result.current.activeJobId).toBe(ORDER);

    act(() => {
      result.current.onUpdateOrderStatus(ORDER, OrderStatus.HANDED_OVER, DeliveryStatus.DELIVERED);
      result.current.setActiveJobId(null);
    });
    await advance(15_000); // the customer service still lists it as out for delivery

    expect(result.current.activeJobId).toBeNull();
    expect(result.current.currentJob).toBeUndefined();
  });
});
