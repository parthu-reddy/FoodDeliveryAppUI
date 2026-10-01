import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { server } from '@/mocks/server';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@shared/ui';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import type { Order } from '@/types';
import CustomerDashboard from './CustomerDashboard';

const viewport = vi.hoisted(() => ({ wide: false }));
const addressBinding = vi.hoisted(() => ({ cartAddress: vi.fn(), locationKeys: [] as string[] }));
vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => viewport.wide }));
// Keep the dashboard, order poller, main view and delivered summary real. Unrelated
// catalog, checkout, maps and communication do not participate in this transition.
vi.mock('@features/catalog/model/useRestaurants', () => ({ useRestaurants: () => ({ restaurants: [] }) }));
vi.mock('@features/catalog/model/useCustomerStorefront', () => ({ useCustomerStorefront: () => ({}) }));
vi.mock('@features/customer-orders/model/useCustomerAddresses', () => ({
  useCustomerAddresses: () => {
    const [deliveryAddressId, setDeliveryAddressId] = useState('home');
    return { address: 'Home', deliveryLat: 12.98, deliveryLng: 77.64, deliveryAddressId, setDeliveryAddressId };
  },
}));
vi.mock('@features/customer-orders/model/useCustomerCart', () => ({
  useCustomerCart: ({ locationKey }: { locationKey: string }) => {
    addressBinding.locationKeys.push(locationKey);
    return { carts: {}, setDeliveryAddressId: addressBinding.cartAddress };
  },
}));
vi.mock('@features/customer-orders/model/useAddressChangeNotice', () => ({ useAddressChangeNotice: () => {} }));
vi.mock('@features/communication/components/CallOverlay', () => ({ CallOverlay: () => null }));
vi.mock('@features/customer-orders/components/CustomerOrderChat', () => ({ CustomerOrderChat: () => null }));
vi.mock('@features/customer-orders/components/CustomerModalStack', () => ({
  CustomerModalStack: ({ deliveryAddressId, setDeliveryAddressId }: {
    deliveryAddressId: string; setDeliveryAddressId: (id: string) => void;
  }) => <><output aria-label="Selected address identity">{deliveryAddressId}</output>
    <button onClick={() => setDeliveryAddressId('work')}>Select existing Work</button></>,
}));
vi.mock('@features/catalog/components/customer/CustomerRestaurantBrowser', () => ({
  CustomerRestaurantBrowser: () => <p>Browse restaurants</p>,
}));
vi.mock('@features/customer-orders/components/CustomerOrderTracker', () => ({
  CustomerOrderTracker: () => <p>Live tracker</p>,
}));
vi.mock('@features/customer-orders/components/CustomerLiveOrderRail', () => ({
  RAIL_MEDIA_QUERY: '(min-width: 1280px)',
  CustomerLiveOrderRail: () => viewport.wide ? <p>Live tracker</p> : null,
}));
vi.mock('@features/customer-orders/components/CustomerActiveOrdersCarousel', () => ({
  default: ({ activeOrders, setTrackingOrder }: { activeOrders: Order[]; setTrackingOrder: (order: Order) => void }) => (
    activeOrders.map(order => <button key={order.id} onClick={() => setTrackingOrder(order)}>Track {order.id}</button>)
  ),
}));

