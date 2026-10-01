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
});
