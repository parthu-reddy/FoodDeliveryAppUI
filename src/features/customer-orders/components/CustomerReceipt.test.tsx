import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CustomerOrderTracker } from './CustomerOrderTracker';
import { OrderStatus, DeliveryStatus } from '@/types/backend-enums';
import { Order } from '@/types';
import { CallProvider } from '../../../contexts/CallContext'
import { ToastProvider } from '@/contexts/ToastContext';

describe('Customer Receipt & Order Details', () => {
  const defaultProps = {
    setTrackingOrder: () => {},
    isActiveOrder: () => true,
    activeOrders: [],
    isFailedOrder: () => false,
    setInternalOrders: () => {},
    showError: () => {},
    getFriendlyStatusMessage: () => 'Message',
  };

  test('shows payment method badge on receipt', () => {
    const order = {
      id: 'ord-123',
      customerId: 'cust-123',
      restaurantId: 'rest-123',
      status: 'DELIVERED' as OrderStatus,
      deliveryStatus: 'DELIVERED' as DeliveryStatus,
      paymentMethod: 'UPI' as const,
      totalAmount: 350
    } as Partial<Order> as Order;

    render(
      <ToastProvider><CallProvider>
        <CustomerOrderTracker {...defaultProps} currentTrackingOrder={order} />
      </CallProvider></ToastProvider>
    );

    expect(screen.getByText('Paid via UPI')).toBeInTheDocument();
  });

  test('shows destination-aware refund copy for failed orders', () => {
    const order = {
      id: 'ord-123',
      customerId: 'cust-123',
      restaurantId: 'rest-123',
      status: 'DELIVERED' as OrderStatus,
      paymentMethod: 'CARD' as const,
      totalAmount: 350
    } as Partial<Order> as Order;

    render(
      <ToastProvider><CallProvider>
        <CustomerOrderTracker {...defaultProps} isFailedOrder={() => true} currentTrackingOrder={order} isActiveOrder={() => false} />
      </CallProvider></ToastProvider>
    );

    expect(screen.getByText('Refunded to CARD')).toBeInTheDocument();
    expect(screen.getByText('Refunds may take 3-5 business days to reflect in your account.')).toBeInTheDocument();
  });
});
