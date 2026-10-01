import { useEffect, useRef, useState } from 'react';
import { logout } from '@/lib/authStore';
import { clearAllLocalData, decodeJwt, getToken, setToken, setUserProfile } from '@/lib/tokenStore';
import type { LocalUserProfile } from '@/lib/tokenStore';
import { env } from '@/lib/env';
import { otpSchema, phoneSchema as phoneNumberSchema } from '@/lib/zod-schemas';
import { identityApi } from '@/lib/zodiosClients';
import { getDeviceHeaders } from '@/lib/zodiosConfig';
import { RoleName, UserRole } from '@/types';
import type { Session } from '@features/identity/components/SessionManagementModal';

/**
 * The whole OTP login flow: send, verify, resend, the active-session collision and the
 * complete-your-profile detour.
 *
 * It keeps the normal initiate-and-verify flow as the source of truth. A Dev server may advertise
 * a narrowly scoped autofill capability on that initiate response; production never advertises it.
 */

const DEV_OTP_CAPABILITY_HEADER = 'X-Dev-OTP-Available';
const DEV_OTP_LOOKUP_PATH = '/api/v1/internal/auth/admin/otp';
const DEV_OTP_UNAVAILABLE_MESSAGE =
  'Development autofill is unavailable. You can still enter the code sent to your phone.';
const OTP_INITIATE_TIMEOUT_MS = 15_000;
const DEV_OTP_LOOKUP_TIMEOUT_MS = 5_000;

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type OtpRequestResult = {
  current: boolean;
  error?: unknown;
};

const roleToServiceName = (role: UserRole): string => {
  switch (role) {
    case RoleName.CUSTOMER: return RoleName.CUSTOMER;
    case RoleName.RESTAURANT: return RoleName.RESTAURANT;
    case RoleName.DELIVERY: return RoleName.DELIVERY;
    case RoleName.ADMIN: return RoleName.ADMIN;
    default: return RoleName.CUSTOMER;
  }
};

const apiUrl = (path: string, query?: Record<string, string>): string => {
  const baseUrl = env.VITE_API_BASE_URL || window.location.origin;
  const url = new URL(path, new URL(baseUrl, window.location.origin));
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};

const responseBody = async <T>(response: Response): Promise<ApiResponse<T> | null> => {
  try {
    return await response.json() as ApiResponse<T>;
  } catch {
    return null;
  }
};

/** Keep the small header-aware requests aligned with the shared identity client. */
const identityRequestHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = getToken();
  return {
    Accept: 'application/json',
    ...extra,
    ...getDeviceHeaders(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * The capability header comes from the same normal initiate request that created the OTP. The
 * shared Zodios clients intentionally expose parsed bodies rather than headers, so this small
 * request stays here instead of adding Dev-only plumbing to every generated API client.
 */
const initiateOtp = async (
  phoneNumber: string,
  serviceName: string,
  signal: AbortSignal,
): Promise<boolean> => {
  // eslint-disable-next-line no-restricted-syntax -- response headers are not available through the shared Zodios client
  const response = await fetch(apiUrl('/api/v1/internal/auth/initiate', { phoneNumber }), {
    method: 'POST',
    headers: identityRequestHeaders({ 'X-Calling-Service': serviceName }),
    // Axios, used by the shared Zodios client, does not opt into browser cookies by default.
    credentials: 'omit',
    signal,
  });
  const body = await responseBody<unknown>(response);
  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || body?.error || 'Failed to send OTP. Is the backend running?');
  }
  return response.headers.get(DEV_OTP_CAPABILITY_HEADER) === 'true';
};

