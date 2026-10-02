import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import React from 'react';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { Order } from '@/types';
import { CallProvider } from '@/contexts/CallContext'
import { ToastProvider } from '@/contexts/ToastContext';
import { DeliveryActiveJob } from './DeliveryActiveJob';

vi.mock('@features/maps-tracking/components/OrderTrackingMap', () => ({
  default: () => <div data-testid="map" />,
}));

const job = () => ({
  id: 'aaaaaaaa-1111-2222-3333-444444444444',
  customerId: 'bbbbbbbb-1111-2222-3333-444444444444',
  restaurantId: 'cccccccc-1111-2222-3333-444444444444',
  status: OrderStatus.HANDED_OVER,
  deliveryStatus: DeliveryStatus.OUT_FOR_DELIVERY,
  paymentMethod: 'CARD',
  totalAmount: 420,
  deliveryFee: 40,
} as Partial<Order> as Order);

const props = {
  enteredPickupOtp: '',
  setEnteredPickupOtp: () => {},
  pickupOtpError: '',
  isUpdatingPickup: false,
  handleArrivedAtRestaurant: () => {},
  handlePickUpFood: async () => {},
  handleAbortJob: () => {},
  handleCompleteDelivery: async () => {},
  enteredOtp: '123456',
  setEnteredOtp: () => {},
  otpError: '',
  isUpdatingDelivery: false,
  goOfflineAfter: false,
  setGoOfflineAfter: () => {},
  waitTimerSeconds: 0,
  handleCustomerUnavailable: () => {},
};

// The rider confirms by sliding, not tapping -- a tap fires by accident in a pocket.
// This was a button until the control SwipeAction was built for went unused for a phase.
const confirmSlider = () => screen.getByRole('slider', { name: /slide to deliver/i });

describe('prepaid delivery completion', () => {
  test('asks only for the delivery OTP and can confirm immediately', () => {
    render(
      <ToastProvider><CallProvider>
        <DeliveryActiveJob {...props} currentJob={job()} />
      </CallProvider></ToastProvider>
    );

    expect(confirmSlider()).not.toHaveAttribute('aria-disabled');
    expect(confirmSlider()).toHaveAttribute('tabindex', '0');
  });
});


const handoverJob = () => ({ ...job(), status: OrderStatus.READY_FOR_PICKUP,
  deliveryStatus: DeliveryStatus.AT_RESTAURANT, customerName: 'Seeded Customer',
  restaurantName: 'Brand 1 Outlet 3', deliveryAddress: 'Home address',
  items: [{id:'item-1',menuItemId:'menu-1',name:'Paneer Bowl', quantity:2, price:90}, {id:'item-2',menuItemId:'menu-2',name:'Rice', quantity:1, price:40}],
});
const mountJob = (currentJob: Order) => (
  <ToastProvider><CallProvider><DeliveryActiveJob {...props} currentJob={currentJob} /></CallProvider></ToastProvider>
);

describe('active handover details', () => {
  test('shows owned items, quantities, customer and order total, and closes accessibly', async () => {
    render(mountJob(handoverJob()));
    fireEvent.click(screen.getByRole('button', {name:'View order details'}));
    const dialog = screen.getByRole('dialog', {name:'Order #aaaaaaaa'});
    await waitFor(() => expect(within(dialog).getByText('Seeded Customer')).toBeVisible());
    const items = within(dialog).getByRole('list', {name:'Order items'});
    expect(within(items).getAllByRole('listitem')).toHaveLength(2);
    expect(within(items).getByText('2 × Paneer Bowl')).toBeVisible();
    expect(within(items).getByText('1 × Rice')).toBeVisible();
    expect(within(dialog).getByText('Order total').parentElement).toHaveTextContent('₹420.00');
    expect(within(dialog).queryByText('Payout Details')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', {name:'Close'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  test('does not leave the previous order details open when the active job changes', async () => {
    const {rerender} = render(mountJob(handoverJob()));
    fireEvent.click(screen.getByRole('button', {name:'View order details'}));
    const next = {...handoverJob(), id:'dddddddd-1111-2222-3333-444444444444',
      items:[{id:'item-3',menuItemId:'menu-3',name:'Next order item', quantity:3, price:50}]};
    rerender(mountJob(next));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', {name:'View order details'}));
    const dialog = screen.getByRole('dialog', {name:'Order #dddddddd'});
    await waitFor(() => expect(within(dialog).getByText('3 × Next order item')).toBeVisible());
    expect(within(dialog).queryByText('2 × Paneer Bowl')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', {name:'Close'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(mountJob(handoverJob()));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  test('states when handover items are unavailable instead of claiming an empty checklist', async () => {
    render(mountJob({...handoverJob(),items:[]}));
    fireEvent.click(screen.getByRole('button', {name:'View order details'}));
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByText('Order items unavailable')).toBeVisible());
    expect(screen.queryByRole('list', {name:'Order items'})).not.toBeInTheDocument();
  });
});
