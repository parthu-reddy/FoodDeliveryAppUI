import { tryParseInstant, type InstantValue } from './instant';
import { viewerTimeZone } from './zones';

/**
 * Formatting instants for people. Every formatter renders in an explicit zone: the one passed in
 * (an outlet's, an advertiser's) or else the viewer's. A missing value renders as '' so optional API
 * fields need no ternary at every call site.
 */

export interface ZoneOption {
  /** IANA zone to render in; defaults to the viewer's. */
  timeZone?: string;
}

/** Any Intl formatting of an instant; the other formatters are presets of this one. */
export function formatInstant(
  value: InstantValue | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  locale?: string,
): string {
  const ms = tryParseInstant(value);
  if (ms === null) return '';
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: options.timeZone ?? viewerTimeZone() })
    .format(ms);
}

/** "25 Sept 2026, 10:00 am" */
export function formatDateTime(value: InstantValue | null | undefined, opts: ZoneOption = {}): string {
  return formatInstant(value, { dateStyle: 'medium', timeStyle: 'short', timeZone: opts.timeZone });
}

/** "25 Sept 2026" */
export function formatDate(value: InstantValue | null | undefined, opts: ZoneOption = {}): string {
  return formatInstant(value, { day: 'numeric', month: 'short', year: 'numeric', timeZone: opts.timeZone });
}

/** "10:00 am" */
export function formatTime(value: InstantValue | null | undefined, opts: ZoneOption = {}): string {
  return formatInstant(value, { hour: 'numeric', minute: '2-digit', timeZone: opts.timeZone });
}

/** "10:00:05 am" */
export function formatTimeWithSeconds(value: InstantValue | null | undefined, opts: ZoneOption = {}): string {
  return formatInstant(value, { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: opts.timeZone });
}