const retrieveDevOtp = async (
  phoneNumber: string,
  serviceName: string,
  signal: AbortSignal,
): Promise<string> => {
  // eslint-disable-next-line no-restricted-syntax -- Dev OTP lookup is not modelled in the shared Zodios client
  const response = await fetch(apiUrl(DEV_OTP_LOOKUP_PATH, { phoneNumber, serviceName }), {
    method: 'GET',
    cache: 'no-store',
    headers: identityRequestHeaders(),
    credentials: 'omit',
    signal,
  });
  const body = await responseBody<string>(response);
  const otp = body?.data;
  if (!response.ok || body?.success === false || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    throw new Error('Development OTP lookup was unavailable');
  }
  return otp;
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
  const [isRegistration, setIsRegistration] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showDevOtpNotification, setShowDevOtpNotification] = useState(false);
  const [devOtpLookupError, setDevOtpLookupError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingLoginData, setPendingLoginData] =
    useState<{ id?: string; phone?: string; role?: string; name?: string } | null>(null);
  const otpRequestVersion = useRef(0);
  const otpInitiate = useRef<AbortController | null>(null);
  const devOtpLookup = useRef<AbortController | null>(null);

  useEffect(() => () => {
    // Prevent a late OTP request from trying to update an unmounted login screen.
    otpRequestVersion.current += 1;
    otpInitiate.current?.abort();
    devOtpLookup.current?.abort();
  }, []);

  // Landing on login means the local session is gone. Clear the backend one too, for the
  // case where it is still alive there.
  useEffect(() => {
    if (getToken()) logout().catch(console.error);
    else clearAllLocalData();
  }, []);

  useEffect(() => {
    if (!generatedOtp) {
      // Notification visibility tracks generatedOtp; the empty case is handled by the
      // conditional rendering in the component, not by a synchronous setState here.
      return;
    }
    const timer = window.setTimeout(() => setShowDevOtpNotification(true), 1000);
    return () => {
      window.clearTimeout(timer);
      setShowDevOtpNotification(false);
    };
  }, [generatedOtp]);

  const resetDevOtp = () => {
    otpRequestVersion.current += 1;
    otpInitiate.current?.abort();
    otpInitiate.current = null;
    devOtpLookup.current?.abort();
    devOtpLookup.current = null;
    setGeneratedOtp('');
    setShowDevOtpNotification(false);
    setDevOtpLookupError('');
    return otpRequestVersion.current;
  };

  /** Ask for an OTP. Written once; send and resend both call it. */
  const requestOtp = async (role: UserRole): Promise<OtpRequestResult> => {
    const serviceName = roleToServiceName(role);
    const requestVersion = resetDevOtp();
    const initiateController = new AbortController();
    let initiateTimedOut = false;
    const initiateTimeout = window.setTimeout(() => {
      initiateTimedOut = true;
      initiateController.abort();
    }, OTP_INITIATE_TIMEOUT_MS);
    otpInitiate.current = initiateController;
    let devOtpAvailable: boolean;
    try {
      devOtpAvailable = await initiateOtp(phoneNumber, serviceName, initiateController.signal);
    } catch (error) {
      // Going back or changing role invalidates this request. Its late error should not appear on
      // the new screen, nor should it flip that screen into the OTP step.
      return {
        current: requestVersion === otpRequestVersion.current,
        error: initiateTimedOut ? new Error('OTP request timed out. Please try again.') : error,
      };
    } finally {
      window.clearTimeout(initiateTimeout);
      if (requestVersion === otpRequestVersion.current) {
        otpInitiate.current = null;
      }
    }
    if (requestVersion !== otpRequestVersion.current) return { current: false };
    if (!devOtpAvailable) return { current: true };

    const lookupController = new AbortController();
    const lookupTimeout = window.setTimeout(() => lookupController.abort(), DEV_OTP_LOOKUP_TIMEOUT_MS);
    devOtpLookup.current = lookupController;
    void retrieveDevOtp(phoneNumber, serviceName, lookupController.signal)
      .then((otp) => {
        if (requestVersion === otpRequestVersion.current) {
          setGeneratedOtp(otp);
        }
      })
      .catch(() => {
        // A reset increments the request version before it aborts the fetch, so only the current
        // login attempt receives an advisory error. The normal OTP remains usable either way.
        if (requestVersion === otpRequestVersion.current) {
          setDevOtpLookupError(DEV_OTP_UNAVAILABLE_MESSAGE);
        }
      })
      .finally(() => {
        window.clearTimeout(lookupTimeout);
        if (requestVersion === otpRequestVersion.current) {
          devOtpLookup.current = null;
        }
      });
    return { current: true };
  };

  /** Finish a successful verification, or divert to the profile form when it is incomplete. */
  const completeLogin = async (token: string, role: UserRole) => {
    resetDevOtp();
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
    const result = await requestOtp(selectedRole!);
    if (result.current) {
      if (result.error) {
        setError(messageOf(result.error, 'Failed to send OTP. Is the backend running?'));
      } else {
        setOtpSent(true);
      }
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setOtpCode('');
    setLoading(true);
    const result = await requestOtp(selectedRole!);
    if (result.current) {
      if (result.error) {
        setError(messageOf(result.error, 'Failed to resend OTP.'));
      }
      setLoading(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const validation = otpSchema.safeParse(otpCode);
    if (!validation.success) return setError(validation.error.issues[0].message);

    setLoading(true);
    const path = isRegistration ? '/api/v1/internal/auth/register' : '/api/v1/internal/auth/verify';
    onAddApiLog?.({ id: 'auth_verify', label: `POST ${path}`, method: 'POST' });
    try {
      const resp = await identityApi.auth.post(path, undefined, {
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
    resetDevOtp();
    setLoading(false);
    if (otpSent) {
      setOtpSent(false);
      setOtpCode('');
    } else {
      setSelectedRole(null);
      setIsRegistration(false);
      setPhone('');
    }
    setError('');
  };

  const selectRole = (role: UserRole) => {
    resetDevOtp();
    setLoading(false);
    setSelectedRole(role);
    setIsRegistration(false);
    setOtpSent(false);
    setOtpCode('');
    setError('');
  };

  const toggleRegistration = () => {
    if (!selectedRole || selectedRole === RoleName.ADMIN || loading || otpSent) return;
    resetDevOtp();
    setIsRegistration((current) => !current);
    setOtpCode('');
    setError('');
  };

  const autofillOtp = () => {
    if (!generatedOtp) return;
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
    selectedRole, selectRole, isRegistration, toggleRegistration,
    phoneNumber, setPhone,
    otpSent, otpCode, setOtpCode, generatedOtp,
    canAutofillOtp: generatedOtp.length === 6,
    showDevOtpNotification, devOtpLookupError,
    error, loading,
    showSessionModal, setShowSessionModal, activeSessions,
    showProfileModal, pendingLoginData,
    serviceName: selectedRole ? roleToServiceName(selectedRole) : '',
    sendOtp, verifyOtp, resendOtp, autofillOtp, back,
    onSessionResolved, onProfileCompleted,
  };
}
