import { deliveryApi } from '@/lib/zodiosClients';

/**
 * The only two calls that change a rider's duty status. Both throw when the server refuses, with the
 * reason in `response.data.message` (see `apiErrorMessage`).
 */

/** On duty at this position. The server refuses without one: dispatch finds riders by location. */
export async function requestGoOnline(driverId: string, lat: number, lng: number): Promise<void> {
  await deliveryApi.deliveryExecutive.post(
    '/api/delivery/status',
    { driverId, available: true, lat, lng },
    {},
  );
}

/** Off duty. The server refuses while the rider is carrying an order. */
export async function requestGoOffline(driverId: string): Promise<void> {
  await deliveryApi.deliveryExecutive.post('/api/delivery/status', { driverId, available: false }, {});
}
