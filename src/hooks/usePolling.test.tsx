import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePolling } from './usePolling';

describe('usePolling', () => {
  it('retains an access denial during a retry and clears it only after success', async () => {
    const denied = new Error('Forbidden');
    let settle: ((value: string) => void) | undefined;
    const fetchFn = vi.fn().mockRejectedValueOnce(denied)
      .mockImplementationOnce(() => new Promise<string>(resolve => { settle = resolve; }));
    const { result } = renderHook(() => usePolling({ fetchFn, intervalMs: 60_000, enabled: true }));
    await waitFor(() => expect(result.current.error).toBe(denied));

    act(() => result.current.refetch());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(denied);

    await act(async () => { settle?.('authorised result'); });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('authorised result');
  });

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

  it('schedules the next poll only after a slow request settles', async () => {
    vi.useFakeTimers();
    try {
      let settle: ((value: string) => void) | undefined;
      const fetchFn = vi.fn()
        .mockImplementationOnce(() => new Promise<string>((resolve) => { settle = resolve; }))
        .mockResolvedValue('next');
      renderHook(() => usePolling({ fetchFn, intervalMs: 1_000, enabled: true }));

      await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
      expect(fetchFn).toHaveBeenCalledTimes(1);

      await act(async () => { settle?.('first'); await vi.advanceTimersByTimeAsync(1_000); });
      expect(fetchFn).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a single polling chain when the key changes while a poll is in flight', async () => {
    vi.useFakeTimers();
    try {
      let settle: ((value: string) => void) | undefined;
      const fetchFn = vi.fn()
        .mockResolvedValueOnce('first')
        .mockImplementationOnce(() => new Promise<string>((resolve) => { settle = resolve; }))
        .mockResolvedValue('next');
      const { rerender } = renderHook(
        ({ refreshKey }) => usePolling({ fetchFn, intervalMs: 1_000, enabled: true, refreshKey }),
        { initialProps: { refreshKey: 'a' } },
      );
      await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
      expect(fetchFn).toHaveBeenCalledTimes(2);

      rerender({ refreshKey: 'b' });
      await act(async () => { settle?.('stale'); await vi.advanceTimersByTimeAsync(0); });
      const settled = fetchFn.mock.calls.length;

      await act(async () => { await vi.advanceTimersByTimeAsync(3_000); });
      expect(fetchFn.mock.calls.length - settled).toBe(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
