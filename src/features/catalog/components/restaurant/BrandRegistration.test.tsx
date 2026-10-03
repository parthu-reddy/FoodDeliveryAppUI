import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { identityApi, restaurantApi } from '@/lib/zodiosClients';
import BrandRegistration from './BrandRegistration';

vi.mock('@/lib/zodiosClients', () => ({
  identityApi: { organisation: { get: vi.fn(), post: vi.fn() } },
  restaurantApi: { restaurantOnboarding: { post: vi.fn() } },
}));
vi.mock('@features/kyc/components/ImageUploadField', () => ({ default: () => null }));
const organisation = { id: '11111111-1111-4111-8111-111111111111',
  displayName: 'Team', myRole: 'OWNER', status: 'ACTIVE' };

async function fillApplication() {
  fireEvent.click(screen.getByRole('button', { name: 'Register New Brand' }));
  await waitFor(() => expect(screen.queryByText('Loading your organisations…')).not.toBeInTheDocument());
  fireEvent.change(screen.getByLabelText('Brand Name'), { target: { value: 'New Brand' } });
  fireEvent.change(screen.getByLabelText('GSTIN (15 char)'), { target: { value: '29ABCDE1234F1Z5' } });
  fireEvent.change(screen.getByLabelText('PAN (10 char)'), { target: { value: 'ABCDE1234F' } });
  fireEvent.change(screen.getByLabelText('CIN (21 char)'), { target: { value: 'U12345KA2020PTC123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.change(await screen.findByLabelText('Bank Account #'), { target: { value: '123456789012' } });
  fireEvent.change(screen.getByLabelText('IFSC Code (11 char)'), { target: { value: 'TEST0001234' } });
}

describe('brand registration organisation writes', () => {
  beforeEach(() => {
    vi.mocked(identityApi.organisation.get).mockReset().mockResolvedValue({ content: [], last: true } as never);
    vi.mocked(identityApi.organisation.post).mockReset().mockResolvedValue(organisation as never);
    vi.mocked(restaurantApi.restaurantOnboarding.post).mockReset().mockResolvedValue({} as never);
  });

  it('creates an organisation only for a caller who has none, then registers the brand against it', async () => {
    const refreshed = vi.fn();render(<BrandRegistration onRefresh={refreshed} />);
    await fillApplication();fireEvent.click(screen.getByRole('button', { name: 'Complete Registration' }));
    await waitFor(() => expect(refreshed).toHaveBeenCalledTimes(1));
    expect(identityApi.organisation.post).toHaveBeenCalledExactlyOnceWith('/api/v1/organisations', { displayName: 'New Brand' });
    expect(restaurantApi.restaurantOnboarding.post).toHaveBeenCalledWith('/api/v1/brands',
      expect.objectContaining({ organisationId: organisation.id }), {});
  });

  it('uses an existing eligible organisation without creating another', async () => {
    vi.mocked(identityApi.organisation.get).mockResolvedValue({ content: [organisation], last: true } as never);
    const refreshed = vi.fn();render(<BrandRegistration onRefresh={refreshed} />);
    await fillApplication();fireEvent.click(screen.getByRole('button', { name: 'Complete Registration' }));
    await waitFor(() => expect(refreshed).toHaveBeenCalledTimes(1));
    expect(identityApi.organisation.post).not.toHaveBeenCalled();
    expect(restaurantApi.restaurantOnboarding.post).toHaveBeenCalledWith('/api/v1/brands',
      expect.objectContaining({ organisationId: organisation.id }), {});
  });

  it('retries a failed brand write using the already created organisation', async () => {
    vi.mocked(restaurantApi.restaurantOnboarding.post).mockRejectedValueOnce(new Error('Temporary outage'));
    const refreshed = vi.fn();render(<BrandRegistration onRefresh={refreshed} />);
    await fillApplication();fireEvent.click(screen.getByRole('button', { name: 'Complete Registration' }));
    await screen.findByText('Temporary outage');
    fireEvent.click(screen.getByRole('button', { name: 'Complete Registration' }));
    await waitFor(() => expect(refreshed).toHaveBeenCalledTimes(1));
    expect(identityApi.organisation.post).toHaveBeenCalledTimes(1);
    expect(restaurantApi.restaurantOnboarding.post).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(restaurantApi.restaurantOnboarding.post).mock.calls) {
      expect(call[1]).toEqual(expect.objectContaining({ organisationId: organisation.id }));
    }
  });
});
