/**
 * authStore.ts — High-level auth operations.
 * Re-exports everything from tokenStore for backward compatibility.
 * Only this file imports apiClient (for the logout API call).
 * tokenStore → apiClient → tokenStore: NO cycle.
 * authStore → apiClient → tokenStore: NO cycle.
 */

// Re-export everything from tokenStore so existing imports still work
export {
    clearAllLocalData, clearToken, decodeJwt, getToken, getUserProfile, setToken, setUserProfile
} from './tokenStore';

import { identityApi } from '../lib/zodiosClients';
import { clearAllLocalData } from './tokenStore';

export const logout = async () => {
  // Send logout to backend BEFORE clearing the token,
  // because apiPost reads the auth token from localStorage.
  try {
    //  Temporarily bypass for API mismatch/TS2589
    await identityApi.auth.post('/api/v1/internal/auth/logout', undefined as unknown as Parameters<typeof identityApi.auth.post>[1]);
  } catch (e) {
    console.error('Logout API call failed', e);
  }
  // Now clear ALL local state
  clearAllLocalData();
};
