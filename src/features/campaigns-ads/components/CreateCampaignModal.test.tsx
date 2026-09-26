import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getAdvertiser = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  campaignApi: { advertiser: { get: (...a: unknown[]) => getAdvertiser(...a) }, campaign: { post: vi.fn() } },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }));

import { CreateCampaignModal } from './CreateCampaignModal';

// 20:00Z on 25 Sept: 17:30 on the 25th in St John's (this run's zone), 01:30 on the 26th in Kolkata.
const NOW = new Date('2026-09-25T20:00:00Z').getTime();

function dates() {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
  return [inputs[0].value, inputs[1].value];
}

function renderModal() {
  return render(<CreateCampaignModal advertiserId="a1" open onClose={vi.fn()} onCreated={vi.fn()} />);
}

describe('CreateCampaignModal default dates', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    getAdvertiser.mockReset();
  });

  it("start on the advertiser's today, which east of the creator is already tomorrow", async () => {
    getAdvertiser.mockResolvedValue({ data: { timeZone: 'Asia/Kolkata' } });
    renderModal();
    await waitFor(() => expect(dates()).toEqual(['2026-09-26', '2026-10-26']));
  });

  it("fall back to the creator's today when the profile can't be read", async () => {
    getAdvertiser.mockRejectedValue(new Error('offline'));
    renderModal();
    await waitFor(() => expect(getAdvertiser).toHaveBeenCalled());
    expect(dates()).toEqual(['2026-09-25', '2026-10-25']);
  });
});
