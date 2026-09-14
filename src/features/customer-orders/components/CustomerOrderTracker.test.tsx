import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '@/mocks/server';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { Order } from '@/types';
import { CallProvider } from '@/contexts/CallContext';
import { CustomerOrderTracker } from './CustomerOrderTracker';

const ORDER_ID = '77777777-7777-7777-7777-777777777777';

const baseProps = {
  setTrackingOrder: () => {},
  activeOrders: [],
  setInternalOrders: () => {},
  showError: () => {},
  getFriendlyStatusMessage: () => 'Message',
};

const order = (over: Partial<Order>) => ({
  id: ORDER_ID,
  customerId: '88888888-8888-8888-8888-888888888888',
  restaurantId: '99999999-9999-9999-9999-999999999999',
  status: OrderStatus.PREPARING,
  totalAmount: 420,
  ...over,
} as Partial<Order> as Order);

/**
 * The component takes isActiveOrder/isFailedOrder as props, and picks its whole layout from them:
 * an active order gets the tracking view, anything finished gets the receipt view. Pass what the
 * real helpers would return for the order under test, or the assertions land on the wrong branch.
 */
const renderTracker = (o: Order, { active, failed }: { active: boolean; failed: boolean }) =>
  render(
    <CallProvider>
      <CustomerOrderTracker
        {...baseProps}
        currentTrackingOrder={o}
        isActiveOrder={() => active}
        isFailedOrder={() => failed}
      />
    </CallProvider>
  );

describe('CustomerOrderTracker terminal and cash copy', () => {
  test('a platform cancellation blames the platform, not the restaurant', async () => {
    // Phase 3 split CANCELLED_BY_RESTAURANT from CANCELLED_BY_PLATFORM precisely because they mean
    // different things to the customer. Before that the tracker said "Your order could not be
    // completed and will be refunded" for both, which reads as the restaurant's failure.
    server.use(http.get(`*/api/v1/money/customer/orders/${ORDER_ID}/refunds`, () => HttpResponse.json([])));

    renderTracker(order({ status: OrderStatus.CANCELLED_BY_PLATFORM }), { active: false, failed: true });

    expect(await screen.findByText(/could not find a rider/i)).toBeInTheDocument();
    expect(screen.queryByText(/the restaurant could not fulfil/i)).not.toBeInTheDocument();
  });

  test('a restaurant cancellation says so, and shows the reason the server sent', async () => {
    server.use(http.get(`*/api/v1/money/customer/orders/${ORDER_ID}/refunds`, () => HttpResponse.json([])));

    renderTracker(
      order({ status: OrderStatus.CANCELLED_BY_RESTAURANT, cancellationReason: 'Kitchen closed early' }),
      { active: false, failed: true }
    );

    expect(await screen.findByText(/the restaurant could not fulfil/i)).toBeInTheDocument();
    expect(screen.getByTestId('cancellation-reason')).toHaveTextContent('Kitchen closed early');
  });

  test('a cash order is told to have the money ready, and what it paid once delivered', () => {
    const { unmount } = renderTracker(
      order({ status: OrderStatus.PREPARING, paymentMethod: 'COD' }),
      { active: true, failed: false }
    );
    expect(screen.getByTestId('cod-notice')).toHaveTextContent(/pay .* in cash on delivery/i);
    unmount();

    renderTracker(
      order({
        status: OrderStatus.HANDED_OVER,
        deliveryStatus: DeliveryStatus.DELIVERED,
        paymentMethod: 'COD',
        cashCollectedAmount: 400,
      }),
      { active: false, failed: false }
    );
    expect(screen.getByTestId('cod-notice')).toHaveTextContent(/paid .*400/i);
  });

  test('a prepaid order is never told to bring cash', () => {
    renderTracker(order({ status: OrderStatus.PREPARING, paymentMethod: 'CARD' }), { active: true, failed: false });
    expect(screen.queryByTestId('cod-notice')).not.toBeInTheDocument();
  });

  test('a refunded order shows where the money went', async () => {
    // A cancelled order used to show nothing about the refund at all -- store credit in particular
    // is invisible unless somebody says that is where it went.
    server.use(
      http.get(`*/api/v1/money/customer/orders/${ORDER_ID}/refunds`, () =>
        HttpResponse.json([{
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          orderId: ORDER_ID,
          amount: 420,
          status: 'COMPLETED',
          destination: 'STORE_CREDIT',
          method: 'WALLET',
        }])),
    );

    renderTracker(order({ status: OrderStatus.CANCELLED_BY_PLATFORM }), { active: false, failed: true });

    await waitFor(() => {
      expect(screen.getByTestId('refund-state')).toHaveTextContent('COMPLETED');
    });
    expect(screen.getByTestId('refund-state')).toHaveTextContent(/store credit/i);
  });
});
