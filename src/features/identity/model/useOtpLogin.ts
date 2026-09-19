import { useEffect, useState } from 'react';
import { logout } from '@/lib/authStore';
import { clearAllLocalData, decodeJwt, getToken, setToken, setUserProfile } from '@/lib/tokenStore';
import type { LocalUserProfile } from '@/lib/tokenStore';
import { otpSchema, phoneSchema as phoneNumberSchema } from '@/lib/zod-schemas';
import { identityApi } from '@/lib/zodiosClients';
import { RoleName, UserRole } from '@/types';
import type { Session } from '@features/identity/components/SessionManagementModal';

/**
 * The whole OTP login flow: send, verify, resend, the active-session collision and the
 * complete-your-profile detour.
 *
 * It lived inside a 470-line `LoginScreen` alongside the markup, which is why the same
 * "initiate, then fetch the dev OTP" sequence was written twice — once for send and once for
 * resend — and had already drifted: only one of them re-showed the notification.
 */

const DEV_OTP_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_OTP === 'true';

const roleToServiceName = (role: UserRole): string => {
  switch (role) {
    case RoleName.CUSTOMER: return RoleName.CUSTOMER;
    case RoleName.RESTAURANT: return RoleName.RESTAURANT;
    case RoleName.DELIVERY: return RoleName.DELIVERY;
    case RoleName.ADMIN: return RoleName.ADMIN;
    default: return RoleName.CUSTOMER;
  }
};

/** An axios-shaped error, narrowed to the two places this API puts its message. */
const messageOf = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e.response?.data?.message || e.response?.data?.error || e.message || fallback;
};

type ApiLogger = ((log: unknown) => void) | undefined;

interface UseOtpLoginOptions {
  onLoginSuccess: (role: UserRole, phoneNumber: string, name: string) => void;
  onAddApiLog?: ApiLogger;
}

