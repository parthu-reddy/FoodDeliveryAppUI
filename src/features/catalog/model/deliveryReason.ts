/**
 * Why delivery is unavailable, in words a customer can act on.
 *
 * The UI used to decide this by comparing the server's string to the literal
 * `'NO_DELIVERY_PARTNER_NEARBY'`. That comparison never fired: the availability endpoint
 * answers 409 with `errorCode: null` and a written sentence, so the code branch was dead and
 * every cause collapsed into "Out of Serviceable Area".
 *
 * Verified against the deployed app on 2026-09-19:
 *
 *   GET /api/v1/restaurants/{id}/delivery-availability -> 409
 *   { "errorCode": null,
 *     "message": "No delivery partner near that restaurant, please look for another restaurant." }
 *
 * The two cases need opposite actions — wait a few minutes for a rider, versus choose a
 * restaurant closer to you — so telling a customer the wrong one sends them down the wrong path.
 *
 * A server string is treated as a CODE when it is a single SHOUTY_SNAKE_CASE token, and as
 * prose when it contains whitespace. Prose is shown as written: the server already phrased it
 * for a person, and flattening it to a guess is how the information was lost.
 */

const CODES: Record<string, string> = {
  NO_DELIVERY_PARTNER_NEARBY: 'No delivery partner available nearby',
  OUT_OF_SERVICE_AREA: 'Out of serviceable area',
};

const FALLBACK = 'Delivery unavailable right now';

export function deliveryUnavailableReason(raw: unknown): string {
  if (typeof raw !== 'string') return FALLBACK;
  const text = raw.trim();
  if (!text) return FALLBACK;
  if (/\s/.test(text)) return text;
  return CODES[text] ?? FALLBACK;
}