const ORDER_ID = '11111111-1111-1111-1111-111111111111';
const placed = {
  id: ORDER_ID,
  customerId: '22222222-2222-2222-2222-222222222222',
  restaurantId: '33333333-3333-3333-3333-333333333333',
  restaurantName: 'Test Kitchen',
  status: OrderStatus.CREATED,
  deliveryStatus: DeliveryStatus.PENDING,
  totalAmount: 420,
  items: [],
  createdAt: '2026-09-27T12:00:00Z',
};
const envelope = (data: unknown) => ({ success: true, message: 'ok', timestamp: new Date().toISOString(), data });

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('open customer tracker completion', () => {
  test.each([false, true])('shows the delivered receipt after the order leaves the active list (wide=%s)', async wide => {
    viewport.wide = wide;
    let completed = false;
    const batchRequests: string[][] = [];
    server.use(
      http.get('*/api/v1/orders/active', () => HttpResponse.json(envelope({ content: completed ? [] : [placed] }))),
      http.get('*/api/v1/orders/batch', ({ request }) => {
        batchRequests.push(Array.from(new URL(request.url).searchParams.values()));
        return HttpResponse.json(envelope([{ ...placed, status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.DELIVERED }]));
      }),
    );
    render(
      <MemoryRouter initialEntries={['/customer']}>
        <ThemeProvider><ToastProvider><ConfirmProvider>
          <CustomerDashboard userName="Customer" userPhone="8000000001" onLogout={() => {}} />
        </ConfirmProvider></ToastProvider></ThemeProvider>
      </MemoryRouter>,
    );
    // Select the original snapshot, as checkout or an explicit tracker selection does.
    fireEvent.click(await screen.findByRole('button', { name: `Track ${ORDER_ID}` }));
    expect(screen.getByText('Live tracker')).toBeInTheDocument();

    completed = true;
    await act(async () => { await vi.advanceTimersByTimeAsync(31000); });
    await waitFor(() => expect(batchRequests).toEqual([[ORDER_ID]]));
    expect(await screen.findByRole('heading', { name: 'Order delivered' })).toBeInTheDocument();
    expect(screen.getByText('Delivered from Test Kitchen.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tax invoice' })).toBeInTheDocument();
    expect(screen.queryByText('Live tracker')).not.toBeInTheDocument();

    // Dismissing the completed receipt must not reopen it from the retained order list.
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Order delivered' })).not.toBeInTheDocument());
    expect(screen.getByText('Browse restaurants')).toBeInTheDocument();
  });
});


test.each([
  { wide: false, anotherActive: false }, { wide: true, anotherActive: false },
  { wide: false, anotherActive: true }, { wide: true, anotherActive: true },
])('restored tracker keeps the same order through completion ($wide, otherActive=$anotherActive)', async ({ wide, anotherActive }) => {
  viewport.wide = wide;
  let completed = false;
  const second = { ...placed, id: '44444444-4444-4444-4444-444444444444', restaurantName: 'Other Kitchen' };
  const batchIds: string[][] = [];
  server.use(
    http.get('*/api/v1/orders/active', () => HttpResponse.json(envelope({
      content: [...(completed ? [] : [placed]), ...(anotherActive ? [second] : [])],
    }))),
    http.get('*/api/v1/orders/batch', ({ request }) => {
      batchIds.push(Array.from(new URL(request.url).searchParams.values()));
      return HttpResponse.json(envelope([{ ...placed, status: OrderStatus.HANDED_OVER, deliveryStatus: DeliveryStatus.DELIVERED }]));
    }),
  );
  render(<MemoryRouter initialEntries={['/customer']}>
    <ThemeProvider><ToastProvider><ConfirmProvider>
      <CustomerDashboard userName="Customer" userPhone="8000000001" onLogout={() => {}} />
    </ConfirmProvider></ToastProvider></ThemeProvider>
  </MemoryRouter>);
  // Login/reload selects the first loaded active order without an explicit Track click.
  await screen.findByText('Live tracker');
  completed = true;
  await act(async () => { await vi.advanceTimersByTimeAsync(31000); });
  await waitFor(() => expect(batchIds).toContainEqual([ORDER_ID]));
  expect(await screen.findByRole('heading', { name: 'Order delivered' })).toBeInTheDocument();
  expect(screen.getByText('Delivered from Test Kitchen.')).toBeInTheDocument();
  expect(screen.queryByText('Delivered from Other Kitchen.')).not.toBeInTheDocument();
  expect(screen.queryByText('Live tracker')).not.toBeInTheDocument();
  // Explicit dismissal still wins over automatic restoration and the retained poller list.
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Order delivered' })).not.toBeInTheDocument());
});

test('address selection updates the owner state, cart location and quote address together', async () => {
  viewport.wide = false;addressBinding.cartAddress.mockClear();addressBinding.locationKeys.length = 0;
  server.use(http.get('*/api/v1/orders/active', () => HttpResponse.json(envelope({ content: [] }))));
  render(<MemoryRouter initialEntries={['/customer']}><ThemeProvider><ToastProvider><ConfirmProvider>
    <CustomerDashboard userName="Customer" userPhone="8000000001" onLogout={() => {}} />
  </ConfirmProvider></ToastProvider></ThemeProvider></MemoryRouter>);
  expect(screen.getByRole('status', { name: 'Selected address identity' })).toHaveTextContent('home');
  fireEvent.click(screen.getByRole('button', { name: 'Select existing Work' }));
  await waitFor(() => expect(screen.getByRole('status', { name: 'Selected address identity' })).toHaveTextContent('work'));
  expect(addressBinding.locationKeys.at(-1)).toBe('work');
  expect(addressBinding.cartAddress).toHaveBeenLastCalledWith('work');
});
