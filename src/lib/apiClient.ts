import { getToken, clearAllLocalData } from './tokenStore';
import { logger } from './logger';

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '';

const getDeviceHeaders = () => {
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

export class ApiError extends Error {
  public status: number;
  public data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const handleHttpError = async (res: Response) => {
  let errorMessage = `HTTP ${res.status}`;
  let errorData = null;
  try {
    const body = await res.json();
    errorData = body;
    if (body?.message) errorMessage = body.message;
    else if (typeof body === 'string') errorMessage = body;
  } catch { /* body wasn't json */ }

  // Auto-redirect on 401 for non-auth endpoints (invalid session or missing user)
  if (res.status === 401 && !res.url.includes('/api/v1/internal/auth/')) {
    logger.warn('Unauthorized API access, clearing session', { url: res.url });
    clearAllLocalData();
    window.location.href = '/';
  } else if (res.status >= 500) {
    logger.error(`HTTP 5xx Server Error`, { status: res.status, url: res.url, errorMessage });
  } else if (res.status >= 400) {
    logger.warn(`HTTP 4xx Client Error`, { status: res.status, url: res.url, errorMessage });
  }
  
  throw new ApiError(errorMessage, res.status, errorData);
};

export const apiGet = async (path: string, customHeaders?: Record<string, string>) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...getDeviceHeaders()
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers });
  } catch (error) {
    logger.error(`Network or CORS failure for GET ${BASE_URL}${path}`, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }

  if (!res.ok) {
    await handleHttpError(res);
  }
  return res.json();
};

export const apiPost = async (path: string, body?: any, customHeaders?: Record<string, string>) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...getDeviceHeaders()
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    logger.error(`Network or CORS failure for POST ${BASE_URL}${path}`, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  
  if (!res.ok) await handleHttpError(res);
  
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

export const apiPut = async (path: string, body?: any, customHeaders?: Record<string, string>) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...getDeviceHeaders()
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    logger.error(`Network or CORS failure for PUT ${BASE_URL}${path}`, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  
  if (!res.ok) await handleHttpError(res);
  
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

export const apiDelete = async (path: string, customHeaders?: Record<string, string>) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...getDeviceHeaders()
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers
    });
  } catch (error) {
    logger.error(`Network or CORS failure for DELETE ${BASE_URL}${path}`, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  
  if (!res.ok) await handleHttpError(res);
  
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

export const apiPostFormData = async (path: string, formData: FormData, customHeaders?: Record<string, string>) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...getDeviceHeaders()
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData
    });
  } catch (error) {
    logger.error(`Network or CORS failure for POST FormData ${BASE_URL}${path}`, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  
  if (!res.ok) await handleHttpError(res);
  
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};
