import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { directAssignmentPost, navigate, refetch, activeOrder } = vi.hoisted(() => ({
  directAssignmentPost: vi.fn(),
  navigate: vi.fn(),
  refetch: vi.fn(),
  activeOrder: {
    id: 'f0f0f0f0-0000-4000-8000-000000000011',
    restaurantId: 'f0f0f0f0-0000-4000-8000-000000000012',
    restaurantName: 'Audited Dispatch Kitchen',
    status: 'ORDER_ACCEPTED',
    deliveryStatus: 'PENDING',
    dispatchCityId: 'BLR',
    fleetSearchRadiusKm: 5,
    deliveryExecutiveId: null,
  },
}));

vi.mock('@/lib/zodiosClients', () => ({
  customerApi: { adminOrder: { get: vi.fn() } },
  deliveryApi: { adminDelivery: { get: vi.fn(), post: directAssignmentPost } },
  restaurantApi: { restaurantOutlet: { get: vi.fn() } },
}));

vi.mock('@/hooks/usePolling', async () => {
  const React = await import('react');
  return {
    usePolling: (options: {
      refreshKey?: string | number | null;
      onData?: (value: { data: { content: Array<typeof activeOrder>; totalPages: number } }) => void;
    }) => {
      const isActiveOrdersRequest = typeof options.refreshKey === 'number';
      React.useEffect(() => {
        if (isActiveOrdersRequest) {
          options.onData?.({ data: { content: [activeOrder], totalPages: 1 } });
        }
        // The hook double is intentionally invoked once, like the initial polling fetch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return {
        data: isActiveOrdersRequest || !options.refreshKey
          ? null
          : [{ id: 'f0f0f0f0-0000-4000-8000-000000000013', fullName: 'Ready Rider', lat: 12.97, lng: 77.59 }],
        dataRefreshKey: isActiveOrdersRequest ? null : options.refreshKey,
        isLoading: false,
        error: null,
        refetch,
      };
    },
  };
});

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@features/maps-tracking/components/AdminAssignmentMap', () => ({
  default: () => <div data-testid="assignment-map" />,
}));

import AdminLiveOperations from './AdminLiveOperations';

describe('AdminLiveOperations', () => {
  it('removes direct assignment and sends operators to the audited intervention workflow', async () => {
    render(<AdminLiveOperations />);

    fireEvent.click(await screen.findByText(`#${activeOrder.id.substring(0, 8)}`));

    expect(await screen.findByText('Nearby Ready Drivers (1)')).toBeInTheDocument();
    expect(screen.getAllByTestId('nearby-ready-driver')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /^assign$/i })).not.toBeInTheDocument();
    expect(directAssignmentPost).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Open Manual Interventions' }));
    expect(navigate).toHaveBeenCalledWith('/admin/interventions');
    expect(directAssignmentPost).not.toHaveBeenCalled();
  });
});
