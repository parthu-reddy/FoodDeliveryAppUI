import { RoleName } from '../types';
/**
 * tokenStore.ts — Pure localStorage operations for auth state.
 * Has ZERO dependencies on apiClient to avoid circular imports.
 * apiClient.ts imports from here. authStore.ts imports from here + apiClient.
 */

// --- Token ---

export const setToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const clearToken = () => {
  localStorage.removeItem('auth_token');
};

// --- Profile ---

let memoryProfile: any = null;

export const setUserProfile = (profile: any) => {
  memoryProfile = profile;
  localStorage.setItem('user_profile', JSON.stringify(profile));
};

export const getUserProfile = (): any | null => {
  if (memoryProfile) return memoryProfile;

  const stored = localStorage.getItem('user_profile');
  if (stored) {
    try {
      memoryProfile = JSON.parse(stored);
      if (!memoryProfile.id) {
        const token = getToken();
        if (token) {
          const decoded = decodeJwt(token);
          if (decoded && decoded.sub) {
            memoryProfile.id = decoded.sub;
            setUserProfile(memoryProfile);
          }
        }
      }
      if (!memoryProfile.phone && memoryProfile.phoneNumber) {
        memoryProfile.phone = memoryProfile.phoneNumber;
      }
      
      return memoryProfile;
    } catch {
      // a corrupt/absent stored profile is expected; fall through to the null return
    }
  }

  // Fallback: decode from JWT
  const token = getToken();
  if (token) {
    const decoded = decodeJwt(token);
    if (decoded && decoded.sub) {
      const role = Array.isArray(decoded.roles) && decoded.roles.length > 0
        ? decoded.roles[0].toUpperCase()
        : (decoded.role || RoleName.CUSTOMER).toUpperCase();
      const profile = { id: decoded.sub, phone: decoded.phone || decoded.sub, role, name: decoded.name || '' };
      setUserProfile(profile);
      return profile;
    }
  }
  return null;
};

// --- JWT Decode ---

export const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// --- Full Cleanup ---

export const clearAllLocalData = () => {
  clearToken();
  localStorage.removeItem('user_profile');
  localStorage.removeItem('device_id');
  localStorage.removeItem('deliveryAddressId');
  localStorage.removeItem('food_delivery_cart');
  localStorage.removeItem('food_delivery_cart_restaurant');
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('auth_') || key.startsWith('user_') || key.startsWith('device_') || key.startsWith('session_') || key.startsWith('food_delivery_cart') || key.startsWith('restaurant_') || key.startsWith('order_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  memoryProfile = null;
};
