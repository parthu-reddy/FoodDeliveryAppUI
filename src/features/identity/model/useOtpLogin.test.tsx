import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';
import { RoleName } from '@/types';

const { post, profile, setToken } = vi.hoisted(() => ({ post: vi.fn(), profile: vi.fn(), setToken: vi.fn() }));
vi.mock('@/lib/zodiosClients', () => ({ identityApi: { auth: { post }, user: { get: profile } } }));
vi.mock('@/lib/authStore', () => ({ logout: vi.fn() }));
vi.mock('@/lib/env', () => ({ env: { VITE_API_BASE_URL: 'http://localhost' } }));
vi.mock('@/lib/zodiosConfig', () => ({ getDeviceHeaders: () => ({}) }));
vi.mock('@/lib/tokenStore', () => ({
  getToken: () => null, setToken, clearAllLocalData: vi.fn(), setUserProfile: vi.fn(),
  decodeJwt: () => ({ sub: 'new-user' }),
}));
import { useOtpLogin } from './useOtpLogin';
const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

describe('OTP login and explicit registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({ data: 'token' });
    profile.mockResolvedValue({ data: { name: 'Test', email: 'test@example.com' } });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) =>
      url.includes('/admin/otp')
        ? new Response(JSON.stringify({ success: true, data: '123456' }), { status: 200 })
        : new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'X-Dev-OTP-Available': 'true' } })));
  });

  it.each(['', '1', '1234567', '12345678', '123456789', '12345678901', 'abcdefghij'])(
    'rejects phone %s before requesting an OTP', async (phone) => {
      const { result } = renderHook(() => useOtpLogin({ onLoginSuccess: vi.fn() }));
      act(() => { result.current.selectRole(RoleName.CUSTOMER); result.current.setPhone(phone); });
      await act(async () => result.current.sendOtp(event));
      expect(result.current.error).not.toBe('');
      expect(result.current.otpSent).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
    },
  );

  it.each(['', '1', '123', '12345', '1234567', 'abcdef'])(
    'rejects OTP %s before verification or session creation', async (otp) => {
      const { result } = renderHook(() => useOtpLogin({ onLoginSuccess: vi.fn() }));
      act(() => { result.current.selectRole(RoleName.CUSTOMER); result.current.setPhone('8000000001');
        result.current.setOtpCode(otp); });
      await act(async () => result.current.verifyOtp(event));
      expect(result.current.error).not.toBe('');
      expect(post).not.toHaveBeenCalled();
      expect(setToken).not.toHaveBeenCalled();
    },
  );

  it.each([
    [RoleName.CUSTOMER, '8999123456'],
    [RoleName.DELIVERY, '7999123456'],
    [RoleName.RESTAURANT, '9999123456'],
  ])('enrolls %s through signup after normal OTP initiation and Dev autofill', async (role, phone) => {
    const success = vi.fn();
    const { result } = renderHook(() => useOtpLogin({ onLoginSuccess: success }));
    act(() => { result.current.selectRole(role); result.current.setPhone(phone); });
    act(() => result.current.toggleRegistration());
    await act(async () => result.current.sendOtp(event));
    await waitFor(() => expect(result.current.canAutofillOtp).toBe(true));
    act(() => result.current.autofillOtp());
    await act(async () => result.current.verifyOtp(event));
    expect(post).toHaveBeenCalledWith('/api/v1/internal/auth/register', undefined, {
      queries: { phoneNumber: phone, otp: '123456' }, headers: { 'X-Calling-Service': role },
    });
    expect(setToken).toHaveBeenCalledWith('token');
    expect(success).toHaveBeenCalledWith(role, phone, 'Test');
  });

  it('keeps admin on the login endpoint and clears signup intent when changing portals', async () => {
    const { result } = renderHook(() => useOtpLogin({ onLoginSuccess: vi.fn() }));
    act(() => result.current.selectRole(RoleName.DELIVERY));
    act(() => result.current.toggleRegistration());
    expect(result.current.isRegistration).toBe(true);
    act(() => result.current.selectRole(RoleName.ADMIN));
    act(() => { result.current.toggleRegistration(); result.current.setPhone('1000000001'); result.current.setOtpCode('123456'); });
    expect(result.current.isRegistration).toBe(false);
    await act(async () => result.current.verifyOtp(event));
    expect(post.mock.calls[0][0]).toBe('/api/v1/internal/auth/verify');
  });

  it('does not finish signup when verification is rejected', async () => {
    post.mockRejectedValue({ response: { data: { message: 'Invalid or expired OTP' } } });
    const success = vi.fn();
    const { result } = renderHook(() => useOtpLogin({ onLoginSuccess: success }));
    act(() => result.current.selectRole(RoleName.RESTAURANT));
    act(() => { result.current.toggleRegistration(); result.current.setPhone('9999123456'); result.current.setOtpCode('999999'); });
    await act(async () => result.current.verifyOtp(event));
    expect(result.current.error).toBe('Invalid or expired OTP');
    expect(setToken).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
  });
  it.each([false, true])('shows the device collision for Axios login/signup errors (signup=%s)', async (signup) => {
    const devices = [
      { sessionId: 'first', deviceInfo: 'Mac', os: 'MacOS', browser: 'Chrome', lastActive: 1 },
      { sessionId: 'second', deviceInfo: 'Windows', os: 'Windows', browser: 'Firefox', lastActive: 2 },
    ];
    post.mockRejectedValue({ response: { status: 409, data: {
      success: false, message: 'Maximum concurrent sessions reached', data: { activeSessions: devices },
    } } });
    const success = vi.fn();
    const { result } = renderHook(() => useOtpLogin({ onLoginSuccess: success }));
    act(() => result.current.selectRole(RoleName.CUSTOMER));
    if (signup) act(() => result.current.toggleRegistration());
    act(() => { result.current.setPhone('8999123456'); result.current.setOtpCode('123456'); });
    await act(async () => result.current.verifyOtp(event));
    expect(post.mock.calls[0][0]).toBe(signup ? '/api/v1/internal/auth/register' : '/api/v1/internal/auth/verify');
    expect(result.current.showSessionModal).toBe(true);
    expect(result.current.activeSessions).toEqual(devices);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(setToken).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    // Closing the collision does not authenticate or send a device-removal request.
    act(() => result.current.setShowSessionModal(false));
    expect(result.current.showSessionModal).toBe(false);
    expect(post).toHaveBeenCalledTimes(1);
    expect(setToken).not.toHaveBeenCalled();
    // A successful explicit replacement uses the ordinary login completion path.
    await act(async () => result.current.onSessionResolved('replacement-token'));
    expect(setToken).toHaveBeenCalledWith('replacement-token');
    expect(success).toHaveBeenCalledWith(RoleName.CUSTOMER, '8999123456', 'Test');
  });

  it('keeps a malformed conflict as an error without exposing an empty collision dialog', async () => {
    post.mockRejectedValue({ response: { status: 409, data: { message: 'Invalid session response', data: {} } } });
    const { result } = renderHook(() => useOtpLogin({ onLoginSuccess: vi.fn() }));
    act(() => { result.current.selectRole(RoleName.CUSTOMER); result.current.setPhone('8999123456'); result.current.setOtpCode('123456'); });
    await act(async () => result.current.verifyOtp(event));
    expect(result.current.showSessionModal).toBe(false);
    expect(result.current.error).toBe('Invalid session response');
    expect(setToken).not.toHaveBeenCalled();
  });

});
