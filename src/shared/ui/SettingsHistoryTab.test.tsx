import { render, screen } from '@testing-library/react';
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
  createdAt: '2026-09-24T14:05:33',
  ...over,
});

function historyOf(...orders: ReturnType<typeof order>[]) {
  get.mockResolvedValue({ data: { content: orders, last: true } });
  return render(<SettingsHistoryTab />);
}

describe('placedAt', () => {
  it('formats a readable date and time', () => {
    const text = placedAt('2026-09-24T14:05:33');
    expect(text).toMatch(/2026/);
    expect(text).toMatch(/\d{1,2}:05/);
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
    expect(time!.getAttribute('dateTime')).toBe('2026-09-24T14:05:33');
    expect(time!.textContent).toBe(placedAt('2026-09-24T14:05:33'));
  });

  it('leaves the date out rather than print "Invalid Date"', async () => {
    const { container } = historyOf(order({ createdAt: 'garbage' }));
    await screen.findByText('Brand 1 Outlet 10');
    expect(container.querySelector('time')).toBeNull();
    expect(container.textContent).not.toContain('Invalid Date');
  });
});
