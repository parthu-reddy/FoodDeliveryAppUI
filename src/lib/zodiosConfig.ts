import { ZodiosOptions, ZodiosPlugin } from '@zodios/core';
import { isAxiosError } from 'axios';
import { logger } from './logger';
import { clearAllLocalData, getToken } from './tokenStore';

export const getDeviceHeaders = () => {
  const userAgent = navigator.userAgent;
  let os = "Unknown OS";
  if (userAgent.indexOf("Win") !== -1) os = "Windows";
  if (userAgent.indexOf("Mac") !== -1) os = "MacOS";
  if (userAgent.indexOf("Linux") !== -1) os = "Linux";
  if (userAgent.indexOf("Android") !== -1) os = "Android";
  if (userAgent.indexOf("like Mac") !== -1) os = "iOS";

  let browser = "Unknown Browser";
  if (userAgent.indexOf("Chrome") !== -1) browser = "Chrome";
  else if (userAgent.indexOf("Safari") !== -1) browser = "Safari";
  else if (userAgent.indexOf("Firefox") !== -1) browser = "Firefox";

  return {
    'X-Device-Info': userAgent,
    'X-Device-OS': os,
    'X-Device-Browser': browser
  };
};

/**
 * Zodios Plugin that automatically attaches the bearer token and device headers
 * to every request.
 */
export const authPlugin: ZodiosPlugin = {
  request: async (api, config) => {
    const token = getToken();
    
    return {
      ...config,
      headers: {
        'Accept': 'application/json',
        ...(config.headers || {}),
        ...getDeviceHeaders(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  },
  error: async (api, config, error) => {
    // If we get an error response with 401 Unauthorized, and it's not the auth endpoint itself,
    // we should log out the user.
    // Zodios/Axios attaches the response to error.response if it's an Axios error
    if (isAxiosError(error)) {
      if (
        error.response?.status === 401 && 
        !config.url?.includes('/api/v1/internal/auth/')
      ) {
        logger.warn('Unauthorized API access via Zodios, clearing session', { url: config.url });
        clearAllLocalData();
        window.location.href = '/';
      }
      
      // Log server errors
      if (error.response?.status && error.response.status >= 500) {
        logger.error('HTTP 5xx Server Error via Zodios', { status: error.response.status, url: config.url });
      }
    }
    
    throw error;
  },
  response: async (api, config, response) => {
    // Note: Do NOT unwrap the ApiResponse here. 
    // Zodios returns the response body directly, and the UI code correctly 
    // expects it to be an ApiResponse wrapper and accesses `.data` on it.
    return response;
  }
};

/**
 * Common Zodios configuration to apply to all our client instances.
 */
export const commonZodiosConfig: ZodiosOptions = {
  // Disable validation because the current OpenAPI generation produced `z.void()` for all responses, 
  // which causes valid responses to fail validation and crash the app.
  validate: false,
};
