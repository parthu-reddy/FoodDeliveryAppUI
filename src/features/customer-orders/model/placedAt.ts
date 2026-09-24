/**
 * "24 Sept 2026, 2:05 pm" -- when an order was placed, in the viewer's locale. Empty for a
 * missing or unreadable timestamp, so a row shows nothing rather than "Invalid Date".
 *
 * `createdAt` is the backend's LocalDateTime: an ISO string with no zone, which the browser reads
 * as local time. That is how every other order timestamp in this app is read as well.
 */
export function placedAt(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
