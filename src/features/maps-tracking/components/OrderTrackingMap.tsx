import { useToast } from "@/contexts/ToastContext";
import { getToken } from "@/lib/tokenStore";
import { deliveryApi, restaurantApi } from "@/lib/zodiosClients";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { createHomeMarker, createRestaurantMarker, createRiderMarker } from '@features/maps-tracking/model/orderTrackingMarkers';
import { createSmoothMover } from '@features/maps-tracking/model/smoothPosition';
import { prefersReducedMotion } from '@shared/ui';
import { MapPanel } from './MapPanel';
import { maplibre, type MapInstance } from '../model/maplibre';
import { useState } from 'react';

import { decodePolyline } from "@/lib/polyline";
import { Order, OrderStatus } from "@/types";


import { useConfig } from "@/contexts/ConfigContext";

import { ErrorBoundary } from "@shared/ui/ErrorBoundary";

export default function OrderTrackingMap(props: { order: Order; enableLiveTracking?: boolean }) {
  return (
    <ErrorBoundary>
      <OrderTrackingMapInner {...props} />
    </ErrorBoundary>
  );
}

function OrderTrackingMapInner({ order, enableLiveTracking = false }: { order: Order; enableLiveTracking?: boolean }) {
  useConfig();
  const [, setMapInstance] = useState<MapInstance | null>(null);
  const { showError } = useToast();

  const attachMap = (map: MapInstance) => {
    let active = true;


    const placeEverything = async () => {
      try {
        // Set customer location to order delivery coordinates (if available) or fallback
        const cLat = order.deliveryLat || 12.96;
        const cLng = order.deliveryLng || 77.61;

        let rLat = 12.98;
        let rLng = 77.58;
        try {
          const res = await restaurantApi.restaurantOutlet.get('/api/v1/restaurants/:id', { params: { id: order.restaurantId } });
          const geo = res;
          if ((geo?.data)?.lat) rLat = Number((geo.data).lat);
          if ((geo?.data)?.lng) rLng = Number((geo.data).lng);
        } catch (err: unknown) {
          console.warn('Could not fetch restaurant location, using defaults', err);
        }

        setMapInstance(map);

        // cLat and cLng computed above

        const addMarkers = (riderLat: number | null, riderLng: number | null) => {
          if (!map || !active) return;

          if (riderLat !== null && riderLng !== null) {
            map.flyTo({ center: [riderLng, riderLat], zoom: 13 });
            new maplibre.Marker({ element: createRiderMarker() })
              .setLngLat([riderLng, riderLat])
              .addTo(map);
          }

          // Customer delivery location
          const homePopup = new maplibre.Popup({ offset: 25, closeButton: false, closeOnClick: false })
            .setHTML('<div class="text-xs font-semibold text-center cursor-pointer text-blue-600">Customer<br/><span class="text-slate-500 font-normal">Click for Google Maps</span></div>');

          const homeMarker = new maplibre.Marker({ element: createHomeMarker(cLat, cLng) })
            .setLngLat([cLng, cLat])
            .setPopup(homePopup)
            .addTo(map);

          // Add click to popup as well
          homePopup.on('open', () => {
            const content = homePopup.getElement();
            if (content) {
              content.onclick = () => {
                try {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${cLat},${cLng}`, '_blank');
                } catch (e: unknown) {
                  console.error("Could not open external map navigation", e);
                }
              };
            }
          });
          homeMarker.togglePopup();

          // Actual restaurant location
          const restPopup = new maplibre.Popup({ offset: 25, closeButton: false, closeOnClick: false })
            .setHTML('<div class="text-xs font-semibold text-center cursor-pointer text-rose-600">Restaurant<br/><span class="text-slate-500 font-normal">Click for Google Maps</span></div>');

          const restMarker = new maplibre.Marker({ element: createRestaurantMarker(rLat, rLng) })
            .setLngLat([rLng, rLat])
            .setPopup(restPopup)
            .addTo(map);

          restPopup.on('open', () => {
            const content = restPopup.getElement();
            if (content) {
              content.onclick = () => {
                try {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${rLat},${rLng}`, '_blank');
                } catch (e: unknown) {
                  console.error("Could not open external map navigation", e);
                }
              };
            }
          });
          restMarker.togglePopup();
        };

        const drawRoute = async (sourceLat: number, sourceLng: number, destLat: number, destLng: number) => {
          try {
            const res = await deliveryApi.logistics.get('/api/v1/logistics/route', { queries: { sourceLat, sourceLng, destLat, destLng } });
            const anyRes = res as { polyline?: string };
            if (anyRes?.polyline) {
              const decodedCoords = decodePolyline(anyRes.polyline).map(p => [p.lng, p.lat]);
              if (map && map.isStyleLoaded()) {
                map.addSource('route', {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: decodedCoords
                    }
                  }
                });
                map.addLayer({
                  id: 'route',
                  type: 'line',
                  source: 'route',
                  layout: { 'line-join': 'round', 'line-cap': 'round' },
                  paint: { 'line-color': '#4f46e5', 'line-width': 4 }
                });

                // Fit bounds to show the whole route
                const bounds = decodedCoords.reduce((bounds, coord) => {
                  return bounds.extend(coord as [number, number]);
                }, new maplibre.LngLatBounds(decodedCoords[0] as [number, number], decodedCoords[0] as [number, number]));
                map.fitBounds(bounds, { padding: 40 });
              } else if (map) {
                map.on('style.load', () => drawRoute(sourceLat, sourceLng, destLat, destLng));
              }
            }
          } catch (err: unknown) {
            console.warn('Could not fetch optimized route, relying on static markers', err);
          }
        };

        // Try geolocation to center map if we want to show rider's current location too
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              if (order.deliveryExecutiveId || order.status === OrderStatus.HANDED_OVER) {
                addMarkers(latitude, longitude);

                // Draw route from rider to destination (restaurant or customer depending on status)
                if (order.deliveryStatus === 'ASSIGNED' || !order.deliveryStatus) {
                  drawRoute(latitude, longitude, rLat, rLng);
                } else {
                  drawRoute(latitude, longitude, cLat, cLng);
                }
              } else {
                addMarkers(null, null);
                drawRoute(rLat, rLng, cLat, cLng);
              }
            },
            () => {
              // Fallback if location fails
              addMarkers(null, null);
              drawRoute(rLat, rLng, cLat, cLng);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
        } else {
          // Fallback if geolocation unavailable
          addMarkers(null, null);
          drawRoute(rLat, rLng, cLat, cLng);
        }

      } catch (e: unknown) {
        console.error('Map init failed', e);
      }
    };

    placeEverything();

    // Set up SSE for live tracking ONLY if enabled
    let riderMarker: maplibre.Marker | null = null;
    let riderMover: ReturnType<typeof createSmoothMover> | null = null;
    const ctrl = new AbortController();

    if (enableLiveTracking) {
      let retryCount = 0;
      let lastToastTime = 0;

      try {
        const token = getToken();
        fetchEventSource(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/orders/${order.id}/live-tracking`, {
          method: 'GET',
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {},
          signal: ctrl.signal,
          async onopen(res) {
            if (res.ok && res.status === 200) {
              retryCount = 0;
            } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
              showError('Live tracking unauthorized or unavailable.');
              throw new Error(`Fatal SSE error: ${res.status}`);
            }
          },
          onmessage(event) {
            if (!active || !map) return;
            retryCount = 0;
            try {
              const data = JSON.parse(event.data);
              if (data.lat && data.lng) {
                if (!riderMarker) {
                  riderMarker = new maplibre.Marker({ element: createRiderMarker() })
                    .setLngLat([data.lng, data.lat])
                    .addTo(map);
                }
                // Travel to the fix rather than teleporting to it: the stream delivers a
                // position every few seconds, and setting it straight made the rider hop
                // across the map.
                if (!riderMover) {
                  const marker = riderMarker;
                  riderMover = createSmoothMover(
                    (position) => marker.setLngLat(position),
                    { reduceMotion: prefersReducedMotion() },
                  );
                }
                riderMover.moveTo([data.lng, data.lat]);
              }
            } catch (e: unknown) {
              console.warn('Error parsing SSE data', e);
            }
          },
          onerror(err) {
            console.warn('Could not connect to SSE stream', err);
            retryCount++;
            const now = Date.now();
            if (now - lastToastTime > 15000) {
              showError(`Connection lost. Reconnecting (attempt ${retryCount})...`);
              lastToastTime = now;
            }
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 16000);
            return backoffDelay;
          }
        });
      } catch (e: unknown) {
        console.warn('Could not connect to SSE stream', e);
      }
    }

    // MapPanel removes the map; this stops the live stream and the in-flight lookups that
    // would otherwise still be writing to it.
    return () => {
      active = false;
      ctrl.abort();
      // A hop in flight holds a rAF callback that would fire against a removed marker.
      riderMover?.cancel();
    };
  };

  return (
    <MapPanel
      label="Live order tracking"
      center={[order.deliveryLng || 77.61, order.deliveryLat || 12.96]}
      zoom={12}
      minZoom={10}
      maxZoom={17}
      interactive={false}
      onReady={attachMap}
      className="absolute inset-0 w-full h-full"
    >
      {/* The canvas is inert but the markers are not, so a popup stays clickable on a map
          the customer cannot pan. */}
      <style>
        {`
          .maplibregl-canvas { pointer-events: none !important; }
          .maplibregl-marker { pointer-events: auto !important; }
          .maplibregl-popup { pointer-events: auto !important; }
        `}
      </style>
    </MapPanel>
  );
}
