import { formatInstant } from '@/shared/time';

/**
 * "24 Sept 2026, 2:05 pm" -- when an order was placed, in the viewer's zone and locale. Empty for a
 * missing or unreadable timestamp, so a row shows nothing rather than "Invalid Date".
 *
 * `createdAt` is an Instant: ISO-8601 in UTC with its `Z`. (This comment used to say it was
 * zone-less and read as local time; it was never zone-less. See TimezoneCorrectness_2026-09-25.)
 */
export function placedAt(iso: string | null | undefined): string {
  return formatInstant(iso, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
