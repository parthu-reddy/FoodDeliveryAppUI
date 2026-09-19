import React from 'react';
import type { Order } from '@/types';
import { ChatWidget } from '@features/communication/components/ChatWidget';

/**
 * The conversation about one order, with whichever of the customer and the rider is on it.
 *
 * The participant list is built from the order rather than assumed: an order that has not
 * been assigned a rider has no rider to talk to, and offering the tab anyway was how the
 * restaurant ended up messaging nobody.
 */

interface RestaurantOrderChatProps {
  order: Order;
  onClose: () => void;
  onBack: () => void;
}

export function RestaurantOrderChat({ order, onClose, onBack }: RestaurantOrderChatProps) {
  return (
    <ChatWidget
      orderId={order.id}
      order={order}
      currentUserType="RESTAURANT"
      otherParticipants={[
        ...(order.customerId
          ? [{ userId: order.customerId, entityType: 'CUSTOMER' as const, displayName: 'Customer' }]
          : []),
        ...(order.deliveryExecutiveId
          ? [{ userId: order.deliveryExecutiveId, entityType: 'DELIVERY' as const, displayName: 'Rider' }]
          : []),
      ]}
      onClose={onClose}
      onBack={onBack}
    />
  );
}
