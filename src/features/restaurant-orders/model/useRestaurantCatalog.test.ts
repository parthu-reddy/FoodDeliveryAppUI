import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ put: vi.fn(), effective: vi.fn(), overrides: vi.fn() }));
vi.mock('@/lib/zodiosClients', () => ({ restaurantApi: { catalog: { put: mocks.put } } }));
vi.mock('@features/catalog/model/menuStore', () => ({
  getBrands: vi.fn().mockResolvedValue([{ id: 'brand' }]),
  getOutlets: vi.fn().mockResolvedValue([{ id: 'outlet', brandId: 'brand' }]),
  getMasterMenuItems: vi.fn().mockResolvedValue([]),
  getEffectiveMenu: mocks.effective,
  loadOutletOverrides: mocks.overrides,
}));
import { useRestaurantCatalog } from './useRestaurantCatalog';

function setup() {
  const showError = vi.fn();
  const hook = renderHook(() => useRestaurantCatalog({ selectedOutletId: 'outlet',
    setSelectedOutletId: vi.fn(), setApiPrepSeconds: vi.fn(), showError }));
  return { hook, showError };
}
describe('restaurant stock independently of customer opening hours', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.effective.mockResolvedValue([{ id: 'dish', name: 'Dish', isAvailable: false }]);
    mocks.overrides.mockResolvedValue([]);
    mocks.put.mockResolvedValue({ data: { isAvailable: true } });
  });
  it('a closed category does not mark an otherwise stocked dish sold out', async () => {
    const { hook } = setup();
    await waitFor(() => expect(hook.result.current.stockStatus.outlet_dish).toBe(true));
    expect(hook.result.current.menuList[0].isAvailable).toBe(false);
  });
  it('persisted out-of-stock still wins when the effective menu is also closed', async () => {
    mocks.overrides.mockResolvedValue([{ masterMenuItemId: 'dish', isAvailable: false }]);
    const { hook } = setup();
    await waitFor(() => expect(hook.result.current.stockStatus.outlet_dish).toBe(false));
  });
  it('an unreadable stock response cannot render dishes as successfully stocked', async () => {
    mocks.overrides.mockRejectedValue(new Error('Unavailable'));
    const { hook } = setup();
    await act(async () => { await hook.result.current.loadData(); });
    expect(hook.result.current.menuList).toEqual([]);
    expect(hook.result.current.stockStatus).toEqual({});
  });
  it('overlapping clicks cannot reorder two writes and failure restores the persisted stock', async () => {
    let reject!: (reason: unknown) => void;
    mocks.put.mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
    const { hook, showError } = setup();
    await waitFor(() => expect(hook.result.current.stockStatus.outlet_dish).toBe(true));
    let pending!: Promise<void>;
    act(() => { pending = hook.result.current.toggleStock('dish', true); });
    expect(hook.result.current.pendingStock.outlet_dish).toBe(true);
    expect(hook.result.current.stockStatus.outlet_dish).toBe(false);
    await act(async () => { await hook.result.current.toggleStock('dish', false); });
    expect(mocks.put).toHaveBeenCalledTimes(1);
    await act(async () => { reject(new Error('Refused')); await pending; });
    expect(hook.result.current.stockStatus.outlet_dish).toBe(true);
    expect(hook.result.current.pendingStock.outlet_dish).toBe(false);
    expect(showError).toHaveBeenCalledWith('Failed to update stock status.');
  });
});
