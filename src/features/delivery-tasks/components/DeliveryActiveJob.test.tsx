import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { Order } from '@/types';
import { CallProvider } from '@/contexts/CallContext';
import { DeliveryActiveJob } from './DeliveryActiveJob';

vi.mock('@features/maps-tracking/components/OrderTrackingMap', () => ({
  default: () => <div data-testid="map" />,
}));

const job = (paymentMethod: 'COD' | 'CARD') => ({
  id: 'aaaaaaaa-1111-2222-3333-444444444444',
  customerId: 'bbbbbbbb-1111-2222-3333-444444444444',
  restaurantId: 'cccccccc-1111-2222-3333-444444444444',
  status: OrderStatus.HANDED_OVER,
  deliveryStatus: DeliveryStatus.OUT_FOR_DELIVERY,
  paymentMethod,
  totalAmount: 420,
  deliveryFee: 40,
} as unknown as Order);

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

const confirmButton = () => screen.getByRole('button', { name: /confirm delivery/i });

describe('rider cash declaration', () => {
  test('a cash job asks for the amount and blocks confirmation until it is given', () => {
    // Phase 4 made DeliveredStateStrategy refuse a COD delivery with no declared amount
    // ("Declare the cash you collected for this order."). The rider UI sent no amount at all, so
    // every cash delivery ended in a 400 the rider could do nothing about.
    const { rerender } = render(
      <CallProvider>
        <DeliveryActiveJob {...props} currentJob={job('COD')} cashCollected="" setCashCollected={() => {}} />
      </CallProvider>
    );

    expect(screen.getByLabelText(/cash collected/i)).toBeRequired();
    expect(confirmButton()).toBeDisabled();

    rerender(
      <CallProvider>
        <DeliveryActiveJob {...props} currentJob={job('COD')} cashCollected="400" setCashCollected={() => {}} />
      </CallProvider>
    );
    expect(confirmButton()).toBeEnabled();
  });

  test('a prepaid job has no cash field and confirms straight away', () => {
    render(
      <CallProvider>
        <DeliveryActiveJob {...props} currentJob={job('CARD')} cashCollected="" setCashCollected={() => {}} />
      </CallProvider>
    );

    expect(screen.queryByLabelText(/cash collected/i)).not.toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  test('a negative declaration is refused', () => {
    // The server rejects it too; the rider should not have to discover that from a 400.
    render(
      <CallProvider>
        <DeliveryActiveJob {...props} currentJob={job('COD')} cashCollected="-5" setCashCollected={() => {}} />
      </CallProvider>
    );
    expect(confirmButton()).toBeDisabled();
  });
});
