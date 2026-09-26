import { describe, expect, it } from 'vitest';
import {
  addDays, dayWindow, formatInstant, formatLocalDate, formatTime, isValidTimeZone, lastDaysWindow, localDateOf,
  monthWindow, offsetMs, parseInstant, startOfDay, todayIn, tryParseInstant, ZonelessTimestampError,
} from '@/shared/time';

const T = '2026-09-25T04:30:00Z'; // 10:00 in Kolkata, 02:00 in St John's (NDT, -02:30)

describe('the test run itself', () => {
  it('runs in a hostile zone, so nothing here can pass by matching the developer’s zone', () => {
    // vitest.config.ts pins TZ=America/St_Johns: -02:30 in September. If this fails, every other
    // assertion in this file proves less than it claims.
    expect(new Date(Date.UTC(2026, 8, 25)).getTimezoneOffset()).toBe(150);
  });
});

describe('parseInstant', () => {
  it('accepts Z and offsets as the same moment', () => {
    expect(parseInstant(T)).toBe(Date.UTC(2026, 8, 25, 4, 30));
    expect(parseInstant('2026-09-25T10:00:00+05:30')).toBe(Date.UTC(2026, 8, 25, 4, 30));
    expect(parseInstant('2026-09-25T04:30:00.123456Z')).toBe(Date.UTC(2026, 8, 25, 4, 30, 0, 123));
    expect(parseInstant(1790310600000)).toBe(1790310600000);
  });

  it('refuses a zone-less timestamp instead of reading it as local time', () => {
    expect(() => parseInstant('2026-09-25T10:00:00')).toThrow(ZonelessTimestampError);
    expect(tryParseInstant('2026-09-25T10:00:00')).toBeNull();
    expect(tryParseInstant(undefined)).toBeNull();
  });
});

describe('formatting renders in an explicit zone', () => {
  it('shows the same instant as each zone’s wall clock', () => {
    expect(formatTime(T, { timeZone: 'Asia/Kolkata' })).toMatch(/^10:00\s?am$/i);
    expect(formatTime(T, { timeZone: 'America/St_Johns' })).toMatch(/^2:00\s?am$/i);
    expect(formatTime(T, { timeZone: 'Pacific/Chatham' })).toMatch(/^5:15\s?pm$/i);
  });

  it('defaults to the viewer’s zone, which in this run is St John’s', () => {
    expect(formatInstant(T, { hour: 'numeric', minute: '2-digit', hour12: false })).toBe('02:00');
  });

  it('renders a missing value as empty', () => {
    expect(formatTime(null)).toBe('');
  });
});

