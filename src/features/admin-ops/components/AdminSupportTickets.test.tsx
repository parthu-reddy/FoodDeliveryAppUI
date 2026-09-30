import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { ConfirmProvider } from '@shared/ui';
import { ToastProvider } from '@/contexts/ToastContext';
import AdminSupportTickets from './AdminSupportTickets';

const ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const mocks = vi.hoisted(() => ({
  getTickets: vi.fn(), resolveTicket: vi.fn(), getProfile: vi.fn(), chatInstances: 0,
  openChatOnly: vi.fn(),
}));
vi.mock('@/lib/zodiosClients', () => ({ customerApi: { adminOrderManual: {
  getOpenSupportTickets: mocks.getTickets,
}, adminRefund: { resolveTicket: mocks.resolveTicket } } }));
vi.mock('@/lib/tokenStore', () => ({ getUserProfile: mocks.getProfile }));
vi.mock('@features/communication/components/ChatWidget', () => ({
  ChatWidget: forwardRef(({ orderId }: { orderId: string }, ref) => {
    const [instanceId] = useState(() => String(++mocks.chatInstances));
    useImperativeHandle(ref, () => ({
      openAndRequestRefundQuote: () => undefined,
      openChatOnly: () => mocks.openChatOnly(orderId),
    }), [orderId]);
    return (
      <div
        data-testid="support-ticket-chat"
        data-order-id={orderId}
        data-instance-id={instanceId}
      />
    );
  }),
}));

const ticket = {
  id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  orderId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  customerId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  reason: 'ITEM_MISSING', status: 'OPEN', refundAmount: 275.5,
  createdAt: '2026-09-24T10:00:00Z',
};
async function openTicket() {
  render(<ToastProvider><ConfirmProvider><AdminSupportTickets /></ConfirmProvider></ToastProvider>);
  fireEvent.click(await screen.findByText('ITEM_MISSING'));
}

describe('Support Tickets approval confirmation', () => {
  beforeEach(() => {
    mocks.getTickets.mockReset().mockResolvedValue({ content: [ticket], totalPages: 1 });
    mocks.resolveTicket.mockReset().mockResolvedValue(undefined);
    mocks.getProfile.mockReset().mockReturnValue({ id: ADMIN_ID });
    mocks.chatInstances = 0;
    mocks.openChatOnly.mockReset();
  });

  it('opens the existing order conversation by order id', async () => {
    await openTicket();

    expect(screen.getByTestId('support-ticket-chat')).toHaveAttribute('data-order-id', ticket.orderId);
  });

  it('opens the remounted chat when switching to another ticket, keeping conversations isolated', async () => {
    const secondTicket = {
      ...ticket,
      id: '11111111-1111-1111-1111-111111111111',
      orderId: '22222222-2222-2222-2222-222222222222',
      customerId: '33333333-3333-3333-3333-333333333333',
      reason: 'WRONG_ITEM',
    };
    mocks.getTickets.mockResolvedValue({ content: [ticket, secondTicket], totalPages: 1 });
    await openTicket();

    const firstInstance = screen.getByTestId('support-ticket-chat').getAttribute('data-instance-id');
    fireEvent.click(screen.getByText('WRONG_ITEM'));

    const chat = await screen.findByTestId('support-ticket-chat');
    expect(chat).toHaveAttribute('data-order-id', secondTicket.orderId);
    expect(chat).not.toHaveAttribute('data-instance-id', firstInstance);
    await waitFor(() => expect(mocks.openChatOnly).toHaveBeenLastCalledWith(secondTicket.orderId));
  });

  it('names the amount and order, cancels without resolving, and submits only after confirmation', async () => {
    await openTicket();
    fireEvent.change(screen.getByPlaceholderText('Add admin notes (required for rejection)'), { target: { value: 'Reviewed missing item' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/₹275\.50/)).toBeInTheDocument();
    expect(within(dialog).getByText(new RegExp(ticket.orderId))).toBeInTheDocument();
    expect(mocks.resolveTicket).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(mocks.resolveTicket).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve request' }));
    await waitFor(() => expect(mocks.resolveTicket).toHaveBeenCalledExactlyOnceWith(
      { approved: true, notes: 'Reviewed missing item', faultType: 'UNKNOWN', overrideAmount: 275.5 },
      { params: { ticketId: ticket.id }, headers: { 'X-User-Id': ADMIN_ID } },
    ));
  });

  it.each([undefined, null, 0, -1, NaN, Infinity])('does not approve an unavailable or invalid amount: %s', async refundAmount => {
    mocks.getTickets.mockResolvedValue({ content: [{ ...ticket, refundAmount }], totalPages: 1 });
    await openTicket();
    expect(screen.getByRole('button', { name: 'Resolve Ticket' })).toBeDisabled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This ticket has no verified refund quote and can only be rejected.',
    );
    expect(mocks.resolveTicket).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('still confirms rejection without requiring a refund amount', async () => {
    mocks.getTickets.mockResolvedValue({ content: [{ ...ticket, refundAmount: undefined }], totalPages: 1 });
    await openTicket();
    fireEvent.change(screen.getByPlaceholderText('Add admin notes (required for rejection)'), { target: { value: 'Not eligible' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject Request' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Reject this request?')).toBeInTheDocument();
    expect(mocks.resolveTicket).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject request' }));
    await waitFor(() => expect(mocks.resolveTicket).toHaveBeenCalledExactlyOnceWith(
      { approved: false, notes: 'Not eligible', faultType: 'UNKNOWN', overrideAmount: undefined },
      { params: { ticketId: ticket.id }, headers: { 'X-User-Id': ADMIN_ID } },
    ));
  });
});


describe('Support Tickets refund submission failures', () => {
  beforeEach(() => {
    mocks.getTickets.mockReset().mockResolvedValue({ content: [ticket], totalPages: 1 });
    mocks.resolveTicket.mockReset();
    mocks.getProfile.mockReset().mockReturnValue({ id: ADMIN_ID });
  });

  it('keeps the ticket and notes available when refund submission fails', async () => {
    mocks.resolveTicket.mockRejectedValue(new Error('REFUND_EXCEEDS_REMAINING'));
    await openTicket();
    fireEvent.change(screen.getByPlaceholderText('Add admin notes (required for rejection)'), { target: { value: 'Keep these notes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve request' }));
    expect(await screen.findByText('Failed to resolve ticket: REFUND_EXCEEDS_REMAINING')).toBeInTheDocument();
    expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add admin notes (required for rejection)')).toHaveValue('Keep these notes');
    expect(screen.queryByText('Ticket successfully approved')).not.toBeInTheDocument();
  });

  it('requires an administrator identity before resolving', async () => {
    mocks.getProfile.mockReturnValue(null);
    await openTicket();
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    expect(await screen.findByText('Your session does not identify you; sign in again before resolving a refund.')).toBeInTheDocument();
    expect(mocks.resolveTicket).not.toHaveBeenCalled();
  });
});
