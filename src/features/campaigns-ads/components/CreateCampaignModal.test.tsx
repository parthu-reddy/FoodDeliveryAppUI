import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  campaignApi: { campaign: { post: (...a: unknown[]) => post(...a) } },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }));

import { CreateCampaignModal } from './CreateCampaignModal';

// 20:00Z on 25 Sept: 17:30 on the 25th in St John's (this run's zone), 01:30 on the 26th in Kolkata.
const NOW = new Date('2026-09-25T20:00:00Z').getTime();

function dates() {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
  return [inputs[0].value, inputs[1].value];
}

function renderModal(advertiserTimeZone = 'Asia/Kolkata') {
  return render(<CreateCampaignModal advertiserId="a1" advertiserTimeZone={advertiserTimeZone} open onClose={vi.fn()} onCreated={vi.fn()} />);
}

describe('CreateCampaignModal default dates', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("start on the advertiser's today, which east of the creator is already tomorrow", () => {
    renderModal('Asia/Kolkata');
    expect(dates()).toEqual(['2026-09-26', '2026-10-26']);
  });

  it("start on the advertiser's today west of it too", () => {
    renderModal('America/St_Johns');
    expect(dates()).toEqual(['2026-09-25', '2026-10-25']);
  });
});

describe('CreateCampaignModal request', () => {
  afterEach(() => post.mockReset());

  it('sends budgets and the bid in rupees, as typed', async () => {
    post.mockResolvedValue({});
    renderModal();
    fireEvent.change(screen.getByLabelText(/Campaign Name/), { target: { value: 'Lunch boost' } });
    fireEvent.change(screen.getByLabelText(/Daily Budget/), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Total Budget/), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Bid per Impression/), { target: { value: '1.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Launch Campaign' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, body, config] = post.mock.calls[0];
    expect(path).toBe('/api/v1/advertisers/:advertiserId/campaigns');
    expect(body).toMatchObject({ advertiserId: 'a1', name: 'Lunch boost', dailyBudget: 50, lifetimeBudget: 500, maxBid: 1.5 });
    expect(config).toEqual({ params: { advertiserId: 'a1' } });
  });

  it('asks for no targeting radius: a campaign has none to send', () => {
    renderModal();
    expect(screen.queryByLabelText(/Targeting Radius/)).not.toBeInTheDocument();
  });
});
