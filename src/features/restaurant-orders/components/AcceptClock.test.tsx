import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AcceptClock } from './AcceptClock';

describe('AcceptClock', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the time left to accept', () => {
    vi.useFakeTimers({ now: 0 });
    render(<AcceptClock deadline={372_000} />);
    expect(screen.getByRole('timer')).toHaveAccessibleName('6:12 left to accept');
    expect(screen.getByText('6:12').style.color).toBe('var(--color-ink)');
  });

  it('turns danger-red in the last two minutes', () => {
    vi.useFakeTimers({ now: 0 });
    render(<AcceptClock deadline={90_000} />);
    expect(screen.getByText('1:30').style.color).toBe('var(--color-danger)');
  });

  it('says what happens at zero instead of sitting on 0:00', () => {
    vi.useFakeTimers({ now: 10_000 });
    render(<AcceptClock deadline={5_000} />);
    expect(screen.getByText('Cancelling')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveAccessibleName('Accept window has closed');
  });
});