describe('calendar dates', () => {
  it('never shift west of Greenwich (new Date("2026-09-25") would be the 24th here)', () => {
    expect(formatLocalDate('2026-09-25', { day: 'numeric', month: 'numeric', year: 'numeric' }, 'en-GB')).toBe('25/09/2026');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('today is the date in the named zone, not the UTC date', () => {
    const now = Date.UTC(2026, 8, 25, 20, 45); // 02:15 on the 26th in Kolkata; 18:15 on the 25th in St John's
    expect(todayIn('Asia/Kolkata', now)).toBe('2026-09-26');
    expect(todayIn('America/St_Johns', now)).toBe('2026-09-25');
    expect(localDateOf(now, 'UTC')).toBe('2026-09-25');
  });
});

describe('day windows', () => {
  it('start at local midnight and are half-open', () => {
    expect(dayWindow('2026-09-25', 'Asia/Kolkata')).toEqual({ from: '2026-09-24T18:30:00.000Z', to: '2026-09-25T18:30:00.000Z' });
  });

  it('follow daylight saving: 23 hours in spring, 25 in autumn', () => {
    const len = (d: string, z: string) => {
      const w = dayWindow(d, z);
      return (parseInstant(w.to) - parseInstant(w.from)) / 3_600_000;
    };
    expect(len('2026-03-08', 'America/New_York')).toBe(23);
    expect(len('2026-11-01', 'America/New_York')).toBe(25);
    expect(len('2026-09-27', 'Pacific/Chatham')).toBe(23);
    expect(len('2026-09-25', 'Asia/Kolkata')).toBe(24);
  });

  it('handle a zone whose midnight does not exist', () => {
    // America/Havana springs forward at 00:00 (2026-03-08): the day starts at 01:00 local, 05:00Z.
    expect(startOfDay('2026-03-08', 'America/Havana')).toBe(Date.UTC(2026, 2, 8, 5, 0));
  });

  it('reports offsets including the odd ones', () => {
    expect(offsetMs('Asia/Kolkata', Date.UTC(2026, 8, 25))).toBe(5.5 * 3_600_000);
    expect(offsetMs('America/St_Johns', Date.UTC(2026, 8, 25))).toBe(-2.5 * 3_600_000);
  });
});

describe('month and last-N-days windows', () => {
  const hours = (w: { from: string; to: string }) => (parseInstant(w.to) - parseInstant(w.from)) / 3_600_000;

  it('a month runs from its first local midnight to the next month’s, DST hour and all', () => {
    const november = monthWindow('2026-11-15', 'America/New_York');
    expect(november).toEqual({ from: '2026-11-01T04:00:00.000Z', to: '2026-12-01T05:00:00.000Z' });
    expect(hours(november)).toBe(30 * 24 + 1);

    const march = monthWindow('2026-03-10', 'Europe/London');
    expect(march).toEqual({ from: '2026-03-01T00:00:00.000Z', to: '2026-03-31T23:00:00.000Z' });
    expect(hours(march)).toBe(31 * 24 - 1);
  });

  it('December rolls into the next year, on each zone’s own calendar', () => {
    expect(monthWindow('2026-12-31', 'Asia/Kolkata')).toEqual({ from: '2026-11-30T18:30:00.000Z', to: '2026-12-31T18:30:00.000Z' });
    expect(monthWindow('2026-12-31', 'America/Los_Angeles')).toEqual({ from: '2026-12-01T08:00:00.000Z', to: '2027-01-01T08:00:00.000Z' });
  });

  it('defaults to the viewer’s calendar, which in this run is St John’s, not UTC', () => {
    // 01:00Z on 1 October is still 30 September (22:30) in St John's: the viewer's month is September.
    const now = Date.UTC(2026, 9, 1, 1, 0);
    expect(monthWindow(todayIn(undefined, now))).toEqual({ from: '2026-09-01T02:30:00.000Z', to: '2026-10-01T02:30:00.000Z' });
    // St John's falls back on 1 November: its November is 721 hours.
    expect(monthWindow('2026-11-10')).toEqual({ from: '2026-11-01T02:30:00.000Z', to: '2026-12-01T03:30:00.000Z' });
  });

  it('the last 30 days are 30 calendar days including today, whatever their hours add up to', () => {
    const acrossFallBack = lastDaysWindow('2026-11-02', 30, 'America/New_York');
    expect(acrossFallBack).toEqual({ from: '2026-10-04T04:00:00.000Z', to: '2026-11-03T05:00:00.000Z' });
    expect(hours(acrossFallBack)).toBe(30 * 24 + 1);
    expect(lastDaysWindow('2026-09-25', 30)).toEqual({ from: '2026-08-27T02:30:00.000Z', to: '2026-09-26T02:30:00.000Z' });
  });

  it('the last 1 day is today', () => {
    expect(lastDaysWindow('2026-11-01', 1, 'America/New_York')).toEqual(dayWindow('2026-11-01', 'America/New_York'));
  });
});

describe('zone validation', () => {
  it('accepts IANA ids and rejects offsets and typos', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('+05:30')).toBe(false);
    expect(isValidTimeZone('IST')).toBe(false);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });
});
