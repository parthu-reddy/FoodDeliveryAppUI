import { useEffect, useState } from 'react';
import { identityApi } from '@/lib/zodiosClients';
import { applicableBrandOrganisations, loadBrandOrganisations, parseBrandOrganisation,
  type BrandOrganisation } from './brandOrganisations';

/** A complete server list is required before selecting or creating brand ownership. */
export function useBrandOrganisationSelection(isOpen: boolean, onError: (message: string) => void) {
  const [organisations, setOrganisations] = useState<BrandOrganisation[] | null>(null);
  const [organisationId, setOrganisationId] = useState('');
  const [isLoadingOrganisations, setIsLoadingOrganisations] = useState(false);
  const choices = applicableBrandOrganisations(organisations ?? []);
  const isOrganisationSelectionReady = organisations !== null && (organisations.length === 0 || Boolean(organisationId));

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    loadBrandOrganisations().then(rows => {
      if (cancelled) return;
      const eligible = applicableBrandOrganisations(rows);
      setOrganisations(rows);
      setOrganisationId(eligible[0]?.id ?? '');
      if (rows.length && !eligible.length) {
        onError('An organisation owner or admin can register a brand. Ask your owner for access.');
      }
    }).catch(() => {
      if (!cancelled) onError('Your organisations could not load. Close and reopen this form to try again.');
    }).finally(() => { if (!cancelled) setIsLoadingOrganisations(false); });
    return () => { cancelled = true; };
  }, [isOpen, onError]);

  const prepareOrganisationSelection = () => {
    setIsLoadingOrganisations(true);
    setOrganisations(null);
    setOrganisationId('');
  };

  const ensureOrganisation = async (brandName: string) => {
    if (organisations === null) throw new Error('Wait for your organisations to load before registering.');
    let targetId = organisationId;
    if (!targetId && organisations.length === 0) {
      const created = parseBrandOrganisation(await identityApi.organisation.post('/api/v1/organisations',
        { displayName: brandName.trim() }));
      targetId = created.id;
      setOrganisationId(targetId);
      setOrganisations([created]);
    }
    if (!targetId) throw new Error('An organisation owner or admin can register a brand.');
    return targetId;
  };

  return { organisationId, setOrganisationId, isLoadingOrganisations, isOrganisationSelectionReady, choices,
    prepareOrganisationSelection, ensureOrganisation };
}
