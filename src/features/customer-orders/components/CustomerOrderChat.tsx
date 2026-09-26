import React from 'react';
import type { Order } from '@/types';
import { ChatWidget, type ChatWidgetHandle } from '@features/communication/components/ChatWidget';
import { isActiveOrder } from '@features/customer-orders/model/orderStatus';
import { parseInstant } from '@/shared/time';

/**
 * The conversation about the order the customer is tracking — and the rule for when it stops
 * being offered.
 *
 * That rule is why this is its own component: a delivered order keeps its chat for two hours
 * so a customer can raise a problem, and the version inline in the dashboard decided
 * "finished" from a hand-listed array that omitted CANCELLED_BY_PLATFORM and DELIVERY_FAILED
 * — so a platform cancellation offered chat forever. It now asks `isActiveOrder`, which is
 * the one definition.
 */

interface CustomerOrderChatProps {
  currentTrackingOrder: Order | null;
  chatWidgetRef: React.RefObject<ChatWidgetHandle | null>;
}

export function CustomerOrderChat({ currentTrackingOrder, chatWidgetRef }: CustomerOrderChatProps) {
  return (
    <>
  {currentTrackingOrder && (() => {
    // One definition of "finished", not a second hand-listed array: this one omitted
    // CANCELLED_BY_PLATFORM and DELIVERY_FAILED, so a platform cancellation kept offering chat
    // forever instead of for two hours.
    const isCompleted = !isActiveOrder(currentTrackingOrder);
    let showChat = !isCompleted;
    if (isCompleted && currentTrackingOrder.updatedAt) {
      const updatedTime = parseInstant(currentTrackingOrder.updatedAt);
      // eslint-disable-next-line react-hooks/purity
      showChat = (Date.now() - updatedTime) < (2 * 60 * 60 * 1000);
    }
    return showChat ? (
      <ChatWidget
        ref={chatWidgetRef}
        orderId={currentTrackingOrder.id}
        order={currentTrackingOrder}
        currentUserType="CUSTOMER"
        otherParticipants={[
          ...(currentTrackingOrder.deliveryExecutiveId ? [{
            userId: currentTrackingOrder.deliveryExecutiveId,
            entityType: 'DELIVERY' as const,
            displayName: 'Rider'
          }] : []),
          ...(currentTrackingOrder.restaurantId ? [{
            userId: currentTrackingOrder.restaurantId,
            entityType: 'RESTAURANT' as const,
            displayName: currentTrackingOrder.restaurantName || 'Restaurant'
          }] : [])
        ]}
      />
    ) : null;
  })()}
    </>
  );
}
