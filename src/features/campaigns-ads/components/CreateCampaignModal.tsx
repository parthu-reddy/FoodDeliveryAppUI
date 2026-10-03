import { parseApiError } from '@/lib/parseApiError';
import { campaignApi } from '@/lib/zodiosClients';
import { useToast } from '@/contexts/ToastContext';
import { Button, FormField, Input, Modal } from '@shared/ui';
import { roundRupees } from '@shared/money';
import React, { useState } from 'react';
import { addDays, todayIn, viewerTimeZone } from '@/shared/time';

interface CreateCampaignModalProps {
  advertiserId: string;
  /** The advertiser's IANA zone, from the profile the Campaigns tab already loaded. */
  advertiserTimeZone: string;
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
export function CreateCampaignModal({ advertiserId, advertiserTimeZone, open, onClose, onCreated }: CreateCampaignModalProps) {
  const { showError, showSuccess } = useToast();
  // Create Form State
  const [name, setName] = useState('');
  const [dailyBudget, setDailyBudget] = useState('50');
  const [totalBudget, setTotalBudget] = useState('500');
  // Calendar dates. The server reads them on the advertiser's calendar: a campaign starts at local
  // midnight on its first day and runs all of its last day. So the default is the advertiser's today,
  // not the creator's (east of the advertiser that is already tomorrow, and the campaign would not run
  // until then). null = untouched.
  const [pickedStart, setStartDate] = useState<string | null>(null);
  const [pickedEnd, setEndDate] = useState<string | null>(null);
  const today = todayIn(advertiserTimeZone);
  const startDate = pickedStart ?? today;
  const endDate = pickedEnd ?? addDays(today, 30);
  const [bidAmount, setBidAmount] = useState('1.5');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Rupees, as typed. The wallet is in rupees and an impression debits the cleared bid from it
      // as-is (UserTrackingService -> BillingEvent -> WalletService). This sent `* 100`, so a ₹1.50
      // bid could charge ₹150 an impression and a ₹50 daily budget allowed ₹5,000 a day.
      await campaignApi.campaign.post('/api/v1/advertisers/:advertiserId/campaigns', {
              advertiserId: advertiserId,
              name,
              dailyBudget: roundRupees(dailyBudget),
              lifetimeBudget: roundRupees(totalBudget),
              maxBid: roundRupees(bidAmount),
              startDate,
              endDate
            }, { params: { advertiserId: advertiserId } });
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
        {advertiserTimeZone !== viewerTimeZone() && (
          <p className="text-xs text-slate-500">Dates run on the advertiser's calendar ({advertiserTimeZone}).</p>
        )}
        {/* No targeting-radius field: it was collected and never sent. A campaign carries no
            targeting; that belongs to its ad groups. */}
        <FormField label="Bid per Impression (₹)" required>
          <Input type="number" step="0.01" value={bidAmount} onChange={e => setBidAmount(e.target.value)} required />
        </FormField>

        <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 mt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="warning" type="submit">Launch Campaign</Button>
        </div>
      </form>
    </div>
  </Modal>
  );
}
