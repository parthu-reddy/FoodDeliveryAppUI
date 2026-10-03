import { identityApi } from '@/lib/zodiosClients';
import { z } from 'zod';
import { OrganisationView } from '@/api/generated/schemas/identity/common';

const requiredOrganisation = OrganisationView.required({ id: true, displayName: true, status: true, myRole: true });
export type BrandOrganisation = z.infer<typeof requiredOrganisation>;
export const parseBrandOrganisation = (value: unknown): BrandOrganisation => {
  const result = requiredOrganisation.safeParse(value);
  if (!result.success) throw new Error('Organisation details are incomplete. Please try again.');
  return result.data;
};

export async function loadBrandOrganisations(): Promise<BrandOrganisation[]> {
  const organisations: BrandOrganisation[] = [];
  for (let page = 0; ; page++) {
    const result = await identityApi.organisation.get('/api/v1/organisations', { queries: { page, size: 100 } });
    if (!Array.isArray(result.content) || typeof result.last !== 'boolean') throw new Error('Organisation list is incomplete. Please try again.');
    organisations.push(...result.content.map(parseBrandOrganisation));
    if (result.last) return organisations;
    if (result.content.length === 0) throw new Error('Organisation list is incomplete. Please try again.');
  }
}

/** UI guidance only: BUSINESS_APPLY is enforced again by the restaurant service. */
export function applicableBrandOrganisations(organisations: BrandOrganisation[]): BrandOrganisation[] {
  return organisations.filter(org => org.status === 'ACTIVE' && (org.myRole === 'OWNER' || org.myRole === 'ADMIN'));
}
