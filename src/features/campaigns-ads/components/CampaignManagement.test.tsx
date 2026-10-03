import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { formatINR } from '@shared/money';

const campaignGet = vi.fn((path: string) => Promise.resolve(path.endsWith('/performance')
  ? { data: { content: [] } }
  : { data: { content: [{
      id: 'c1', name: 'Lunch boost', status: 'DRAFT', startDate: '2026-10-03',
      dailyBudget: 50, lifetimeBudget: 500, maxBid: 1.5,
    }] } }));
const walletGet = vi.fn((path: string) => Promise.resolve(path.endsWith('/transactions')
  ? { content: [], totalPages: 1 }
  : { balance: 250 }));
vi.mock('@/lib/zodiosClients', () => ({
  campaignApi: { campaign: { get: (p: string) => campaignGet(p), post: vi.fn() } },
  walletApi: { payeeWallet: { get: (p: string) => walletGet(p) } },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }));

import CampaignManagement from './CampaignManagement';

describe('CampaignManagement', () => {
  it('shows the ad wallet balance on open, not only after a top-up', async () => {
    render(<CampaignManagement advertiserId="adv-1" advertiserTimeZone="Asia/Kolkata" />);
    const card = (await screen.findByText('Ad Wallet Balance')).parentElement as HTMLElement;
    expect(await within(card).findByText(formatINR(250))).toBeInTheDocument();
    expect(walletGet).toHaveBeenCalledWith('/api/v1/money/advertiser/:entityType/:entityId');
  });

  it("shows a campaign's lifetime budget, the field the server sends", async () => {
    render(<CampaignManagement advertiserId="adv-1" advertiserTimeZone="Asia/Kolkata" />);
    const total = (await screen.findByText('Total Budget')).parentElement as HTMLElement;
    expect(within(total).getByText(formatINR(500))).toBeInTheDocument();
  });

  it('asks to pay the top-up in rupees, as typed', async () => {
    render(<CampaignManagement advertiserId="adv-1" advertiserTimeZone="Asia/Kolkata" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Top Up' }));
    fireEvent.change(screen.getByLabelText(/Amount to Add/), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Proceed to Payment' }));
    expect((await screen.findAllByText(formatINR(100))).length).toBeGreaterThan(0);
    expect(screen.queryByText(formatINR(10000))).not.toBeInTheDocument();
  });
});
