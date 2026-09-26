import { parseApiError } from '@/lib/parseApiError';
import { campaignApi } from '@/lib/zodiosClients';
import { useToast } from '@/contexts/ToastContext';
import { Button, FormField, Input, Modal } from '@shared/ui';
import React, { useEffect, useState } from 'react';
import { addDays, todayIn, viewerTimeZone } from '@/shared/time';

interface CreateCampaignModalProps {
  advertiserId: string;
  open: boolean;
  onClose: () => void;
  /** The list re-reads itself once a campaign exists. */
  onCreated: () => void;
}

/**
 * The new-campaign form, in its own dialog.
 *
 * Split out of CampaignManagement. Its seven fields were seven more `useState`s on a
 * component that already had fifteen, and their only reader was this form.
 */
export function CreateCampaignModal({ advertiserId, open, onClose, onCreated }: CreateCampaignModalProps) {
  const { showError, showSuccess } = useToast();
  // Create Form State
  const [name, setName] = useState('');
  const [dailyBudget, setDailyBudget] = useState('50');
  const [totalBudget, setTotalBudget] = useState('500');
  // Calendar dates. The server reads them on the advertiser's calendar: a campaign starts at local
  // midnight on its first day and runs all of its last day. So the default is the advertiser's today,
  // not the creator's (east of the advertiser that is already tomorrow, and the campaign would not run
  // until then). Until the profile loads, or if it cannot, the creator's today stands in. null = untouched.
  const [advertiserZone, setAdvertiserZone] = useState<string | null>(null);
  const [pickedStart, setStartDate] = useState<string | null>(null);
  const [pickedEnd, setEndDate] = useState<string | null>(null);
  const today = todayIn(advertiserZone ?? viewerTimeZone());
  const startDate = pickedStart ?? today;
  const endDate = pickedEnd ?? addDays(today, 30);

  useEffect(() => {
    if (!open || advertiserZone) return;
    let cancelled = false;
    campaignApi.advertiser.get('/api/v1/advertisers/:id', { params: { id: advertiserId } })
      .then((res) => { if (!cancelled && res.data?.timeZone) setAdvertiserZone(res.data.timeZone); })
      .catch(() => { /* keep the creator's today */ });
    return () => { cancelled = true; };
  }, [open, advertiserId, advertiserZone]);
  const [bidAmount, setBidAmount] = useState('1.5');
  const [radiusKm, setRadiusKm] = useState('5.0');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await campaignApi.campaign.post('/api/v1/advertisers/:advertiserId/campaigns', {
              advertiserId: advertiserId,
              name,
              dailyBudget: Math.round(parseFloat(dailyBudget) * 100),
              lifetimeBudget: Math.round(parseFloat(totalBudget) * 100),
              maxBid: Math.round(parseFloat(bidAmount) * 100),
              startDate,
              endDate
            }, { params: { advertiserId: advertiserId }, queries: { pageable: {} } as Record<string, unknown> });
      showSuccess('Campaign created successfully');
      onClose();
      onCreated();
    } catch (err: unknown) {
      showError(parseApiError(err, 'Failed to create campaign').message);
    }
  };

  return (
  <Modal open={open} onClose={onClose} title="New Ad Campaign" size="md">
    <div className="p-6">
      <form onSubmit={handleCreate} className="space-y-4">
        <FormField label="Campaign Name" required>
          <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Special Boost" required />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Daily Budget (₹)" required>
            <Input type="number" step="0.01" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} required />
          </FormField>
          <FormField label="Total Budget (₹)" required>
            <Input type="number" step="0.01" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} required />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date" required>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </FormField>
          <FormField label="End Date" required>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </FormField>
        </div>
        {advertiserZone && advertiserZone !== viewerTimeZone() && (
          <p className="text-xs text-slate-500">Dates run on the advertiser's calendar ({advertiserZone}).</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Bid per Impression (₹)" required>
            <Input type="number" step="0.01" value={bidAmount} onChange={e => setBidAmount(e.target.value)} required />
          </FormField>
          <FormField label="Targeting Radius (km)" required>
            <Input type="number" step="0.1" value={radiusKm} onChange={e => setRadiusKm(e.target.value)} required />
          </FormField>
        </div>

        <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 mt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="warning" type="submit">Launch Campaign</Button>
        </div>
      </form>
    </div>
  </Modal>
  );
}
