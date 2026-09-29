import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePolling } from './usePolling';

describe('usePolling', () => {
  it('fetches immediately when the request key changes', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    const { rerender } = renderHook(
      ({ refreshKey }) => usePolling({
        fetchFn,
        intervalMs: 60_000,
        enabled: true,
        refreshKey,
      }),
      { initialProps: { refreshKey: 'open:0' } },
    );

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    rerender({ refreshKey: 'resolved:0' });

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
  });

  it('identifies the request key that produced retained data while a replacement request loads', async () => {
    let resolveReplacement: ((value: string) => void) | undefined;
    const fetchFn = vi.fn()
      .mockResolvedValueOnce('first result')
      .mockImplementationOnce(() => new Promise<string>((resolve) => {
        resolveReplacement = resolve;
      }));
    const { result, rerender } = renderHook(
      ({ refreshKey }) => usePolling({
        fetchFn,
        intervalMs: 60_000,
        enabled: true,
        refreshKey,
      }),
      { initialProps: { refreshKey: 'order-a' } },
    );

    await waitFor(() => expect(result.current.data).toBe('first result'));
    expect(result.current.dataRefreshKey).toBe('order-a');

    rerender({ refreshKey: 'order-b' });

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
    expect(result.current.data).toBe('first result');
    expect(result.current.dataRefreshKey).toBe('order-a');

    resolveReplacement?.('second result');

    await waitFor(() => expect(result.current.data).toBe('second result'));
    expect(result.current.dataRefreshKey).toBe('order-b');
  });
});
