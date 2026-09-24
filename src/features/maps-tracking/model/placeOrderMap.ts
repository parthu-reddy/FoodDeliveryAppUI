import { deliveryApi } from '@/lib/zodiosClients';
import { decodePolyline } from '@/lib/polyline';
import { maplibre, type MapInstance } from './maplibre';
import { createHomeMarker, createRestaurantMarker, createRiderMarker } from './orderTrackingMarkers';
import type { LatLng } from './mapPoints';

/**
 * Pins and the route on the order map. Moved out of `OrderTrackingMap`'s `attachMap`, where it
 * sat inside a 170-line closure; nothing here reads component state.
 *
 * Each function draws only what it is given. The caller decides what is known
 * (`model/mapPoints`), so a missing point is simply not drawn -- never replaced by a default.
 */

function labelledPopup(label: string, colourClass: string, at: LatLng) {
  const popup = new maplibre.Popup({ offset: 25, closeButton: false, closeOnClick: false }).setHTML(
    `<div class="text-xs font-semibold text-center cursor-pointer ${colourClass}">${label}<br/>`
    + '<span class="text-slate-500 font-normal">Click for Google Maps</span></div>',
  );
  popup.on('open', () => {
    const content = popup.getElement();
    if (!content) return;
    content.onclick = () => {
      try {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${at.lat},${at.lng}`, '_blank');
      } catch (e: unknown) {
        console.error('Could not open external map navigation', e);
      }
    };
  });
  return popup;
}

export function placePins(
  map: MapInstance,
  { restaurant, customer, rider }: { restaurant: LatLng | null; customer: LatLng | null; rider: LatLng | null },
) {
  if (rider) {
    map.flyTo({ center: [rider.lng, rider.lat], zoom: 13 });
    new maplibre.Marker({ element: createRiderMarker() }).setLngLat([rider.lng, rider.lat]).addTo(map);
  }
  if (customer) {
    new maplibre.Marker({ element: createHomeMarker(customer.lat, customer.lng) })
      .setLngLat([customer.lng, customer.lat])
      .setPopup(labelledPopup('Customer', 'text-blue-600', customer))
      .addTo(map)
      .togglePopup();
  }
  if (restaurant) {
    new maplibre.Marker({ element: createRestaurantMarker(restaurant.lat, restaurant.lng) })
      .setLngLat([restaurant.lng, restaurant.lat])
      .setPopup(labelledPopup('Restaurant', 'text-rose-600', restaurant))
      .addTo(map)
      .togglePopup();
  }
}

export async function drawRoute(map: MapInstance, from: LatLng, to: LatLng): Promise<void> {
  try {
    const res = await deliveryApi.logistics.get('/api/v1/logistics/route', {
      queries: { sourceLat: from.lat, sourceLng: from.lng, destLat: to.lat, destLng: to.lng },
    });
    const polyline = (res as { polyline?: string })?.polyline;
    if (!polyline) return;
    const coords = decodePolyline(polyline).map((p) => [p.lng, p.lat] as [number, number]);
    if (coords.length === 0) return;
    if (!map.isStyleLoaded()) {
      map.on('style.load', () => { void drawRoute(map, from, to); });
      return;
    }
    if (map.getSource('route')) return;
    map.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
    });
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#4f46e5', 'line-width': 4 },
    });
    const bounds = coords.reduce((b, c) => b.extend(c), new maplibre.LngLatBounds(coords[0], coords[0]));
    map.fitBounds(bounds, { padding: 40 });
  } catch (err: unknown) {
    console.warn('Could not fetch optimized route, relying on static markers', err);
  }
}
