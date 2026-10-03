import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/lib/parseApiError';
import { campaignApi } from '@/lib/zodiosClients';
import { Button, EmptyState, FormField, Input, Spinner, Surface } from '@shared/ui';
import { Megaphone } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import CampaignManagement from '@features/campaigns-ads/components/CampaignManagement';

interface RestaurantCampaignsProps {
  /** The selected outlet's brand, offered as the advertiser's business name. */
  brandName?: string;
  /** The selected outlet's IANA zone: campaign days, budgets and reports run on it. */
  outletTimeZone?: string;
}

type Lookup =
  | { state: 'loading' }
  | { state: 'none' }
  | { state: 'ready'; advertiserId: string; timeZone: string }
  | { state: 'error'; message: string };

/**
 * The restaurant's Campaigns tab: the owner's advertiser, or the step that creates it.
 *
 * Campaigns, the ad wallet and performance all hang off an advertiser profile, one per signed-in
 * owner. The tab used to hand CampaignManagement the dashboard's restaurantId, which is always "",
 * so it rendered an empty shell that never loaded anything. Nothing is created without the owner
 * asking: a 404 from /advertisers/me means "not advertising yet" and offers the form.
 */
export function RestaurantCampaigns({ brandName, outletTimeZone }: RestaurantCampaignsProps) {
  const { showError } = useToast();
  const [lookup, setLookup] = useState<Lookup>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // The gateway replaces X-User-Id with the signed-in user; the generated client requires the key.
    campaignApi.advertiser.getMyAdvertiser({ headers: { 'X-User-Id': '' } })
      .then((res) => {
        if (cancelled) return;
        setLookup(res.data
          ? { state: 'ready', advertiserId: res.data.id, timeZone: res.data.timeZone }
          : { state: 'error', message: 'The advertiser profile came back empty.' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const parsed = parseApiError(err, 'Could not load your advertiser profile');
        setLookup(parsed.statusCode === 404 ? { state: 'none' } : { state: 'error', message: parsed.message });
      });
    return () => { cancelled = true; };
  }, [attempt]);

  const name = (companyName ?? brandName ?? '').trim();

  const startAdvertising = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !outletTimeZone) return;
    setSubmitting(true);
    try {
      const res = await campaignApi.advertiser.register(
        { companyName: name, timeZone: outletTimeZone },
        { headers: { 'X-User-Id': '' } },
      );
      if (res.data) {
        setLookup({ state: 'ready', advertiserId: res.data.id, timeZone: res.data.timeZone });
      } else {
        setAttempt((n) => n + 1);
      }
    } catch (err: unknown) {
      showError(parseApiError(err, 'Could not start advertising').message);
    } finally {
      setSubmitting(false);
    }
  };

  if (lookup.state === 'loading') {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  if (lookup.state === 'error') {
    return (
      <div className="p-5">
        <EmptyState
          title="Campaigns could not load"
          description={lookup.message}
          action={<Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
        />
      </div>
    );
  }

  if (lookup.state === 'ready') {
    return <CampaignManagement advertiserId={lookup.advertiserId} advertiserTimeZone={lookup.timeZone} />;
  }

  return (
    <div className="p-5">
      <Surface radius="xl" elevation={1} className="p-6 max-w-lg mx-auto space-y-4" data-testid="start-advertising">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Start advertising</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Promote your restaurant in the customer app. Campaigns are paid from a prepaid ad wallet you top up.
            </p>
          </div>
        </div>
        <form onSubmit={startAdvertising} className="space-y-4">
          <FormField label="Business name" required>
            <Input
              type="text"
              value={companyName ?? brandName ?? ''}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={255}
              required
            />
          </FormField>
          {outletTimeZone ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Campaign days, daily budgets and reports run on {outletTimeZone}, this outlet's time zone.
            </p>
          ) : (
            <p className="text-xs text-rose-500">Select an outlet first: its time zone sets your campaign calendar.</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="warning" disabled={!name || !outletTimeZone || submitting}>
              {submitting ? 'Setting up…' : 'Start advertising'}
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}
