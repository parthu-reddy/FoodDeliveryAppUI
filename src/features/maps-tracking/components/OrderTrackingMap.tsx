import { getToken } from "@/lib/tokenStore";
import { restaurantApi } from "@/lib/zodiosClients";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { createRiderMarker } from '@features/maps-tracking/model/orderTrackingMarkers';
import { knownPoint, missingPointsNote, routeEnds, type LatLng } from '@features/maps-tracking/model/mapPoints';
import { drawRoute, placePins } from '@features/maps-tracking/model/placeOrderMap';
import { createSmoothMover } from '@features/maps-tracking/model/smoothPosition';
import { prefersReducedMotion } from '@shared/ui';
import { MapPanel } from './MapPanel';
import { LiveStreamBadge, type LiveStreamState } from './LiveStreamBadge';
import { maplibre, type MapInstance } from '../model/maplibre';
import { useState } from 'react';

import { Order } from "@/types";
import { useConfig } from "@/contexts/ConfigContext";
import { ErrorBoundary } from "@shared/ui/ErrorBoundary";

/**
 * A 4xx from the live stream is not going to fix itself. onopen threw on one before too, but
 * onerror swallowed it and returned a backoff, so a "fatal" stream retried forever.
 */
class FatalStreamError extends Error {}

interface OrderTrackingMapProps {
  order: Order;
  /** Subscribe to the rider's live position stream (the customer's view). */
  enableLiveTracking?: boolean;
  /** The device is the rider's: its own GPS is the rider's position. Never true for a customer. */
  viewerIsRider?: boolean;
}

export default function OrderTrackingMap(props: OrderTrackingMapProps) {
  return (
    <ErrorBoundary>
      <OrderTrackingMapInner {...props} />
    </ErrorBoundary>
  );
}

function OrderTrackingMapInner({ order, enableLiveTracking = false, viewerIsRider = false }: OrderTrackingMapProps) {
  useConfig();
  const [, setMapInstance] = useState<MapInstance | null>(null);
  const [liveState, setLiveState] = useState<LiveStreamState>('connecting');
  const [missingNote, setMissingNote] = useState<string | null>(null);
  const initialCentre = knownPoint(order.deliveryLat, order.deliveryLng);

  const attachMap = (map: MapInstance) => {
    let active = true;


    // Only points the data actually has. A missing one is not drawn -- it used to be
    // replaced by a fixed Bengaluru coordinate and drawn, with a route, as if it were real.
    const placeEverything = async () => {
      try {
        const customer = knownPoint(order.deliveryLat, order.deliveryLng);
        let restaurant: LatLng | null = null;
        try {
          const res = await restaurantApi.restaurantOutlet.get('/api/v1/restaurants/:id', { params: { id: order.restaurantId } });
          restaurant = knownPoint(res?.data?.lat, res?.data?.lng);
        } catch (err: unknown) {
          console.warn('Could not fetch restaurant location', err);
        }
        if (!active) return;
        setMapInstance(map);
        setMissingNote(missingPointsNote(restaurant, customer));

        const place = (rider: LatLng | null) => {
          if (!active) return;
          placePins(map, { restaurant, customer, rider });
          const ends = routeEnds({ rider, restaurant, customer, deliveryStatus: order.deliveryStatus });
          if (ends) void drawRoute(map, ends[0], ends[1]);
        };

        // The device's own position is the RIDER only on the rider's screen. On the customer's
        // tracker it is the customer, and it used to be drawn as the rider -- at the customer's
        // own door, with a route from there -- after asking the customer for location access.
        if (viewerIsRider && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => place({ lat: position.coords.latitude, lng: position.coords.longitude }),
            () => place(null),
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
          );
        } else {
          place(null);
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
              if (active) setLiveState('live');
            } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
              if (active) setLiveState('unavailable');
              throw new FatalStreamError(`Live tracking stream refused: ${res.status}`);
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
            if (err instanceof FatalStreamError) throw err;
            console.warn('Could not connect to SSE stream', err);
            retryCount++;
            if (active) setLiveState('reconnecting');
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
      // Only the initial camera, never a pin: a map needs somewhere to start. Placement fits
      // the camera to the real points once it has them.
      center={initialCentre ? [initialCentre.lng, initialCentre.lat] : [77.61, 12.96]}
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
      {enableLiveTracking && <LiveStreamBadge state={liveState} />}
      {missingNote && (
        <span role="status" className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{ background: 'var(--color-paper)', color: 'var(--color-ink-2)', border: '1px solid var(--color-paper-line)' }}>
          {missingNote}
        </span>
      )}
    </MapPanel>
  );
}
