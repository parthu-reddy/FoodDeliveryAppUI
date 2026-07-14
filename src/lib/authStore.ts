export const setToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const clearToken = () => {
  localStorage.removeItem('auth_token');
};

import { apiPost } from './apiClient';

export const logout = async () => {
  try {
    await apiPost('/api/v1/internal/auth/logout', {});
  } catch (e) {
    console.error('Logout API call failed', e);
  }
  clearToken();
  localStorage.removeItem('user_profile');
  memoryProfile = null;
};

let memoryProfile: any = null;

export const setUserProfile = (profile: any) => {
  memoryProfile = profile;
  localStorage.setItem('user_profile', JSON.stringify(profile));
};

export const getUserProfile = (): any | null => {
  if (memoryProfile) return memoryProfile;

  // Try localStorage first (survives hard refresh)
  const stored = localStorage.getItem('user_profile');
  if (stored) {
    try {
      memoryProfile = JSON.parse(stored);
      return memoryProfile;
    } catch {}
  }

  // Fallback: decode from JWT
  const token = getToken();
  if (token) {
    const decoded = decodeJwt(token);
    if (decoded && decoded.sub) {
      // JWT uses `roles` (array), not `role` (string)
      const role = Array.isArray(decoded.roles) && decoded.roles.length > 0
        ? decoded.roles[0].toLowerCase()
        : (decoded.role || 'customer').toLowerCase();
      const profile = { phone: decoded.phone || decoded.sub, role, name: decoded.name || '' };
      setUserProfile(profile);
      return profile;
    }
  }
  return null;
};

export const decodeJwt = (token: string) => {
  try {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};
