import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '@/types';
import { ChatMessageList } from './ChatMessageList';

const quoteMessage: ChatMessage = {
  id: 'quote-1',
  sessionId: 'session-1',
  senderId: 'SYSTEM',
  senderName: 'System',
  senderType: 'SYSTEM',
  messageType: 'REFUND_QUOTE_RESPONSE',
  content: JSON.stringify({ quoteAmount: 100, refundType: 'FULL' }),
  timestamp: '2026-09-29T00:00:00Z',
};

describe('ChatMessageList refund actions', () => {
  it('labels a support moderator message using the server-defined sender type', () => {
    const supportMessage: ChatMessage = {
      ...quoteMessage,
      id: 'support-1',
      senderId: 'admin-1',
      senderName: 'Support administrator',
      senderType: 'SUPPORT_MODERATOR',
      messageType: 'TEXT',
      content: 'How can I help?',
    };

    render(<ChatMessageList
      messages={[supportMessage]}
      userId="customer-1"
      canRequestRefund={false}
      orderId="order-1"
      sendMessage={vi.fn()}
    />);

    expect(screen.getByText('Support administrator (Support)')).toBeInTheDocument();
  });

  it('does not offer a refund acceptance action to a restaurant or rider viewer', () => {
    render(<ChatMessageList
      messages={[quoteMessage]}
      userId="restaurant-1"
      canRequestRefund={false}
      orderId="order-1"
      sendMessage={vi.fn()}
    />);

    expect(screen.queryByRole('button', { name: 'Accept & Process Refund' })).not.toBeInTheDocument();
  });

  it('offers the customer action without a browser-supplied customer id', () => {
    const sendMessage = vi.fn();
    render(<ChatMessageList
      messages={[quoteMessage]}
      userId="customer-1"
      canRequestRefund
      orderId="order-1"
      sendMessage={sendMessage}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept & Process Refund' }));

    expect(sendMessage).toHaveBeenCalledWith(
      JSON.stringify({ orderId: 'order-1', reason: 'Customer requested', refundType: 'FULL' }),
      'REFUND_REQUEST',
    );
  });
});
