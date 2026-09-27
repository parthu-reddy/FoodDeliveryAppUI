/**
 * The rider's duty status as the server holds it, and the rules for letting it drive the screen.
 *
 * The screen used to learn the status once, from the profile at login, and afterwards only from its
 * own button presses. When the server took a rider off duty -- no location for a minute, a
 * suspension -- the button kept saying "Online Duty" to someone dispatch could no longer see.
 * The server now says so on the rider socket (`DUTY_STATUS`, pushed on every change and sent as a
 * snapshot on every connect), and the screen changes state only on that or on a successful call.
 */

export type DutyStatus = 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY';
export type DutyChangeReason =
  | 'RIDER_REQUEST'
  | 'LOCATION_LOST'
  | 'SUSPENDED'
  | 'ACCOUNT_DEACTIVATED'
  | 'CONNECTED';

export interface DutyStatusMessage {
  type: 'DUTY_STATUS';
  status: DutyStatus;
  reason: DutyChangeReason;
}

const STATUSES: readonly string[] = ['OFFLINE', 'ONLINE', 'ON_DELIVERY'];
const REASONS: readonly string[] = [
  'RIDER_REQUEST', 'LOCATION_LOST', 'SUSPENDED', 'ACCOUNT_DEACTIVATED', 'CONNECTED',
];

/** A `DUTY_STATUS` socket message, or `null` for anything else on the socket. */
export function parseDutyStatusMessage(data: unknown): DutyStatusMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const m = data as Record<string, unknown>;
  if (m.type !== 'DUTY_STATUS') return null;
  if (typeof m.status !== 'string' || !STATUSES.includes(m.status)) return null;
  if (typeof m.reason !== 'string' || !REASONS.includes(m.reason)) return null;
  return { type: 'DUTY_STATUS', status: m.status as DutyStatus, reason: m.reason as DutyChangeReason };
}

/** Carrying an order is on duty: the button reads "Online Duty" either way. */
export function isOnDuty(status: DutyStatus): boolean {
  return status === 'ONLINE' || status === 'ON_DELIVERY';
}

/** What to tell a rider the server took off duty. `null` when there is nothing they need to know. */
export function dutyChangeNotice(msg: DutyStatusMessage): string | null {
  if (msg.status !== 'OFFLINE') return null;
  switch (msg.reason) {
    case 'LOCATION_LOST':
      return "You're offline: your location stopped reaching us. Check location access and go online again.";
    case 'SUSPENDED':
      return "You're offline: your account was suspended. Contact support.";
    case 'ACCOUNT_DEACTIVATED':
      return "You're offline: your account was deactivated. Contact support.";
    case 'CONNECTED':
      return "You're offline. Go online to receive trips.";
    case 'RIDER_REQUEST':
      return null;
  }
}

/**
 * What the rider socket runs for a `DUTY_STATUS` message. The notice is shown only when the screen
 * believed otherwise, so the snapshot sent on every reconnect does not nag a rider who is already
 * looking at "Offline".
 */
export function applyDutyStatus(
  msg: DutyStatusMessage,
  { wasOnline, setIsOnline, showToast }: {
    wasOnline: boolean;
    setIsOnline: (online: boolean) => void;
    showToast: (message: string) => void;
  },
): void {
  const online = isOnDuty(msg.status);
  setIsOnline(online);
  if (wasOnline && !online) {
    const notice = dutyChangeNotice(msg);
    if (notice) showToast(notice);
  }
}

/** The server's message for a refused call (`ApiResponse.message`), or the fallback. */
export function apiErrorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message || fallback;
}

/**
 * A `watchPosition` error during a shift.
 *
 * Only a denial ends the shift -- and only if the server agrees: it refuses to take a rider off duty
 * mid-delivery, and the screen used to go "Offline" anyway, leaving a rider who still held an order
 * looking at an idle screen. Anything else (no fix indoors, a timeout) is weather: the "no location"
 * banner shows, and if it lasts the server takes the rider off duty and says so.
 */
export async function reactToLocationError(
  error: Pick<GeolocationPositionError, 'code' | 'PERMISSION_DENIED'>,
  deps: {
    goOffline: () => Promise<boolean>;
    setHasLocationFix: (hasFix: boolean) => void;
    setShowPermissionsPrompt: (open: boolean) => void;
    showToast: (message: string) => void;
  },
): Promise<void> {
  deps.setHasLocationFix(false);
  if (error.code !== error.PERMISSION_DENIED) return;
  if (await deps.goOffline()) {
    deps.setShowPermissionsPrompt(true);
  } else {
    deps.showToast('Location access is needed to finish this delivery. Turn it back on in your settings.');
  }
}
