import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomerAddresses } from './useCustomerAddresses';

const { addressGet, profileGet } = vi.hoisted(() => ({ addressGet: vi.fn(), profileGet: vi.fn() }));
vi.mock('@/lib/tokenStore', () => ({ getUserProfile: () => ({ id: 'customer-1', role: 'CUSTOMER' }) }));
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: { customerAddress: { get: addressGet } },
  identityApi: { user: { get: profileGet } },
}));
const home = { id: 'home-1', label: 'Home', addressLine1: '12 Seed Street', city: 'Bengaluru', latitude: 12.98, longitude: 77.64 };
const work = { ...home, id: 'work-1', label: 'Work', addressLine1: '34 Work Road', latitude: 12.99, longitude: 77.65 };
function storeSelection(id: string, label: string, lat: number, lng: number) {
  localStorage.setItem('deliveryAddressId', id);localStorage.setItem('deliveryAddress', label);
  localStorage.setItem('deliveryLat', String(lat));localStorage.setItem('deliveryLng', String(lng));
}
function mount() {
  const options = { setShowProfileModal: vi.fn(), setIsAddressSelectorOpen: vi.fn(), showError: vi.fn(), showSuccess: vi.fn() };
  return { ...renderHook(() => useCustomerAddresses(options)), options };
}

describe('saved delivery selection reconciliation', () => {
  beforeEach(() => {
    localStorage.clear();addressGet.mockReset();profileGet.mockReset();
    profileGet.mockResolvedValue({ data: { name: 'Seed Customer', email: 'customer@example.test' } });
  });
  it('fallback from a missing saved ID updates label, ID and coordinates together', async () => {
    storeSelection('removed-address', 'Old saved address', 30, 80);
    addressGet.mockResolvedValue({ data: [home] });
    const { result } = mount();
    await waitFor(() => expect(result.current.deliveryAddressId).toBe(home.id));
    expect(result.current.address).toBe('Home: 12 Seed Street, Bengaluru');
    expect(result.current.deliveryLat).toBe(home.latitude);expect(result.current.deliveryLng).toBe(home.longitude);
    await waitFor(() => expect(localStorage.getItem('deliveryLat')).toBe(String(home.latitude)));
    expect(localStorage.getItem('deliveryLng')).toBe(String(home.longitude));
  });
  it('an existing selected saved ID refreshes stale text and coordinates from the server', async () => {
    storeSelection(work.id, 'Outdated Work text', 30, 80);
    addressGet.mockResolvedValue({ data: [home, work] });
    const { result } = mount();
    await waitFor(() => expect(result.current.savedAddresses).toHaveLength(2));
    expect(result.current.deliveryAddressId).toBe(work.id);
    expect(result.current.address).toBe('Work: 34 Work Road, Bengaluru');
    expect(result.current.deliveryLat).toBe(work.latitude);expect(result.current.deliveryLng).toBe(work.longitude);
  });
  it('an empty saved-address list clears the removed saved selection and prompts for a location', async () => {
    storeSelection('removed-address', 'Old saved address', 30, 80);
    addressGet.mockResolvedValue({ data: [] });
    const { result, options } = mount();
    await waitFor(() => expect(result.current.deliveryAddressId).toBe(''));
    expect(result.current.deliveryLat).toBeNull();expect(result.current.deliveryLng).toBeNull();
    expect(result.current.address).toBe('Please add an address');
    expect(options.setIsAddressSelectorOpen).toHaveBeenCalledWith(true);
    await waitFor(() => expect(localStorage.getItem('deliveryLat')).toBeNull());
    expect(localStorage.getItem('deliveryLng')).toBeNull();
  });
  it.each([{ data: [home] }, { data: [] }])('an explicit GPS selection survives reload with saved-address response %j', async ({ data }) => {
    storeSelection('', 'Current Location: Test GPS', 13, 78);
    addressGet.mockResolvedValue({ data });
    const { result } = mount();
    await waitFor(() => expect(addressGet).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.savedAddresses).toBe(data));
    expect(result.current.deliveryAddressId).toBe('');expect(result.current.address).toBe('Current Location: Test GPS');
    expect(result.current.deliveryLat).toBe(13);expect(result.current.deliveryLng).toBe(78);
  });
});
