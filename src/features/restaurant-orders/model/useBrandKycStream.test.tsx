import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerificationStatus, type Brand } from '@/types';

const { fetchEventSource } = vi.hoisted(() => ({
  fetchEventSource: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@microsoft/fetch-event-source', () => ({ fetchEventSource }));

import { useBrandKycStream } from './useBrandKycStream';

const pendingBrand = {
  id: 'brand-1',
  name: 'Pending Brand',
  kycStatus: VerificationStatus.PENDING,
  pennyDropStatus: VerificationStatus.APPROVED,
} as Brand;

describe('useBrandKycStream authentication', () => {
  beforeEach(() => {
    fetchEventSource.mockClear();
    localStorage.clear();
  });

  it('uses the canonical auth token and does not impersonate a calling service', async () => {
    localStorage.setItem('auth_token', 'restaurant-token');

    renderHook(() => useBrandKycStream([pendingBrand], vi.fn()));

    await waitFor(() => expect(fetchEventSource).toHaveBeenCalledTimes(1));
    const options = fetchEventSource.mock.calls[0][1] as { headers: Record<string, string> };
    expect(options.headers.Authorization).toBe('Bearer restaurant-token');
    expect(options.headers).not.toHaveProperty('X-Calling-Service');
  });

  it('does not open an unauthenticated stream', async () => {
    renderHook(() => useBrandKycStream([pendingBrand], vi.fn()));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchEventSource).not.toHaveBeenCalled();
  });
});
