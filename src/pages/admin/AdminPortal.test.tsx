import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@shared/ui';
import AdminPortal from './AdminPortal';

vi.mock('@/lib/zodiosClients', () => ({ customerApi: {
  adminOrderManual: { get: vi.fn().mockResolvedValue({ content: [] }) },
  adminRefund: { getTickets: vi.fn().mockResolvedValue({ content: [], totalPages: 1 }) },
} }));
vi.mock('@features/admin-ops/components/AdminLiveOperations', () => ({ default: () => null }));
vi.mock('@features/admin-ops/components/AdminManualInterventions', () => ({ default: () => null }));
vi.mock('@features/admin-ops/components/AdminSupportTickets', () => ({ default: () => <h2>Support Tickets screen</h2> }));
vi.mock('@features/admin-ops/components/AdminUserManagement', () => ({ default: () => null }));
vi.mock('@features/catalog/components/admin/AdminCategories', () => ({ default: () => null }));
vi.mock('@features/ledger/components/AdminLedgerView', () => ({ default: () => null }));
vi.mock('./money/AdminPayoutsPage', () => ({ default: () => null }));
vi.mock('./money/OperationsPage', () => ({ default: () => null }));
vi.mock('@features/reviews', () => ({ AdminReviewsView: () => null }));
vi.mock('@features/maps-tracking/components/AdminFleetMap', () => ({ default: () => null }));

function openPortal(path: string) {
  render(<MemoryRouter initialEntries={[path]}><ThemeProvider><ToastProvider><ConfirmProvider>
    <Routes><Route path="/admin/*" element={<AdminPortal onLogout={vi.fn()} />} /></Routes>
  </ConfirmProvider></ToastProvider></ThemeProvider></MemoryRouter>);
}

describe('Admin refund navigation', () => {
  it('opens the real refund queue from the sidebar and keeps Support Tickets reachable', async () => {
    openPortal('/admin/support_tickets');
    const nav = within(screen.getByRole('navigation'));
    fireEvent.click(nav.getByRole('button', { name: 'Refund Queue' }));
    expect(await screen.findByRole('heading', { name: 'Refund Exception Queue' })).toBeInTheDocument();
    expect(await screen.findByText('Queue Empty')).toBeInTheDocument();
    expect(nav.getByRole('button', { name: 'Refund Queue' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(nav.getByRole('button', { name: 'Support Tickets' }));
    expect(screen.getByRole('heading', { name: 'Support Tickets screen' })).toBeInTheDocument();
  });

  it('renders the queue on direct navigation to /admin/refunds', async () => {
    openPortal('/admin/refunds');
    expect(await screen.findByRole('heading', { name: 'Refund Exception Queue' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation')).getByRole('button', { name: 'Refund Queue' }))
      .toHaveAttribute('aria-current', 'page');
  });
});
