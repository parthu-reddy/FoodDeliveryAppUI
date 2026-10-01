import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/tokenStore', () => ({ getToken: () => null }));
import { loadEffectiveMenu } from './menuStore';

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
});
