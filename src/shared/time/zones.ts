/**
 * Time zones. Every zone the UI uses is an IANA id ("Asia/Kolkata"), passed explicitly. The
 * viewer's own zone is only ever a default, never an assumption hidden inside a Date call.
 *
 * Browsers report CLDR-canonical ids, so an Indian viewer's zone reads "Asia/Calcutta". The
 * backend accepts both spellings (java.time lists the alias).
 */

/** The zone the person looking at the screen is in. */
export function viewerTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Whether `zone` is an IANA region id the browser knows (offsets such as "+05:30" are not zones). */
export function isValidTimeZone(zone: string): boolean {
  if (!zone || (!zone.includes('/') && zone !== 'UTC')) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Every zone the browser supports, for a picker. The viewer's zone is guaranteed to be present. */
export function timeZoneOptions(): string[] {
  const all = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  const viewer = viewerTimeZone();
  return all.includes(viewer) ? all : [viewer, ...all];
}

/** "IST", "GMT-2:30", ...: the short name of `zone` at `epochMs`, for labelling a time shown in a zone other than the viewer's. */
export function zoneAbbreviation(zone: string, epochMs: number): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' })
    .formatToParts(new Date(epochMs))
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? zone;
}
