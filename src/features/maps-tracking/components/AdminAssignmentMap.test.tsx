import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminAssignmentMap from './AdminAssignmentMap';

const { getRestaurant } = vi.hoisted(() => ({ getRestaurant: vi.fn() }));

vi.mock('@/contexts/ConfigContext', () => ({ useConfig: vi.fn() }));
vi.mock('@/lib/zodiosClients', () => ({
  restaurantApi: { restaurantOutlet: { get: getRestaurant } },
}));
vi.mock('./MapPanel', async () => {
  const { useEffect } = await import('react');
  return {
    MapPanel: ({ label, onReady }: { label: string; onReady?: (map: object) => void | (() => void) }) => {
      useEffect(() => {
        onReady?.({});
        // The real MapPanel constructs a map once per mount; this test double mirrors that lifecycle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return <div role="region" aria-label={label} />;
    },
  };
});
vi.mock('../model/maplibre', () => ({ maplibre: {} }));

describe('AdminAssignmentMap', () => {
  beforeEach(() => {
    getRestaurant.mockReset();
  });

  afterEach(cleanup);

  it('does not substitute Bangalore coordinates when the restaurant location is missing', async () => {
    getRestaurant.mockResolvedValue({ data: { lat: 0, lng: 0 } });

    render(
      <AdminAssignmentMap
        order={{ id: 'order-1', restaurantId: 'restaurant-1' }}
        availableDrivers={[]}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Restaurant location is unavailable. Nearby driver markers are unavailable until it is corrected.',
    );
    expect(screen.getByRole('region', { name: 'Drivers available for order order-1' })).toBeInTheDocument();
    await waitFor(() => expect(getRestaurant).toHaveBeenCalledWith(
      '/api/v1/restaurants/:id',
      { params: { id: 'restaurant-1' } },
    ));
  });
});
