/**
 * Maps between backend order statuses (uppercase) and frontend statuses (lowercase).
 * Backend (Java enums): RECEIVED, ACCEPTED, PREPARING, READY_FOR_PICKUP, PICKED_UP, DELIVERED, CANCELLED, ON_HOLD
 * Frontend (TypeScript): placed, accepted, preparing, dispatched, picked_up, delivered, on_hold
 */

const backendToFrontend: Record<string, string> = {
  RECEIVED: 'placed',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'dispatched',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
};

const frontendToBackend: Record<string, string> = {};
for (const [k, v] of Object.entries(backendToFrontend)) {
  frontendToBackend[v] = k;
}

export function toFrontendStatus(backendStatus: string): string {
  return backendToFrontend[backendStatus] || backendStatus.toLowerCase();
}

export function toBackendStatus(frontendStatus: string): string {
  return frontendToBackend[frontendStatus] || frontendStatus.toUpperCase();
}
