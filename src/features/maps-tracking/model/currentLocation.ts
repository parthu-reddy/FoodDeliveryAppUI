import { mapsApi } from '@/lib/zodiosClients';

/**
 * "Use my current location", as the two address screens need it.
 *
 * Both wrapped `navigator.geolocation.getCurrentPosition` in the same callback pyramid with
 * the same options and the same two error paths. A promise is the same thing without the
 * nesting, and it lets the caller `await` the reverse geocode in line with everything else it
 * does with the coordinates.
 */

const OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };

export function requestCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      (error) => reject(new Error(error.message || 'Could not get your current location.')),
      OPTIONS,
    );
  });
}

/** The postal address behind a point, or null when the lookup gives nothing back. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const res = await mapsApi.integration.get('/api/places/reverse-geocode', { queries: { lat, lng } });
  return res?.address ? String(res.address) : null;
}
