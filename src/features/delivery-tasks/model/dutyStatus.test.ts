import { describe, expect, it, vi } from 'vitest';
import {
  apiErrorMessage,
  applyDutyStatus,
  dutyChangeNotice,
  isOnDuty,
  parseDutyStatusMessage,
  reactToLocationError,
} from './dutyStatus';

const DENIED = { code: 1, PERMISSION_DENIED: 1 } as const;
const UNAVAILABLE = { code: 2, PERMISSION_DENIED: 1 } as const;

describe('parseDutyStatusMessage', () => {
  it('reads a DUTY_STATUS message', () => {
    expect(parseDutyStatusMessage({ type: 'DUTY_STATUS', status: 'OFFLINE', reason: 'LOCATION_LOST' }))
      .toEqual({ type: 'DUTY_STATUS', status: 'OFFLINE', reason: 'LOCATION_LOST' });
  });

  it('ignores the other messages on the rider socket, and anything malformed', () => {
    expect(parseDutyStatusMessage({ type: 'NEW_ORDER_DISPATCH', orderId: 'o-1' })).toBeNull();
    expect(parseDutyStatusMessage({ type: 'DUTY_STATUS', status: 'ASLEEP', reason: 'CONNECTED' })).toBeNull();
    expect(parseDutyStatusMessage({ type: 'DUTY_STATUS', status: 'ONLINE' })).toBeNull();
    expect(parseDutyStatusMessage(null)).toBeNull();
    expect(parseDutyStatusMessage('DUTY_STATUS')).toBeNull();
  });
});

describe('isOnDuty', () => {
  it('counts carrying an order as on duty', () => {
    expect(isOnDuty('ONLINE')).toBe(true);
    expect(isOnDuty('ON_DELIVERY')).toBe(true);
    expect(isOnDuty('OFFLINE')).toBe(false);
  });
});

describe('dutyChangeNotice', () => {
  it('explains a server-side demotion and stays quiet about the rider’s own request', () => {
    expect(dutyChangeNotice({ type: 'DUTY_STATUS', status: 'OFFLINE', reason: 'LOCATION_LOST' }))
      .toMatch(/location/i);
    expect(dutyChangeNotice({ type: 'DUTY_STATUS', status: 'OFFLINE', reason: 'SUSPENDED' }))
      .toMatch(/suspended/i);
    expect(dutyChangeNotice({ type: 'DUTY_STATUS', status: 'OFFLINE', reason: 'RIDER_REQUEST' })).toBeNull();
    expect(dutyChangeNotice({ type: 'DUTY_STATUS', status: 'ONLINE', reason: 'CONNECTED' })).toBeNull();
  });
});

describe('applyDutyStatus', () => {
  it('flips a screen that still says Online when the server has the rider offline, and says why', () => {
    const setIsOnline = vi.fn();
    const showToast = vi.fn();

    applyDutyStatus({ type: 'DUTY_STATUS', status: 'OFFLINE', reason: 'LOCATION_LOST' },
      { wasOnline: true, setIsOnline, showToast });

    expect(setIsOnline).toHaveBeenCalledWith(false);
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/location/i));
  });

  it('does not nag a rider already looking at Offline when the reconnect snapshot agrees', () => {
    const setIsOnline = vi.fn();
    const showToast = vi.fn();

    applyDutyStatus({ type: 'DUTY_STATUS', status: 'OFFLINE', reason: 'CONNECTED' },
      { wasOnline: false, setIsOnline, showToast });

    expect(setIsOnline).toHaveBeenCalledWith(false);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('keeps a rider on delivery on duty', () => {
    const setIsOnline = vi.fn();
    applyDutyStatus({ type: 'DUTY_STATUS', status: 'ON_DELIVERY', reason: 'CONNECTED' },
      { wasOnline: true, setIsOnline, showToast: vi.fn() });
    expect(setIsOnline).toHaveBeenCalledWith(true);
  });
});

describe('reactToLocationError', () => {
  const deps = () => ({
    goOffline: vi.fn().mockResolvedValue(true),
    setHasLocationFix: vi.fn(),
    setShowPermissionsPrompt: vi.fn(),
    showToast: vi.fn(),
  });

  it('does not end the shift for a transient error: it only drops the location fix', async () => {
    const d = deps();
    await reactToLocationError(UNAVAILABLE, d);
    expect(d.setHasLocationFix).toHaveBeenCalledWith(false);
    expect(d.goOffline).not.toHaveBeenCalled();
    expect(d.setShowPermissionsPrompt).not.toHaveBeenCalled();
  });

  it('ends the shift on a denial once the server accepts, and asks for permission again', async () => {
    const d = deps();
    await reactToLocationError(DENIED, d);
    expect(d.goOffline).toHaveBeenCalled();
    expect(d.setShowPermissionsPrompt).toHaveBeenCalledWith(true);
  });

  it('tells a rider mid-delivery that location is needed when the server refuses to take them off duty', async () => {
    const d = deps();
    d.goOffline.mockResolvedValue(false);
    await reactToLocationError(DENIED, d);
    expect(d.setShowPermissionsPrompt).not.toHaveBeenCalled();
    expect(d.showToast).toHaveBeenCalledWith(expect.stringMatching(/finish this delivery/i));
  });
});

describe('apiErrorMessage', () => {
  it('prefers the server’s reason', () => {
    expect(apiErrorMessage({ response: { data: { message: 'Biometric verification required' } } }, 'x'))
      .toBe('Biometric verification required');
    expect(apiErrorMessage(new Error('network'), 'Could not go online.')).toBe('Could not go online.');
  });
});
