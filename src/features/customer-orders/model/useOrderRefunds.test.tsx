import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/zodiosClients', () => ({ customerApi: { customerMoney: { get: vi.fn() } } }));
import { customerApi } from '@/lib/zodiosClients';
import { useOrderRefunds, REFUND_REFRESH_MS } from './useOrderRefunds';
import type { RefundView } from '@/types';
const pending: RefundView = { id: 'r1', amount: 43.35, status: 'PROCESSING', destination: 'ORIGINAL_METHOD' };
const get = vi.mocked(customerApi.customerMoney.get);
const flush = () => act(async () => { await Promise.resolve(); });

describe('order-scoped refund recovery', () => {
  beforeEach(() => { vi.useFakeTimers(); get.mockReset(); });
  afterEach(() => vi.useRealTimers());

  it('distinguishes failed reads from empty success and lets the customer retry', async () => {
    get.mockRejectedValueOnce(new Error('outage')).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useOrderRefunds('order-a', true));
    await flush(); expect(result.current.error).toMatch(/Please retry/);
    expect(result.current.refunds).toEqual([]);
    await act(async () => result.current.retry());
    expect(result.current.error).toBeNull(); expect(get).toHaveBeenCalledTimes(2);
  });

  it('refreshes pending to completed on the same open order and retains last data on failure', async () => {
    get.mockResolvedValueOnce([pending]).mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce([{ ...pending, status: 'COMPLETED' }]);
    const { result } = renderHook(() => useOrderRefunds('order-a', true));
    await flush(); expect(result.current.refunds[0].status).toBe('PROCESSING');
    await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS));
    expect(result.current.error).toBeTruthy(); expect(result.current.refunds[0].status).toBe('PROCESSING');
    await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS));
    expect(result.current.error).toBeNull(); expect(result.current.refunds[0].status).toBe('COMPLETED');
  });

  it('rejects late old-order results and does not leak old refund details across orders', async () => {
    let resolveA!: (value: RefundView[]) => void;
    get.mockImplementationOnce(() => new Promise(resolve => { resolveA = resolve; })).mockResolvedValueOnce([]);
    const { result, rerender } = renderHook(({ id }) => useOrderRefunds(id, true), { initialProps: { id: 'order-a' } });
    expect(result.current.isLoading).toBe(true);
    rerender({ id: 'order-b' }); await flush();
    await act(async () => resolveA([pending]));
    expect(result.current.refunds).toEqual([]); expect(result.current.error).toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS));
    expect(get.mock.calls.at(-1)?.[1]).toEqual({ params: { orderId: 'order-b' } });
  });

  it('does not accumulate polling requests and stops when disabled or unmounted', async () => {
    let resolve!: (value: RefundView[]) => void;
    get.mockImplementationOnce(() => new Promise(done => { resolve = done; })).mockResolvedValue([]);
    const { result, rerender, unmount } = renderHook(({ enabled }) => useOrderRefunds('order-a', enabled), { initialProps: { enabled: true } });
    await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS * 3));
    expect(get).toHaveBeenCalledTimes(1);
    await act(async () => resolve([pending]));
    rerender({ enabled: false }); expect(result.current.refunds).toEqual([]);
    await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS * 2));
    expect(get).toHaveBeenCalledTimes(1);
    rerender({ enabled: true }); await flush(); expect(get).toHaveBeenCalledTimes(2);
    unmount(); await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS * 2));
    expect(get).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['no refunds', [] as RefundView[]],
    ['only settled refunds', [{ ...pending, status: 'COMPLETED' }, { ...pending, id: 'r2', status: 'FAILED' }] as RefundView[]],
  ])('stops polling an ended order with %s', async (_, refunds) => {
    get.mockResolvedValue(refunds);
    const { result } = renderHook(() => useOrderRefunds('order-a', true));
    await flush(); expect(result.current.refunds).toEqual(refunds);
    await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS * 4));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keeps polling until a pending refund settles, then stops', async () => {
    get.mockResolvedValueOnce([pending]).mockResolvedValue([{ ...pending, status: 'COMPLETED' }]);
    const { result } = renderHook(() => useOrderRefunds('order-a', true));
    await flush();
    await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS));
    expect(result.current.refunds[0].status).toBe('COMPLETED');
    await act(async () => vi.advanceTimersByTimeAsync(REFUND_REFRESH_MS * 4));
    expect(get).toHaveBeenCalledTimes(2);
  });
});