export function useOtpLogin({ onLoginSuccess, onAddApiLog }: UseOtpLoginOptions) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [phoneNumber, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingLoginData, setPendingLoginData] =
    useState<{ id?: string; phone?: string; role?: string; name?: string } | null>(null);

  // Landing on login means the local session is gone. Clear the backend one too, for the
  // case where it is still alive there.
  useEffect(() => {
    if (getToken()) logout().catch(console.error);
    else clearAllLocalData();
  }, []);

  useEffect(() => {
    if (!otpSent || !generatedOtp || !DEV_OTP_ENABLED) return;
    const timer = setTimeout(() => setShowNotification(true), 1000);
    return () => clearTimeout(timer);
  }, [otpSent, generatedOtp]);

  /** Ask for an OTP. Written once; send and resend both call it. */
  const requestOtp = async (role: UserRole) => {
    const serviceName = roleToServiceName(role);
    await identityApi.auth.post('/api/v1/internal/auth/initiate', undefined, {
      queries: { phoneNumber },
      headers: { 'X-Calling-Service': serviceName },
    });
    if (!DEV_OTP_ENABLED) return;
    try {
      const adminResp = await identityApi.adminOtp.get('/api/v1/internal/auth/admin/otp', {
        queries: { phoneNumber, serviceName },
      });
      if (adminResp?.data) setGeneratedOtp(adminResp.data);
      else if (typeof adminResp === 'string') setGeneratedOtp(adminResp);
    } catch {
      console.warn('Could not fetch OTP from admin endpoint.');
    }
  };

  /** Finish a successful verification, or divert to the profile form when it is incomplete. */
  const completeLogin = async (token: string, role: UserRole) => {
    setToken(token);
    const decoded = decodeJwt(token);
    const name = decoded?.name || decoded?.phoneNumber || phoneNumber;
    const id = decoded?.sub;
    setUserProfile({ id, phone: phoneNumber, role, name });

    try {
      const profileResp = await identityApi.user.get('/api/v1/users/profile', {
        headers: { 'X-User-Id': '' },
      });
      const p = profileResp?.data;
      if (!p?.name || !p?.email || p.name.trim() === '' || p.email.trim() === '') {
        setPendingLoginData({ id, phone: phoneNumber, role, name });
        setShowProfileModal(true);
        return;
      }
      setUserProfile({ id, phone: phoneNumber, role, name: p.name });
      onLoginSuccess(role, phoneNumber, p.name);
    } catch {
      // A profile we cannot read is treated as incomplete: asking again is recoverable,
      // letting someone in without a name is not.
      setPendingLoginData({ id, phone: phoneNumber, role, name });
      setShowProfileModal(true);
    }
  };

  const sendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const validation = phoneNumberSchema.safeParse(phoneNumber);
    if (!validation.success) return setError(validation.error.issues[0].message);

    setLoading(true);
    onAddApiLog?.({ id: 'auth_initiate', label: 'POST /api/v1/internal/auth/initiate', method: 'POST' });
    try {
      await requestOtp(selectedRole!);
      setOtpSent(true);
    } catch (err: unknown) {
      setError(messageOf(err, 'Failed to send OTP. Is the backend running?'));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setShowNotification(false);
    try {
      await requestOtp(selectedRole!);
      if (DEV_OTP_ENABLED) setTimeout(() => setShowNotification(true), 1200);
    } catch (err: unknown) {
      setError(messageOf(err, 'Failed to resend OTP.'));
    }
  };

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const validation = otpSchema.safeParse(otpCode);
    if (!validation.success) return setError(validation.error.issues[0].message);

    setLoading(true);
    onAddApiLog?.({ id: 'auth_verify', label: 'POST /api/v1/internal/auth/verify', method: 'POST' });
    try {
      const resp = await identityApi.auth.post('/api/v1/internal/auth/verify', undefined, {
        queries: { phoneNumber, otp: otpCode },
        headers: { 'X-Calling-Service': roleToServiceName(selectedRole!) },
      });
      const token = resp?.data || resp;
      if (!token || typeof token !== 'string') throw new Error('No token received from server');
      await completeLogin(token, selectedRole!);
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { data?: { activeSessions?: Session[] } } };
      if (e.status === 409 && e.data?.data?.activeSessions) {
        setActiveSessions(e.data.data.activeSessions);
        setShowSessionModal(true);
      } else {
        setError(messageOf(err, 'OTP verification failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  /** Back out one step: from the OTP field to the phone field, or to role selection. */
  const back = () => {
    if (otpSent) {
      setOtpSent(false);
      setOtpCode('');
      setShowNotification(false);
    } else {
      setSelectedRole(null);
      setPhone('');
    }
    setError('');
  };

  const autofillOtp = () => {
    setOtpCode(generatedOtp);
    setError('');
  };

  const onSessionResolved = async (token: string) => {
    setShowSessionModal(false);
    await completeLogin(token, selectedRole!);
  };

  const onProfileCompleted = (p: { name?: string }) => {
    setShowProfileModal(false);
    if (!pendingLoginData) return;
    const finalName = p.name || pendingLoginData.name;
    setUserProfile({
      ...pendingLoginData,
      name: finalName,
      id: pendingLoginData.id || '',
    } as LocalUserProfile);
    onLoginSuccess(
      pendingLoginData.role as UserRole,
      pendingLoginData.phone || '',
      finalName || '',
    );
  };

  return {
    selectedRole, setSelectedRole,
    phoneNumber, setPhone,
    otpSent, otpCode, setOtpCode, generatedOtp,
    showNotification, error, loading,
    showSessionModal, setShowSessionModal, activeSessions,
    showProfileModal, pendingLoginData,
    serviceName: selectedRole ? roleToServiceName(selectedRole) : '',
    sendOtp, verifyOtp, resendOtp, back, autofillOtp,
    onSessionResolved, onProfileCompleted,
  };
}
