/**
 * permissionCleanup.ts — Centralized cleanup for browser-granted permissions.
 *
 * On logout (or any auth-state teardown), this module forcibly revokes every
 * active hardware permission the app still holds:
 *   • Microphone streams (getUserMedia audio)
 *   • Camera streams (getUserMedia video)
 *   • Geolocation watchers (navigator.geolocation.watchPosition)
 *
 * Components that acquire a permission MUST register their handle here so
 * that cleanupAllPermissions() can release it even if the component's own
 * React cleanup hasn't fired yet (e.g. the user logged out while a
 * getUserMedia prompt was still open).
 */

// ----------  Media (microphone / camera) ----------
const activeStreams = new Set<MediaStream>();

export function registerMediaStream(stream: MediaStream): void {
  activeStreams.add(stream);
  // Auto-remove when every track in the stream ends naturally
  const onEnded = () => {
    if (stream.getTracks().every(t => t.readyState === 'ended')) {
      activeStreams.delete(stream);
    }
  };
  stream.getTracks().forEach(t => t.addEventListener('ended', onEnded));
}

export function releaseMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach(t => t.stop());
  activeStreams.delete(stream);
}

// ----------  Geolocation ----------
const activeWatchIds = new Set<number>();

export function registerGeolocationWatch(watchId: number): void {
  activeWatchIds.add(watchId);
}

export function clearGeolocationWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
  activeWatchIds.delete(watchId);
}

// ----------  Master cleanup ----------
/**
 * Forcibly stop ALL active media tracks and geolocation watches the app holds.
 * Call this on logout or whenever the auth session ends.
 */
export function cleanupAllPermissions(): void {
  // Stop every registered media stream
  for (const stream of activeStreams) {
    stream.getTracks().forEach(t => t.stop());
  }
  activeStreams.clear();

  // Clear every geolocation watcher
  for (const watchId of activeWatchIds) {
    navigator.geolocation.clearWatch(watchId);
  }
  activeWatchIds.clear();

  console.log('[PermissionCleanup] All active media streams and geolocation watches released.');
}
