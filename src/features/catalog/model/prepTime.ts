/**
 * The outlet's prep-time default, as orders and customers see it.
 *
 * CustomerApplication promises each new order max(outlet default, slowest dish, 15 min)
 * (`OrderPrepTime`), so a default under 15 changes nothing: the stepper starts at 15 and the
 * browse card never shows less.
 */

export const PREP_FLOOR_MINUTES = 15;
export const PREP_MAX_MINUTES = 90;
export const PREP_STEP_MINUTES = 5;

/** Whole minutes from the API's seconds, floored at 15; null when the outlet sent none. */
export function outletPrepMinutes(seconds: number | null | undefined): number | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(PREP_FLOOR_MINUTES, Math.ceil(seconds / 60));
}

/** One stepper press, kept inside 15..90. */
export function stepPrepMinutes(minutes: number, direction: 1 | -1): number {
  return Math.min(PREP_MAX_MINUTES, Math.max(PREP_FLOOR_MINUTES, minutes + direction * PREP_STEP_MINUTES));
}
