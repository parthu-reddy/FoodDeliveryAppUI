import React from 'react';
import type { Order } from '@/types';
import { ChatWidget, type ChatWidgetHandle } from '@features/communication/components/ChatWidget';
import { isOrderChatOffered } from '@features/customer-orders/model/orderStatus';

/**
 * The conversation about the order the customer is tracking — and the rule for when it stops
 * being offered.
 *
 * A delivered order keeps its chat for two hours so a customer can raise a problem. The rule is
 * `isOrderChatOffered`, shared with the delivered summary's "Something wrong with this order?"
 * button so the button is never shown without a chat to open. (An earlier inline version decided
 * "finished" from a hand-listed array that omitted CANCELLED_BY_PLATFORM and DELIVERY_FAILED, so a
 * platform cancellation offered chat forever.)
 */

interface CustomerOrderChatProps {
  currentTrackingOrder: Order | null;
  chatWidgetRef: React.RefObject<ChatWidgetHandle | null>;
}

export function CustomerOrderChat({ currentTrackingOrder, chatWidgetRef }: CustomerOrderChatProps) {
  return (
    <>
  {currentTrackingOrder
    // eslint-disable-next-line react-hooks/purity
    && isOrderChatOffered(currentTrackingOrder, Date.now()) && (
      <ChatWidget
        ref={chatWidgetRef}
        orderId={currentTrackingOrder.id}
        order={currentTrackingOrder}
      />
  )}
    </>
  );
}
