import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const getMyAdvertiser = vi.fn();
const register = vi.fn();
const showError = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  campaignApi: { advertiser: {
    getMyAdvertiser: (...a: unknown[]) => getMyAdvertiser(...a),
    register: (...a: unknown[]) => register(...a),
  } },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError, showSuccess: vi.fn() }) }));
vi.mock('@features/campaigns-ads/components/CampaignManagement', () => ({
  default: ({ advertiserId, advertiserTimeZone }: { advertiserId: string; advertiserTimeZone: string }) =>
    <div>CAMPAIGNS OF [{advertiserId}] ON [{advertiserTimeZone}]</div>,
}));

import { RestaurantCampaigns } from './RestaurantCampaigns';

const httpError = (status: number, message: string) =>
  ({ isAxiosError: true, message, response: { status, data: { success: false, message } } });

const advertiser = (id: string, timeZone: string) => ({ data: { id, timeZone, companyName: 'x', userId: 'u' } });

afterEach(() => { getMyAdvertiser.mockReset(); register.mockReset(); showError.mockReset(); });

describe('RestaurantCampaigns', () => {
  it("opens the owner's existing advertiser", async () => {
    getMyAdvertiser.mockResolvedValue(advertiser('adv-1', 'Asia/Kolkata'));
    render(<RestaurantCampaigns brandName="Brand 1" outletTimeZone="Asia/Kolkata" />);
    expect(await screen.findByText('CAMPAIGNS OF [adv-1] ON [Asia/Kolkata]')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("offers the start step on a 404 and registers under the brand's name and the outlet's zone", async () => {
    getMyAdvertiser.mockRejectedValue(httpError(404, 'Advertiser not found for user'));
    register.mockResolvedValue(advertiser('adv-new', 'Asia/Kolkata'));
    render(<RestaurantCampaigns brandName="Brand 1" outletTimeZone="Asia/Kolkata" />);

    const name = await screen.findByLabelText(/Business name/);
    expect(name).toHaveValue('Brand 1');
    expect(screen.getByText(/Asia\/Kolkata, this outlet's time zone/)).toBeInTheDocument();
    fireEvent.change(name, { target: { value: '  Brand 1 Foods ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start advertising' }));

    expect(await screen.findByText('CAMPAIGNS OF [adv-new] ON [Asia/Kolkata]')).toBeInTheDocument();
    expect(register).toHaveBeenCalledTimes(1);
    expect(register.mock.calls[0][0]).toEqual({ companyName: 'Brand 1 Foods', timeZone: 'Asia/Kolkata' });
  });

  it('creates nothing until asked', async () => {
    getMyAdvertiser.mockRejectedValue(httpError(404, 'Advertiser not found for user'));
    render(<RestaurantCampaigns brandName="Brand 1" outletTimeZone="Asia/Kolkata" />);
    await screen.findByRole('button', { name: 'Start advertising' });
    expect(register).not.toHaveBeenCalled();
  });

  it('cannot start without an outlet zone to run the calendar on', async () => {
    getMyAdvertiser.mockRejectedValue(httpError(404, 'Advertiser not found for user'));
    render(<RestaurantCampaigns brandName="Brand 1" />);
    expect(await screen.findByRole('button', { name: 'Start advertising' })).toBeDisabled();
    expect(screen.getByText(/Select an outlet first/)).toBeInTheDocument();
  });

  it('shows any other failure as an error with a retry, never as "not advertising yet"', async () => {
    getMyAdvertiser.mockRejectedValueOnce(httpError(503, 'Service unavailable'))
      .mockResolvedValueOnce(advertiser('adv-1', 'Asia/Kolkata'));
    render(<RestaurantCampaigns brandName="Brand 1" outletTimeZone="Asia/Kolkata" />);

    expect(await screen.findByText('Campaigns could not load')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start advertising' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('CAMPAIGNS OF [adv-1] ON [Asia/Kolkata]')).toBeInTheDocument();
  });

  it('keeps the form and says why when registration is refused', async () => {
    getMyAdvertiser.mockRejectedValue(httpError(404, 'Advertiser not found for user'));
    register.mockRejectedValue(httpError(400, 'timeZone: must be an IANA time zone'));
    render(<RestaurantCampaigns brandName="Brand 1" outletTimeZone="Asia/Kolkata" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Start advertising' }));

    await waitFor(() => expect(showError).toHaveBeenCalledWith('timeZone: must be an IANA time zone'));
    expect(screen.getByRole('button', { name: 'Start advertising' })).toBeEnabled();
  });
});
