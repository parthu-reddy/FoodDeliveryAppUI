import { OrderStatus } from '../types';
/**
 * Maps between backend order statuses (uppercase) and frontend statuses (lowercase).
 * Backend (Java enums): RECEIVED, ACCEPTED, PREPARING, READY_FOR_PICKUP, PICKED_UP, DELIVERED, CANCELLED, ON_HOLD
 * Frontend (TypeScript): placed, accepted, preparing, dispatched, picked_up, delivered, on_hold
 */

const backendToFrontend: Record<string, string> = {
  RECEIVED: OrderStatus.PAID,
  ACCEPTED: OrderStatus.ACCEPTED,
  PREPARING: OrderStatus.ACCEPTED,
  READY_FOR_PICKUP: OrderStatus.DISPATCHED,
  PICKED_UP: 'picked_up',
  DELIVERED: OrderStatus.DELIVERED,
  CANCELLED: OrderStatus.CANCELLED,
  ON_HOLD: OrderStatus.AWAITING_DELAY_APPROVAL,
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
