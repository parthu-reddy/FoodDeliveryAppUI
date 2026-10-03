import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/tokenStore', () => ({ getToken: () => null }));
import { loadEffectiveMenu, upsertOverride } from './menuStore';

describe('customer catalog responses', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  it('preserves a successful empty menu', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] })));
    await expect(loadEffectiveMenu('outlet')).resolves.toEqual([]);
  });
  it('returns the successful catalog', async () => {
    const menu = [{ id: 'dish', name: 'Rice', price: 100 }];
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: true, data: menu })));
    await expect(loadEffectiveMenu('outlet')).resolves.toEqual(menu);
  });
  it('rejects an outage instead of inventing an empty menu', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 502 }));
    await expect(loadEffectiveMenu('outlet')).rejects.toThrow();
  });
  it('rejects a malformed success response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: true, data: {} })));
    await expect(loadEffectiveMenu('outlet')).rejects.toThrow('Invalid catalog response');
  });
  it('changes availability through the stock-only endpoint without sending a price', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ isAvailable: false })));
    await upsertOverride('outlet', 'dish', undefined, false);
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/v1/outlets/outlet/menu-items/dish/stock',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ inStock: false }) }));
  });
  it('keeps a price edit on the menu-management endpoint and reports a denial', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 403 }));
    await expect(upsertOverride('outlet', 'dish', 125, true)).rejects.toThrow('API Error');
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/v1/outlets/outlet/menu-overrides/dish',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ overriddenPrice: 125, isAvailable: true }) }));
  });
});
