import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AdminFleetMap from './AdminFleetMap';

const { getRestaurants, getRiders, getCustomerAddresses } = vi.hoisted(() => ({
  getRestaurants: vi.fn(),
  getRiders: vi.fn(),
  getCustomerAddresses: vi.fn(),
}));

vi.mock('@/lib/zodiosClients', () => ({
  restaurantApi: { restaurantOutlet: { get: getRestaurants } },
  deliveryApi: { adminDelivery: { get: getRiders } },
  customerApi: { adminCustomer: { get: getCustomerAddresses } },
}));

// Marker construction is separately covered by mapMarker tests. This keeps the refresh test
// focused on the API lifecycle and does not require WebGL in jsdom.
vi.mock('./MapPanel', () => ({
  MapPanel: ({ label }: { label: string }) => <div role="region" aria-label={label} />,
}));
vi.mock('../model/maplibre', () => ({ maplibre: {} }));

function stubFleetResponses() {
  getRestaurants.mockResolvedValue({ data: { content: [] } });
  getRiders.mockResolvedValue({ content: [] });
  getCustomerAddresses.mockResolvedValue({ data: { content: [] } });
}

describe('AdminFleetMap refresh lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRestaurants.mockReset();
    getRiders.mockReset();
    getCustomerAddresses.mockReset();
    stubFleetResponses();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test('offers an accessible refresh control and refetches every fleet layer on demand and after 30 seconds', async () => {
    render(<AdminFleetMap />);

    await waitFor(() => expect(getRiders).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Refresh fleet map' })).toBeInTheDocument();
    expect(getRestaurants).toHaveBeenCalledTimes(1);
    expect(getCustomerAddresses).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh fleet map' }));
    await waitFor(() => expect(getRiders).toHaveBeenCalledTimes(2));

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    await waitFor(() => expect(getRiders).toHaveBeenCalledTimes(3));
    expect(getRestaurants).toHaveBeenCalledTimes(3);
    expect(getCustomerAddresses).toHaveBeenCalledTimes(3);
  });
});
