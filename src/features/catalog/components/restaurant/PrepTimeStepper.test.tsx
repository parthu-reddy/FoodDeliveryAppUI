import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Outlet } from '@/types';

const put = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({ restaurantApi: { restaurantOutlet: { put: (...a: unknown[]) => put(...a) } } }));

import { PrepTimeStepper } from './PrepTimeStepper';

const outlet = { id: 'outlet-1', defaultPrepTimeSeconds: 1500 } as Outlet;
const more = () => fireEvent.click(screen.getByRole('button', { name: 'Increase prep time by five minutes' }));

describe('PrepTimeStepper', () => {
  beforeEach(() => { vi.useFakeTimers(); put.mockReset(); });
  afterEach(() => vi.useRealTimers());

  it('shows the saved default in minutes', () => {
    render(<PrepTimeStepper outlet={outlet} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('saves once after a burst of presses, in seconds', async () => {
    put.mockResolvedValue({});
    const onSaved = vi.fn();
    render(<PrepTimeStepper outlet={outlet} onSaved={onSaved} />);
    more(); more();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][1]).toEqual({ defaultPrepTimeSeconds: 2100 });
    expect(put.mock.calls[0][2]).toEqual({ params: { outletId: 'outlet-1' } });
    expect(onSaved).toHaveBeenCalled();
  });

  it('puts the number back and says so when the save fails', async () => {
    put.mockRejectedValue(new Error('500'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PrepTimeStepper outlet={outlet} />);
    more();
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save. Still 25 min.');
  });

  it('cannot go under the 15-minute floor orders already have', () => {
    render(<PrepTimeStepper outlet={{ id: 'o', defaultPrepTimeSeconds: 900 } as Outlet} />);
    expect(screen.getByRole('button', { name: 'Decrease prep time by five minutes' })).toBeDisabled();
  });
});
