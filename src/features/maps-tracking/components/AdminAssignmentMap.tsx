import { useConfig } from "@/contexts/ConfigContext";
import { restaurantApi } from "@/lib/zodiosClients";
import { readRestaurantCoordinates } from '@features/admin-ops/model/dispatchScope';
import { createMapCallout, createMapPin, createMapPopupContent } from "@shared/ui";
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { MapPanel } from './MapPanel';
import { maplibre, type MapInstance } from '../model/maplibre';
import { useState } from 'react';

interface Driver {
    id: string;
    fullName?: string;
    lat?: number;
    lng?: number;
}

interface Order {
    id: string;
    restaurantId: string;
    restaurantName?: string;
}

interface AdminAssignmentMapProps {
    order: Order;
    availableDrivers: Driver[];
}

export default function AdminAssignmentMap(props: AdminAssignmentMapProps) {
  return (
    <ErrorBoundary>
      <AdminAssignmentMapInner {...props} />
    </ErrorBoundary>
  );
}

function AdminAssignmentMapInner({ 
    order, 
    availableDrivers,
}: AdminAssignmentMapProps) {
  useConfig();
  const [restaurantLocationError, setRestaurantLocationError] = useState<string | null>(null);


  const attachMap = (map: MapInstance) => {
    let active = true;

    const createRestaurantMarker = () => {
      return createMapPin({
        tone: 'restaurant',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>',
      });
    };
    
    const createDriverMarker = (driverName: string | undefined) => {
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center group relative';
      const driverNameElement = document.createElement('span');
      driverNameElement.className = 'text-xs font-bold whitespace-nowrap';
      driverNameElement.textContent = driverName || 'Driver';
      el.appendChild(createMapCallout([driverNameElement]));
      el.appendChild(createMapPin({
        tone: 'rider',
        className: 'cursor-pointer',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
      }));
      return el;
    };

    const placeMarkers = async () => {
      try {
        let restaurantCoordinates: { lat: number; lng: number } | null = null;
        try {
            const res = await restaurantApi.restaurantOutlet.get('/api/v1/restaurants/:id', { params: { id: order.restaurantId } });
            restaurantCoordinates = readRestaurantCoordinates(res);
            if (!restaurantCoordinates) throw new Error('Restaurant location is unavailable');
        } catch (err: unknown) {
            console.warn('Could not fetch restaurant location', err);
            if (active) {
              setRestaurantLocationError('Restaurant location is unavailable. Nearby driver markers are unavailable until it is corrected.');
            }
            return;
        }

        if (!active) return;
        setRestaurantLocationError(null);
        const { lat: rLat, lng: rLng } = restaurantCoordinates;

        if (map && active) {
            const bounds = new maplibre.LngLatBounds();
            bounds.extend([rLng, rLat]);

            new maplibre.Marker({ element: createRestaurantMarker() })
                .setLngLat([rLng, rLat])
                .setPopup(new maplibre.Popup({ offset: 25 }).setDOMContent(createMapPopupContent([
                  { value: order.restaurantName || 'Restaurant', strong: true },
                  { value: 'Restaurant' },
                ])))
                .addTo(map);

            availableDrivers.forEach(driver => {
                if (driver.lat && driver.lng) {
                    bounds.extend([driver.lng, driver.lat]);
                    
                    const markerEl = createDriverMarker(driver.fullName ?? 'Driver');
                    
                    new maplibre.Marker({ element: markerEl })
                        .setLngLat([driver.lng, driver.lat])
                        .addTo(map);

                }
            });

            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
            } else {
                map.flyTo({ center: [rLng, rLat], zoom: 13 });
            }
        }

      } catch (e: unknown) {
         console.error('Map init failed', e);
      }
    };
    
    placeMarkers();

    // The markers go with the map, which MapPanel removes; this only stops the in-flight
    // restaurant lookup writing to a map that is already gone.
    return () => { active = false; };
  };

  return (
    <div className="relative h-full w-full">
      <MapPanel
        label={`Drivers available for order ${order.id}`}
        center={[77.5946, 12.9716]}
        zoom={12}
        minZoom={10}
        maxZoom={17}
        onReady={attachMap}
        className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      />
      {restaurantLocationError && (
        <p role="alert" className="absolute left-4 top-4 z-10 max-w-sm rounded-lg bg-rose-50 p-3 text-sm text-rose-800 shadow dark:bg-rose-950/80 dark:text-rose-200">
          {restaurantLocationError}
        </p>
      )}
    </div>
  );
}
