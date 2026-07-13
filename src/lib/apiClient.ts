import { getToken, clearToken } from './authStore';

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '';

const handleHttpError = async (res: Response) => {
  let errorMessage = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    if (body?.message) errorMessage = body.message;
    else if (typeof body === 'string') errorMessage = body;
  } catch { /* body wasn't json */ }

  // Only auto-redirect on 401 for non-auth endpoints (expired session)
  if (res.status === 401 && !res.url.includes('/api/v1/internal/auth/')) {
    clearToken();
    window.location.href = '/';
  }
  throw new Error(errorMessage);
};

export const apiGet = async (path: string, customHeaders?: Record<string, string>) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) await handleHttpError(res);
  return res.json();
};

export const apiPost = async (path: string, body?: any, customHeaders?: Record<string, string>) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
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
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
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
    'Accept': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers
  });
  
  if (!res.ok) await handleHttpError(res);
  
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};
