import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuItem, Restaurant } from '@/types';
const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('./menuStore', () => ({ loadEffectiveMenu: load }));
vi.mock('@/lib/zodiosClients', () => ({ customerApi: { customerRestaurant: {
  getBrandOutlets: () => Promise.resolve({ data: [] }), get: () => Promise.resolve(true),
} } }));
import { useCustomerStorefront } from './useCustomerStorefront';
const restaurant = (id: string) => ({ id }) as Restaurant;
const dish = { id: 'dish', name: 'Rice', price: 100 } as MenuItem;
const options = (id: string) => ({ selectedRestaurant: restaurant(id), deliveryLat: 12, deliveryLng: 77 });

describe('customer catalog recovery', () => {
  beforeEach(() => vi.resetAllMocks());
  it('reports a failed menu and retries the same outlet successfully', async () => {
    load.mockRejectedValueOnce(new Error('502')).mockResolvedValueOnce([dish]);
    const { result } = renderHook(() => useCustomerStorefront(options('first')));
    await waitFor(() => expect(result.current.menuError).toBe("Couldn't load menu"));
    expect(result.current.effectiveMenu).toEqual([]);
    expect(result.current.isMenuLoading).toBe(false);
    act(() => result.current.retryMenu());
    await waitFor(() => expect(result.current.effectiveMenu).toEqual([dish]));
    expect(result.current.menuError).toBeNull();
    expect(load.mock.calls).toEqual([['first'], ['first']]);
  });
  it('distinguishes successful empty data from a failed request', async () => {
    load.mockResolvedValue([]);
    const { result } = renderHook(() => useCustomerStorefront(options('first')));
    await waitFor(() => expect(result.current.isMenuLoading).toBe(false));
    expect(result.current.menuError).toBeNull();
    expect(result.current.effectiveMenu).toEqual([]);
  });
  it('ignores an old outlet response after the customer switches outlets', async () => {
    let finishOld!: (items: MenuItem[]) => void;
    load.mockImplementationOnce(() => new Promise<MenuItem[]>((resolve) => { finishOld = resolve; }))
      .mockResolvedValueOnce([dish]);
    const { result, rerender } = renderHook(({ id }) => useCustomerStorefront(options(id)), { initialProps: { id: 'first' } });
    rerender({ id: 'second' });
    await waitFor(() => expect(result.current.effectiveMenu).toEqual([dish]));
    await act(async () => finishOld([{ ...dish, id: 'old-dish' }]));
    expect(result.current.effectiveMenu).toEqual([dish]);
    expect(result.current.menuError).toBeNull();
  });
});
