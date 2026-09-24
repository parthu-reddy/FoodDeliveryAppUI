import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmProvider } from '@shared/ui';
import { ToastProvider } from '@/contexts/ToastContext';
import AdminSupportTickets from './AdminSupportTickets';

const ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const { getTickets, resolveTicket, legacyResolve, getProfile } = vi.hoisted(() => ({
  getTickets: vi.fn(), resolveTicket: vi.fn(), legacyResolve: vi.fn(), getProfile: vi.fn(),
}));
vi.mock('@/lib/zodiosClients', () => ({ customerApi: { adminOrderManual: {
  getOpenSupportTickets: getTickets, resolveSupportTicket: legacyResolve,
}, adminRefund: { resolveTicket } } }));
vi.mock('@/lib/tokenStore', () => ({ getUserProfile: getProfile }));
vi.mock('@features/communication/components/ChatWidget', () => ({ ChatWidget: () => null }));

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
    getTickets.mockReset().mockResolvedValue({ content: [ticket], totalPages: 1 });
    resolveTicket.mockReset().mockResolvedValue(undefined);
    legacyResolve.mockReset();
    getProfile.mockReset().mockReturnValue({ id: ADMIN_ID });
  });

  it('names the amount and order, cancels without resolving, and submits only after confirmation', async () => {
    await openTicket();
    fireEvent.change(screen.getByPlaceholderText('Add admin notes (required for rejection)'), { target: { value: 'Reviewed missing item' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/₹275\.50/)).toBeInTheDocument();
    expect(within(dialog).getByText(new RegExp(ticket.orderId))).toBeInTheDocument();
    expect(resolveTicket).not.toHaveBeenCalled();
    expect(legacyResolve).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(resolveTicket).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve request' }));
    await waitFor(() => expect(resolveTicket).toHaveBeenCalledExactlyOnceWith(
      { approved: true, notes: 'Reviewed missing item', faultType: 'UNKNOWN', overrideAmount: 275.5 },
      { params: { ticketId: ticket.id }, headers: { 'X-User-Id': ADMIN_ID } },
    ));
  });

  it.each([undefined, null, 0, -1, NaN, Infinity])('does not approve an unavailable or invalid amount: %s', async refundAmount => {
    getTickets.mockResolvedValue({ content: [{ ...ticket, refundAmount }], totalPages: 1 });
    await openTicket();
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    expect(await screen.findByText('The refund amount is unavailable. Refresh the ticket before approving.')).toBeInTheDocument();
    expect(resolveTicket).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('still confirms rejection without requiring a refund amount', async () => {
    getTickets.mockResolvedValue({ content: [{ ...ticket, refundAmount: undefined }], totalPages: 1 });
    await openTicket();
    fireEvent.change(screen.getByPlaceholderText('Add admin notes (required for rejection)'), { target: { value: 'Not eligible' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject Request' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Reject this request?')).toBeInTheDocument();
    expect(resolveTicket).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject request' }));
    await waitFor(() => expect(resolveTicket).toHaveBeenCalledExactlyOnceWith(
      { approved: false, notes: 'Not eligible', faultType: 'UNKNOWN', overrideAmount: undefined },
      { params: { ticketId: ticket.id }, headers: { 'X-User-Id': ADMIN_ID } },
    ));
    expect(legacyResolve).not.toHaveBeenCalled();
  });
});


describe('Support Tickets refund submission failures', () => {
  beforeEach(() => {
    getTickets.mockReset().mockResolvedValue({ content: [ticket], totalPages: 1 });
    resolveTicket.mockReset();
    legacyResolve.mockReset();
    getProfile.mockReset().mockReturnValue({ id: ADMIN_ID });
  });

  it('keeps the ticket and notes available when refund submission fails', async () => {
    resolveTicket.mockRejectedValue(new Error('REFUND_EXCEEDS_REMAINING'));
    await openTicket();
    fireEvent.change(screen.getByPlaceholderText('Add admin notes (required for rejection)'), { target: { value: 'Keep these notes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve request' }));
    expect(await screen.findByText('Failed to resolve ticket: REFUND_EXCEEDS_REMAINING')).toBeInTheDocument();
    expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add admin notes (required for rejection)')).toHaveValue('Keep these notes');
    expect(screen.queryByText('Ticket successfully approved')).not.toBeInTheDocument();
    expect(legacyResolve).not.toHaveBeenCalled();
  });

  it('requires an administrator identity before resolving', async () => {
    getProfile.mockReturnValue(null);
    await openTicket();
    fireEvent.click(screen.getByRole('button', { name: 'Resolve Ticket' }));
    expect(await screen.findByText('Your session does not identify you; sign in again before resolving a refund.')).toBeInTheDocument();
    expect(resolveTicket).not.toHaveBeenCalled();
    expect(legacyResolve).not.toHaveBeenCalled();
  });
});
