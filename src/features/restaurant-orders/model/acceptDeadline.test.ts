import { describe, it, expect } from 'vitest';
import { ACCEPT_WINDOW_MS, acceptDeadline, formatCountdown, promisedPrepMinutes } from './acceptDeadline';

describe('acceptDeadline', () => {
  it('is ten minutes after the order arrived', () => {
    const at = '2026-09-24T10:00:00Z';
    expect(acceptDeadline({ createdAt: at })).toBe(new Date(at).getTime() + ACCEPT_WINDOW_MS);
  });
  it('falls back to updatedAt, and gives up rather than inventing a time', () => {
    expect(acceptDeadline({ createdAt: '', updatedAt: '2026-09-24T10:00:00Z' })).toBe(new Date('2026-09-24T10:10:00Z').getTime());
    expect(acceptDeadline({ createdAt: '' })).toBeNull();
  });
});

describe('formatCountdown', () => {
  it('reads as minutes and seconds and never goes negative', () => {
    expect(formatCountdown(372_000)).toBe('6:12');
    expect(formatCountdown(9_000)).toBe('0:09');
    expect(formatCountdown(-5_000)).toBe('0:00');
  });
});

describe('promisedPrepMinutes', () => {
  it('matches the server: prepTime, else 15, plus any added minutes', () => {
    expect(promisedPrepMinutes({ prepTime: 25 })).toBe(25);
    expect(promisedPrepMinutes({})).toBe(15);
    expect(promisedPrepMinutes({ prepTime: 20, additionalPrepTime: 10 })).toBe(30);
  });
});
