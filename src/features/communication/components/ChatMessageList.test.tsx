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

    expect(screen.queryByRole('button', { name: 'Submit Refund Request' })).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: 'Submit Refund Request' }));

    expect(sendMessage).toHaveBeenCalledWith(
      JSON.stringify({ orderId: 'order-1', reason: 'Customer requested', refundType: 'FULL' }),
      'REFUND_REQUEST',
    );
  });
  it('preserves the selected partial items, quantities and reason in the submitted request', () => {
    const sendMessage=vi.fn();
    const itemId='f0000000-0000-4000-8000-000000000001';
    const content={quoteAmount: 27.5,refundType:'PARTIAL',orderId:'order-1',
      reason:'One missing portion',items:[{itemId,quantity:1}]};
    render(<ChatMessageList messages={[{...quoteMessage,content:JSON.stringify(content)}]}
      userId="customer-1" canRequestRefund orderId="order-1" sendMessage={sendMessage} />);
    fireEvent.click(screen.getByRole('button',{name:'Submit Refund Request'}));
    expect(sendMessage).toHaveBeenCalledWith(JSON.stringify({orderId:'order-1',reason:'One missing portion',
      refundType:'PARTIAL',items:[{itemId,quantity:1}]}),'REFUND_REQUEST');
  });

  it.each([
    {quoteAmount:25,refundType:'PARTIAL'},
    {quoteAmount:25,refundType:'PARTIAL',orderId:'order-1',reason:'Missing',items:[]},
    {quoteAmount:25,refundType:'PARTIAL',orderId:'order-2',reason:'Missing',items:[{itemId:'f0000000-0000-4000-8000-000000000001',quantity:1}]},
    {quoteAmount:25,refundType:'PARTIAL',orderId:'order-1',reason:'Missing',items:[{itemId:'f0000000-0000-4000-8000-000000000001',quantity:0}]},
  ])('blocks a stale, mismatched or incomplete partial quote: %j', content => {
    const sendMessage=vi.fn();
    render(<ChatMessageList messages={[{...quoteMessage,content:JSON.stringify(content)}]}
      userId="customer-1" canRequestRefund orderId="order-1" sendMessage={sendMessage} />);
    expect(screen.getByRole('button',{name:'Submit Refund Request'})).toBeDisabled();
    expect(sendMessage).not.toHaveBeenCalled();
    expect(screen.getByText('Request a new quote before submitting this refund request.')).toBeInTheDocument();
  });

  it.each([undefined,0,-1])('does not invent an eligible amount for an invalid quote: %s', quoteAmount => {
    render(<ChatMessageList messages={[{...quoteMessage,content:JSON.stringify({refundType:'FULL',quoteAmount})}]}
      userId="customer-1" canRequestRefund orderId="order-1" sendMessage={vi.fn()} />);
    expect(screen.getByText('Invalid quote response')).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Submit Refund Request'})).not.toBeInTheDocument();
    expect(screen.queryByText('₹0.00')).not.toBeInTheDocument();
  });

  it('shows the support-request amount without claiming that an OPEN ticket is a paid refund', () => {
    render(<ChatMessageList messages={[{...quoteMessage,messageType:'REFUND_DECISION',
      content:JSON.stringify({status:'OPEN',amount:27.5})}]}
      userId="customer-1" canRequestRefund orderId="order-1" sendMessage={vi.fn()} />);
    expect(screen.getByText('Requested amount: ₹27.50')).toBeInTheDocument();
    expect(screen.getByText('Under review by support. No refund has been approved yet.')).toBeInTheDocument();
  });

  it('marks a legacy decision amount unavailable rather than crediting a fabricated zero', () => {
    render(<ChatMessageList messages={[{...quoteMessage,messageType:'REFUND_DECISION',
      content:JSON.stringify({status:'OPEN'})}]}
      userId="customer-1" canRequestRefund orderId="order-1" sendMessage={vi.fn()} />);
    expect(screen.getByText('Requested amount: Unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/₹0\.00/)).not.toBeInTheDocument();
  });

});

describe('ChatMessageList older history', () => {
  const props = { messages: [quoteMessage], userId: 'customer-1', canRequestRefund: true, orderId: 'order-1', sendMessage: vi.fn() };

  it('offers earlier messages when there are some, and asks for them once per click', () => {
    const onLoadOlderMessages = vi.fn();
    render(<ChatMessageList {...props} hasOlderMessages onLoadOlderMessages={onLoadOlderMessages} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load earlier messages' }));
    expect(onLoadOlderMessages).toHaveBeenCalledOnce();
  });

  it('shows the request in flight and blocks a second one', () => {
    render(<ChatMessageList {...props} hasOlderMessages isLoadingOlderMessages onLoadOlderMessages={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Loading earlier messages…' })).toBeDisabled();
  });

  it('offers nothing when the whole history is shown', () => {
    render(<ChatMessageList {...props} hasOlderMessages={false} onLoadOlderMessages={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /earlier messages/ })).not.toBeInTheDocument();
  });
});

