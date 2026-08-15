/**
 * authStore.ts — High-level auth operations.
 * Re-exports everything from tokenStore for backward compatibility.
 * Only this file imports apiClient (for the logout API call).
 * tokenStore → apiClient → tokenStore: NO cycle.
 * authStore → apiClient → tokenStore: NO cycle.
 */

// Re-export everything from tokenStore so existing imports still work
export {
  setToken,
  getToken,
  clearToken,
  setUserProfile,
  getUserProfile,
  decodeJwt,
  clearAllLocalData
} from './tokenStore';

import { clearAllLocalData } from './tokenStore';
import { identityApi } from '../lib/zodiosClients';

export const logout = async () => {
  // Send logout to backend BEFORE clearing the token,
  // because apiPost reads the auth token from localStorage.
  try {
    // @ts-expect-error Temporarily bypass for API mismatch/TS2589
    await identityApi.post('/api/v1/internal/auth/logout', {});
  } catch (e) {
    console.error('Logout API call failed', e);
  }
  // Now clear ALL local state
  clearAllLocalData();
};
