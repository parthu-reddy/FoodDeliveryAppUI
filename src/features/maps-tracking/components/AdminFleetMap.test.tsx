import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AdminFleetMap from './AdminFleetMap';

const { getRestaurants, getDelivery, getCustomerAddresses } = vi.hoisted(() => ({
  getRestaurants: vi.fn(),
  getDelivery: vi.fn(),
  getCustomerAddresses: vi.fn(),
}));

vi.mock('@/lib/zodiosClients', () => ({
  restaurantApi: { restaurantOutlet: { get: getRestaurants } },
  deliveryApi: { adminDelivery: { get: getDelivery } },
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
  getCustomerAddresses.mockResolvedValue({ data: { content: [] } });
  getDelivery.mockImplementation((path: string) => {
    if (path === '/api/v1/internal/admin/delivery/fleet-cities') {
      return Promise.resolve(['BLR', 'HYD']);
    }
    if (path === '/api/v1/internal/admin/delivery/drivers/all-with-location') {
      return Promise.resolve({ content: [] });
    }
    return Promise.reject(new Error(`Unexpected delivery path ${path}`));
  });
}

describe('AdminFleetMap refresh lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRestaurants.mockReset();
    getDelivery.mockReset();
    getCustomerAddresses.mockReset();
    stubFleetResponses();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test('offers an accessible refresh control and refetches every fleet layer on demand and after 30 seconds', async () => {
    render(<AdminFleetMap />);

    await waitFor(() => expect(getRestaurants).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Refresh fleet map' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Fleet city' })).toHaveTextContent('BLR');
    expect(screen.getByTestId('fleet-riders-empty')).toHaveTextContent(
      'No riders are currently sharing a usable location.',
    );
    expect(getDelivery).toHaveBeenCalledWith(
      '/api/v1/internal/admin/delivery/fleet-cities',
      {},
    );
    expect(getDelivery).toHaveBeenCalledWith(
      '/api/v1/internal/admin/delivery/drivers/all-with-location',
      { queries: { cityId: 'BLR' } },
    );
    expect(getRestaurants).toHaveBeenCalledWith(
      '/api/v1/internal/admin/restaurants/all-with-location',
      { queries: { cityId: 'BLR' } },
    );
    expect(getCustomerAddresses).toHaveBeenCalledWith(
      '/api/v1/internal/admin/customers/addresses',
      { queries: { cityId: 'BLR' } },
    );
    expect(getCustomerAddresses).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh fleet map' }));
    await waitFor(() => expect(getRestaurants).toHaveBeenCalledTimes(2));

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    await waitFor(() => expect(getRestaurants).toHaveBeenCalledTimes(3));
    expect(getRestaurants).toHaveBeenCalledTimes(3);
    expect(getCustomerAddresses).toHaveBeenCalledTimes(3);
  });

  test('propagates the selected fleet city to every map layer', async () => {
    render(<AdminFleetMap />);

    const citySelector = await screen.findByRole('combobox', { name: 'Fleet city' });
    await waitFor(() => expect(citySelector).toHaveTextContent('BLR'));
    fireEvent.click(citySelector);
    fireEvent.click(screen.getByRole('option', { name: 'HYD' }));

    await waitFor(() => expect(getRestaurants).toHaveBeenLastCalledWith(
      '/api/v1/internal/admin/restaurants/all-with-location',
      { queries: { cityId: 'HYD' } },
    ));
    expect(getDelivery).toHaveBeenLastCalledWith(
      '/api/v1/internal/admin/delivery/drivers/all-with-location',
      { queries: { cityId: 'HYD' } },
    );
    expect(getCustomerAddresses).toHaveBeenLastCalledWith(
      '/api/v1/internal/admin/customers/addresses',
      { queries: { cityId: 'HYD' } },
    );
  });
});
