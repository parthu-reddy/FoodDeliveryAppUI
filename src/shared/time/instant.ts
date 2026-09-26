/**
 * Instants: points in time. The backend sends every one as ISO-8601 in UTC ("2026-09-25T04:30:00Z");
 * a few event payloads carry epoch milliseconds instead. Both are unambiguous.
 *
 * A timestamp WITHOUT a zone ("2026-09-25T10:00:00") is rejected, not parsed. `new Date()` would read
 * it as the viewer's local time, silently moving it by the viewer's offset, which is how an order's
 * placed-at time could read 5h30 early. If one ever arrives it is a server bug, and it should be
 * loud. RandomDocuments/TimezoneCorrectness_2026-09-25.
 */

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

/** What the API gives us for a moment: an ISO instant string or epoch milliseconds. */
export type InstantValue = string | number;

export class ZonelessTimestampError extends Error {
  constructor(value: string) {
    super(`Refusing to guess the zone of "${value}": an instant must end in Z or an offset`);
    this.name = 'ZonelessTimestampError';
  }
}

/** Epoch milliseconds of `value`. Throws on a zone-less or malformed timestamp. */
export function parseInstant(value: InstantValue): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new RangeError(`Not an instant: ${value}`);
    return value;
  }
  if (!ISO_INSTANT.test(value)) {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) throw new ZonelessTimestampError(value);
    throw new RangeError(`Not an ISO-8601 instant: "${value}"`);
  }
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) throw new RangeError(`Not an ISO-8601 instant: "${value}"`);
  return ms;
}

/** Like parseInstant, but a missing or unusable value is null instead of an exception, for optional API fields. */
export function tryParseInstant(value: InstantValue | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  try {
    return parseInstant(value);
  } catch {
    return null;
  }
}

/** The current instant as an ISO-8601 UTC string, for payloads sent to the server. */
export function nowIso(): string {
  return new Date(Date.now()).toISOString();
}

/** An epoch-ms instant as an ISO-8601 UTC string. */
export function toIso(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

/** Milliseconds from now until `value` (negative once it has passed). */
export function msUntil(value: InstantValue, now: number = Date.now()): number {
  return parseInstant(value) - now;
}
