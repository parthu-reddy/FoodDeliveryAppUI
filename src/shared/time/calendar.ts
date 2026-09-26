import { parseInstant, toIso, tryParseInstant, type InstantValue } from './instant';
import { viewerTimeZone } from './zones';

/**
 * Calendar dates ("2026-09-25"): a day on a calendar, with no time and no zone of its own.
 *
 * They never pass through `new Date('2026-09-25')`. That parses as UTC midnight, which is still the
 * 24th anywhere west of Greenwich, so a campaign or statement date would display a day early in the
 * Americas. Arithmetic runs on UTC calendar fields, where there is no DST.
 */

export type LocalDate = string;

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parts(d: LocalDate): [number, number, number] {
  const m = LOCAL_DATE.exec(d);
  if (!m) throw new RangeError(`Not a calendar date (YYYY-MM-DD): "${d}"`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function fromUtcFields(ms: number): LocalDate {
  const t = new Date(ms);
  const y = t.getUTCFullYear();
  const mo = String(t.getUTCMonth() + 1).padStart(2, '0');
  const d = String(t.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

export function isLocalDate(value: string): boolean {
  return LOCAL_DATE.test(value);
}

/** Wall-clock fields of `epochMs` in `timeZone`. */
function wallClock(epochMs: number, timeZone: string) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p: Record<string, number> = {};
  for (const { type, value } of f.formatToParts(new Date(epochMs))) {
    if (type !== 'literal') p[type] = Number(value);
  }
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** The zone's offset from UTC at `epochMs`, in milliseconds (IST: +19_800_000). */
export function offsetMs(timeZone: string, epochMs: number): number {
  const w = wallClock(epochMs, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

/** The calendar date `instant` falls on in `timeZone` (default: the viewer's). */
export function localDateOf(instant: InstantValue, timeZone: string = viewerTimeZone()): LocalDate {
  const w = wallClock(parseInstant(instant), timeZone);
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

/** Whether `value` falls on calendar date `d` in `timeZone` (default: the viewer's); false when missing or unreadable. */
export function isOnDate(value: InstantValue | null | undefined, d: LocalDate, timeZone: string = viewerTimeZone()): boolean {
  const ms = tryParseInstant(value);
  return ms !== null && localDateOf(ms, timeZone) === d;
}

/** Today's calendar date in `timeZone` (default: the viewer's). Replaces `toISOString().split('T')[0]`, which is the UTC date. */
export function todayIn(timeZone: string = viewerTimeZone(), now: number = Date.now()): LocalDate {
  return localDateOf(now, timeZone);
}

export function addDays(d: LocalDate, days: number): LocalDate {
  const [y, m, day] = parts(d);
  return fromUtcFields(Date.UTC(y, m - 1, day + days));
}

/** The first instant of `d` in `timeZone`; where local midnight does not exist (a DST gap) the first instant that does. */
export function startOfDay(d: LocalDate, timeZone: string = viewerTimeZone()): number {
  const [y, m, day] = parts(d);
  const guess = Date.UTC(y, m - 1, day);
  // Two passes settle the offset; around a transition they can disagree, and the answer is the
  // earliest candidate that actually falls on `d`.
  const a = guess - offsetMs(timeZone, guess);
  const b = guess - offsetMs(timeZone, a);
  const onDay = [a, b].filter((t) => localDateOf(t, timeZone) === d);
  if (onDay.length > 0) return Math.min(...onDay);
  // Midnight fell in a gap: step forward to the first instant of the day.
  let t = Math.max(a, b);
  while (localDateOf(t, timeZone) !== d) t += 15 * 60_000;
  return t;
}

/** `d` in `timeZone` as a half-open `[from, to)` window of ISO instants: 23, 24 or 25 hours. */
export function dayWindow(d: LocalDate, timeZone: string = viewerTimeZone()): { from: string; to: string } {
  return { from: toIso(startOfDay(d, timeZone)), to: toIso(startOfDay(addDays(d, 1), timeZone)) };
}

/** The calendar month containing `d`, in `timeZone`, as a half-open `[from, to)` window of ISO instants. */
export function monthWindow(d: LocalDate, timeZone: string = viewerTimeZone()): { from: string; to: string } {
  const [y, m] = parts(d);
  const first = fromUtcFields(Date.UTC(y, m - 1, 1));
  const next = fromUtcFields(Date.UTC(y, m, 1));
  return { from: toIso(startOfDay(first, timeZone)), to: toIso(startOfDay(next, timeZone)) };
}

/** The `days` calendar days ending with `d` (so including it), in `timeZone`, as a half-open `[from, to)` window of ISO instants. */
export function lastDaysWindow(d: LocalDate, days: number, timeZone: string = viewerTimeZone()): { from: string; to: string } {
  return { from: toIso(startOfDay(addDays(d, 1 - days), timeZone)), to: toIso(startOfDay(addDays(d, 1), timeZone)) };
}

/** A calendar date for people ("25 Sept 2026"), never shifted by the viewer's zone. */
export function formatLocalDate(
  d: LocalDate | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
  locale?: string,
): string {
  if (!d) return '';
  const [y, m, day] = parts(d);
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(Date.UTC(y, m - 1, day));
}
