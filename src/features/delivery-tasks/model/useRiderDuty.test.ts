import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRiderDuty } from './useRiderDuty';
import { deliveryApi } from '@/lib/zodiosClients';

vi.mock('@/lib/zodiosClients', () => ({
  deliveryApi: { deliveryExecutive: { post: vi.fn() } },
}));
vi.mock('@/lib/notificationPermissions', () => ({
  getNotificationPermission: vi.fn().mockResolvedValue('granted'),
  requestNotificationPermission: vi.fn().mockResolvedValue('granted'),
}));

const RIDER = '4f4a4e37-6ca5-5598-94f1-43ef1628f631';
const post = vi.mocked(deliveryApi.deliveryExecutive.post);
const OK = { success: true, message: 'Status updated successfully', timestamp: '2026-09-27T08:00:00Z' };

type PositionCallback = (p: GeolocationPosition) => void;
type ErrorCallback = (e: GeolocationPositionError) => void;

/** The next getCurrentPosition call resolves with this outcome. */
function geolocationThat(outcome: { lat: number; lng: number } | { code: number }) {
  const getCurrentPosition = vi.fn((ok: PositionCallback, fail: ErrorCallback) => {
    if ('lat' in outcome) {
      ok({ coords: { latitude: outcome.lat, longitude: outcome.lng } } as GeolocationPosition);
    } else {
      fail({ code: outcome.code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
    }
  });
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } });
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: { query: vi.fn().mockResolvedValue({ state: 'granted' }) },
  });
  return getCurrentPosition;
}

function render(isOnline: boolean) {
  const opts = {
    deliveryExecutiveId: RIDER,
    isProfileMandatory: false,
    isOnline,
    setIsOnline: vi.fn(),
    showToast: vi.fn(),
    setShowPermissionsPrompt: vi.fn(),
    setShowProfileRequiredPrompt: vi.fn(),
  };
  const { result } = renderHook(() => useRiderDuty(opts));
  return { ...opts, duty: result.current };
}

async function settle() {
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

describe('useRiderDuty', () => {
  // Not post.mockReset(): on this factory-hoisted mock it made every later mockRejectedValue fail the
  // test with the rejected value, even in a test that never called post. clearAllMocks clears the
  // call history, and every test sets its own implementation.
  afterEach(() => vi.clearAllMocks());

  it('goes online at the position the device just reported', async () => {
    geolocationThat({ lat: 12.9842, lng: 77.6658 });
    post.mockResolvedValue(OK);
    const h = render(false);

    await act(() => h.duty.handleToggleOnline());
    await settle();

    expect(post).toHaveBeenCalledWith('/api/delivery/status',
      { driverId: RIDER, available: true, lat: 12.9842, lng: 77.6658 }, {});
    expect(h.setIsOnline).toHaveBeenCalledWith(true);
  });

  it('stays offline and says why when no location can be found', async () => {
    geolocationThat({ code: 3 }); // TIMEOUT
    const h = render(false);

    await act(() => h.duty.handleToggleOnline());
    await settle();

    expect(post).not.toHaveBeenCalled();
    expect(h.setIsOnline).not.toHaveBeenCalled();
    expect(h.showToast).toHaveBeenCalledWith(expect.stringMatching(/location/i));
  });

  it('asks for location permission when it was denied, without calling the server', async () => {
    geolocationThat({ code: 1 }); // PERMISSION_DENIED
    const h = render(false);

    await act(() => h.duty.handleToggleOnline());
    await settle();

    expect(post).not.toHaveBeenCalled();
    expect(h.setShowPermissionsPrompt).toHaveBeenCalledWith(true);
  });

  it('shows the server’s reason when it refuses to put the rider on duty', async () => {
    geolocationThat({ lat: 12.98, lng: 77.66 });
    post.mockRejectedValue({ response: { data: { message: 'Biometric verification required: Please complete your daily selfie verification to go online.' } } });
    const h = render(false);

    await act(() => h.duty.handleToggleOnline());
    await settle();

    expect(h.setIsOnline).not.toHaveBeenCalled();
    expect(h.showToast).toHaveBeenCalledWith(expect.stringMatching(/Biometric verification required/));
  });

  it('goes offline when the server accepts', async () => {
    post.mockResolvedValue(OK);
    const h = render(true);

    await act(() => h.duty.handleToggleOnline());

    expect(post).toHaveBeenCalledWith('/api/delivery/status', { driverId: RIDER, available: false }, {});
    expect(h.setIsOnline).toHaveBeenCalledWith(false);
  });

  it('stays on duty and says why when the server refuses to take a rider off mid-delivery', async () => {
    post.mockRejectedValue({ response: { data: { message: 'Cannot go offline while on delivery. Please complete the delivery first.' } } });
    const h = render(true);

    let accepted: boolean | undefined;
    await act(async () => { accepted = await h.duty.goOffline(); });

    expect(accepted).toBe(false);
    expect(h.setIsOnline).not.toHaveBeenCalled();
    expect(h.showToast).toHaveBeenCalledWith(expect.stringMatching(/while on delivery/));
  });

  it('does not try to go online when notification permission is refused', async () => {
    const getCurrentPosition = geolocationThat({ lat: 12.98, lng: 77.66 });
    const { requestNotificationPermission } = await import('@/lib/notificationPermissions');
    vi.mocked(requestNotificationPermission).mockResolvedValueOnce('denied');
    const h = render(false);

    await act(() => h.duty.requestPermissionsAndGoOnline());

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
