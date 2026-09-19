import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  handlePickUpFood: () => {},
  handleAbortJob: () => {},
  handleCompleteDelivery: () => {},
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

    expect(screen.queryByLabelText(/cash collected/i)).not.toBeInTheDocument();
    expect(confirmSlider()).not.toHaveAttribute('aria-disabled');
    expect(confirmSlider()).toHaveAttribute('tabindex', '0');
  });
});
