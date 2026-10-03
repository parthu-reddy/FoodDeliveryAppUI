import { beforeEach, describe, expect, it, vi } from 'vitest';
import { identityApi } from '@/lib/zodiosClients';
import { applicableBrandOrganisations, loadBrandOrganisations, parseBrandOrganisation } from './brandOrganisations';

vi.mock('@/lib/zodiosClients', () => ({ identityApi: { organisation: { get: vi.fn() } } }));
const organisation = (id: string, myRole: string, status = 'ACTIVE') => ({ id, displayName: 'Restaurant team', myRole, status });
const first = '11111111-1111-4111-8111-111111111111';
const second = '22222222-2222-4222-8222-222222222222';

describe('brand organisation selection', () => {
  beforeEach(() => { vi.mocked(identityApi.organisation.get).mockReset(); });

  it('loads every page so an eligible organisation on a later page remains selectable', async () => {
    vi.mocked(identityApi.organisation.get)
      .mockResolvedValueOnce({ content: [organisation(first, 'STAFF')], last: false } as never)
      .mockResolvedValueOnce({ content: [organisation(second, 'OWNER')], last: true } as never);
    const result = await loadBrandOrganisations();
    expect(result).toHaveLength(2);
    expect(applicableBrandOrganisations(result).map(org => org.id)).toEqual([second]);
    expect(identityApi.organisation.get).toHaveBeenNthCalledWith(2, '/api/v1/organisations', { queries: { page: 1, size: 100 } });
  });

  it('offers only active OWNER and ADMIN organisations for applying', () => {
    const roles = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'];
    const rows = roles.flatMap(role => ['ACTIVE', 'SUSPENDED', 'CLOSED'].map(status =>
      parseBrandOrganisation(organisation(first, role, status))));
    expect(applicableBrandOrganisations(rows).map(org => org.myRole)).toEqual(['OWNER', 'ADMIN']);
  });

  it('reports an outage instead of returning no organisations and encouraging duplicate creation', async () => {
    vi.mocked(identityApi.organisation.get).mockRejectedValue(new Error('Identity unavailable'));
    await expect(loadBrandOrganisations()).rejects.toThrow('Identity unavailable');
  });

  it.each([
    { content: [], last: false },
    { content: [] },
    { content: null, last: true },
  ])('rejects an incomplete pagination response: %j', async response => {
    vi.mocked(identityApi.organisation.get).mockResolvedValue(response as never);
    await expect(loadBrandOrganisations()).rejects.toThrow('Organisation list is incomplete');
    expect(identityApi.organisation.get).toHaveBeenCalledTimes(1);
  });

  it('rejects an organisation without a server role instead of assuming ownership', () => {
    expect(() => parseBrandOrganisation({ id: first, displayName: 'Team', status: 'ACTIVE' })).toThrow();
  });
});
