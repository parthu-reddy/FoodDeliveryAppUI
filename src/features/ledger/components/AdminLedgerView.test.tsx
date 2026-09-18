import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

const adminLedgerGet = vi.fn();
const showError = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  ledgerApi: { adminLedger: { get: (...a: unknown[]) => adminLedgerGet(...a) } },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError, showSuccess: vi.fn() }) }));

import AdminLedgerView from './AdminLedgerView';
import { ChargeCategory } from '@/types/backend-enums';

/**
 * The admin ledger explorer.
 *
 * <p>It had no test, and it was broken: it asked for {@code /api/v1/ledger/admin/transactions},
 * a path the gateway routes nowhere -- {@code /api/v1/ledger/**} covers only statements, payouts
 * and cash, and the admin prefix is {@code /api/v1/internal/admin/ledger/**}. Every request died at
 * the gateway. Found 2026-09-09; the endpoint was moved to the routed prefix.
 */
describe('AdminLedgerView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminLedgerGet.mockResolvedValue({ content: [], totalPages: 1 });
  });

  it('reads transactions from the gateway-routed admin path', async () => {
    render(<AdminLedgerView />);
    await waitFor(() => expect(adminLedgerGet).toHaveBeenCalled());

    const path = String(adminLedgerGet.mock.calls[0][0]);
    expect(path).toBe('/api/v1/internal/admin/ledger/transactions');
    // The unrouted path this screen used to call.
    expect(path).not.toBe('/api/v1/ledger/admin/transactions');
  });

  it('pages through the ledger rather than fetching everything', async () => {
    render(<AdminLedgerView />);
    await waitFor(() => expect(adminLedgerGet).toHaveBeenCalled());

    const queries = adminLedgerGet.mock.calls[0][1]?.queries as Record<string, unknown>;
    expect(queries).toMatchObject({ page: 0, size: 20 });
  });

  it('offers only the categories the backend enum defines', async () => {
    render(<AdminLedgerView />);
    await screen.findByText('Ledger Entries');

    // The screen once carried a hand-written category list that drifted from the enum, so filters
    // named categories the ledger had never booked and silently returned nothing.
    //
    // Select is a listbox now rather than a native <select>, so its options exist only while it
    // is open. Open each filter in turn and read the values it actually offers. The placeholder
    // is the trigger's text, not an option, so it no longer appears in this set.
    const readOptions = (name: string) => {
      const trigger = screen.getByRole('combobox', { name });
      fireEvent.click(trigger);
      const values = screen
        .getAllByRole('option')
        .map((o) => o.getAttribute('data-value'))
        .filter((v): v is string => Boolean(v));
      fireEvent.keyDown(trigger, { key: 'Escape' });
      return values;
    };

    const options = [
      ...readOptions('All Owner Types'),
      ...readOptions('All Categories'),
      ...readOptions('All Directions'),
    ];

    const ownerTypes = ['CUSTOMER', 'RESTAURANT', 'DRIVER', 'PLATFORM'];
    const directions = ['DEBIT', 'CREDIT'];
    const categories = Object.values(ChargeCategory) as string[];

    const allowed = new Set([...ownerTypes, ...directions, ...categories]);
    expect(options.filter((o) => !allowed.has(o))).toEqual([]);
    // and every enum value is actually offered
    expect(categories.filter((c) => !options.includes(c))).toEqual([]);
  });

  it('refuses an owner id with no owner type instead of querying for it', async () => {
    render(<AdminLedgerView />);
    await waitFor(() => expect(adminLedgerGet).toHaveBeenCalledTimes(1));

    fireEvent.change(await screen.findByPlaceholderText('Owner ID'), {
      target: { value: '11111111-1111-1111-1111-111111111111' },
    });
    fireEvent.submit(screen.getByPlaceholderText('Owner ID').closest('form')!);

    await waitFor(() => expect(showError).toHaveBeenCalled());
    // Still only the initial load: the invalid filter must not reach the service.
    expect(adminLedgerGet).toHaveBeenCalledTimes(1);
  });

  it('reports a failed fetch instead of showing an empty ledger', async () => {
    adminLedgerGet.mockRejectedValue(new Error('ledger-service unreachable'));
    render(<AdminLedgerView />);
    await waitFor(() => expect(showError).toHaveBeenCalled());
  });
});
