import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: { order: { get: (...a: unknown[]) => get(...a) } },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }));

import { SettingsHistoryTab } from './SettingsHistoryTab';
import { placedAt } from '@features/customer-orders/model/placedAt';

const order = (over: Record<string, unknown> = {}) => ({
  id: '1a2b3c4d-0000-0000-0000-000000000000',
  restaurantName: 'Brand 1 Outlet 10',
  status: 'CANCELLED',
  totalAmount: 420,
  items: [],
  // What the API sends: an Instant, UTC with its Z. 16:35:33Z is 14:05 in St John's, the zone every
  // UI test runs in (vitest.config.ts).
  createdAt: '2026-09-24T16:35:33Z',
  ...over,
});

function historyOf(...orders: ReturnType<typeof order>[]) {
  get.mockResolvedValue({ data: { content: orders, last: true } });
  return render(<SettingsHistoryTab />);
}

describe('placedAt', () => {
  it('formats a readable date and time on the viewer\'s clock', () => {
    const text = placedAt('2026-09-24T16:35:33Z');
    expect(text).toMatch(/2026/);
    expect(text).toMatch(/\b2:05/);
  });

  it('refuses a zone-less timestamp rather than guess whose clock it is', () => {
    // The backend never sends one; if it ever does, show nothing rather than a time that is off by
    // the viewer's offset. TimezoneCorrectness_2026-09-25.
    expect(placedAt('2026-09-24T14:05:33')).toBe('');
  });

  it('is empty, never "Invalid Date", for a missing or unreadable timestamp', () => {
    expect(placedAt(undefined)).toBe('');
    expect(placedAt(null)).toBe('');
    expect(placedAt('not a date')).toBe('');
  });
});

describe('SettingsHistoryTab', () => {
  beforeEach(() => get.mockReset());

  // HISTORY-03: each history row says when the order was placed.
  it('shows when each order was placed, machine-readable and human-readable', async () => {
    const { container } = historyOf(order());
    await screen.findByText('Brand 1 Outlet 10');
    const time = container.querySelector('time');
    expect(time).not.toBeNull();
    expect(time!.getAttribute('dateTime')).toBe('2026-09-24T16:35:33Z');
    expect(time!.textContent).toBe(placedAt('2026-09-24T16:35:33Z'));
  });

  it('leaves the date out rather than print "Invalid Date"', async () => {
    const { container } = historyOf(order({ createdAt: 'garbage' }));
    await screen.findByText('Brand 1 Outlet 10');
    expect(container.querySelector('time')).toBeNull();
    expect(container.textContent).not.toContain('Invalid Date');
  });

  // The motion inventory's "Pull to refresh | the customer's order history". It was built into
  // CustomerOrderHistory.tsx, which nothing renders, so the customer never had it.
  it('reloads the first page when the customer pulls down', async () => {
    historyOf(order());
    await screen.findByText('Brand 1 Outlet 10');
    expect(get).toHaveBeenCalledTimes(1);
    const list = document.querySelector('[data-pull-indicator]')!.parentElement!;
    fireEvent.pointerDown(list, { clientY: 0 });
    fireEvent.pointerMove(list, { clientY: 90 });
    fireEvent.pointerUp(list);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(get).toHaveBeenLastCalledWith('/api/v1/orders/history', { queries: { page: 0 } });
  });
});
