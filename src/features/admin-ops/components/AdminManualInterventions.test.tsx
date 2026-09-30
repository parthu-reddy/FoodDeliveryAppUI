import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmProvider } from '@shared/ui';

const post = vi.fn();
const refetch = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  customerApi: {
    adminOrderManual: {
      get: vi.fn(),
      post: (...args: unknown[]) => post(...args),
    },
  },
  deliveryApi: { adminDelivery: { get: vi.fn() } },
  restaurantApi: { restaurantOutlet: { get: vi.fn() } },
}));

type Intervention = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  dispatchCityId: string;
  fleetSearchRadiusKm: number;
  manualInterventionFailureCode?: string;
  manualInterventionFailedAt?: string;
};

let interventions: { content: Intervention[]; totalPages: number };

vi.mock('@/hooks/usePolling', () => ({
  usePolling: (options: { refreshKey?: unknown }) => {
    if (typeof options.refreshKey === 'number') {
      return { data: interventions, refetch };
    }
    return {
      data: typeof options.refreshKey === 'string'
        ? [{ id: 'f0f0f0f0-0000-4000-8000-000000000002', fullName: 'Ready Rider' }]
        : [],
      dataRefreshKey: options.refreshKey,
      refetch,
      isLoading: false,
      error: null,
    };
  },
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));

import AdminManualInterventions from './AdminManualInterventions';

const ORDER_ID = 'f0f0f0f0-0000-4000-8000-000000000001';

function order(overrides: Partial<Intervention> = {}): Intervention {
  return {
    id: ORDER_ID,
    restaurantId: 'f0f0f0f0-0000-4000-8000-000000000003',
    restaurantName: 'Failure Recovery Kitchen',
    dispatchCityId: 'BLR',
    fleetSearchRadiusKm: 5,
    ...overrides,
  };
}

function renderScreen() {
  return render(
    <ConfirmProvider>
      <AdminManualInterventions />
    </ConfirmProvider>,
  );
}

describe('AdminManualInterventions failure recovery', () => {
  beforeEach(() => {
    interventions = {
      content: [order({
        manualInterventionFailureCode: 'DRIVER_NOT_ONLINE',
        manualInterventionFailedAt: '2026-09-29T10:00:00.000Z',
      })],
      totalPages: 1,
    };
    post.mockReset().mockResolvedValue({});
    refetch.mockReset();
    vi.stubGlobal('crypto', { randomUUID: () => 'manual-assignment-request-0001' });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('keeps a new request pending through a stale failure and reopens controls for a new durable failure', async () => {
    const screenView = renderScreen();
    fireEvent.click(screen.getByText(`#${ORDER_ID.substring(0, 8)}`).closest('button')!);
    fireEvent.change(screen.getByPlaceholderText('Reason for this manual assignment...'), {
      target: { value: 'The rider confirmed pickup proximity' },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Force Assign' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Force assign' }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(
      '/api/v1/internal/admin/orders/intervention/:orderId/assign-driver',
      {
        deliveryExecutiveId: 'f0f0f0f0-0000-4000-8000-000000000002',
        reason: 'The rider confirmed pickup proximity',
      },
      expect.objectContaining({
        params: { orderId: ORDER_ID },
        headers: { 'Idempotency-Key': 'manual-assignment-request-0001' },
      }),
    ));
    expect(screen.getByRole('status')).toHaveTextContent('being validated');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    interventions = {
      content: [order({
        manualInterventionFailureCode: 'DRIVER_NOT_ONLINE',
        manualInterventionFailedAt: '2026-09-29T10:00:01.000Z',
      })],
      totalPages: 1,
    };
    screenView.rerender(
      <ConfirmProvider>
        <AdminManualInterventions />
      </ConfirmProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('rider is no longer online');
    fireEvent.change(screen.getByPlaceholderText('Reason for this manual assignment...'), {
      target: { value: 'A replacement rider is now online' },
    });
    expect(screen.getByRole('button', { name: 'Force Assign' })).toBeEnabled();
  });
});
