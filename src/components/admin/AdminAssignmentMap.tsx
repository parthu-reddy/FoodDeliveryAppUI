import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiGet } from '../../lib/apiClient';

import { ErrorBoundary } from '../shared/ErrorBoundary';

export default function AdminAssignmentMap(props: { 
    order: any, 
    availableDrivers: any[], 
    onAssign: (orderId: string, driverId: string) => void 
}) {
  return (
    <ErrorBoundary>
      <_AdminAssignmentMap {...props} />
    </ErrorBoundary>
  );
}

function _AdminAssignmentMap({ 
    order, 
    availableDrivers, 
    onAssign 
}: { 
    order: any, 
    availableDrivers: any[], 
    onAssign: (orderId: string, driverId: string) => void 
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    let active = true;
    let map: any = null;

    const createRestaurantMarker = () => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white shadow-rose-600/50';
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>';
      return el;
    };
    
    const createDriverMarker = (driverName: string) => {
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center group relative';
      el.innerHTML = `
        <div class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 mb-2 flex flex-col items-center gap-1 min-w-[100px] pointer-events-auto">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">${driverName || 'Driver'}</span>
            <button class="assign-btn w-full py-1 px-2 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-700 dark:text-indigo-300 hover:text-white dark:hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-indigo-500/30">
                Assign
            </button>
        </div>
        <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white shadow-indigo-600/50 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
        </div>
      `;
      return el;
    };

    const initMap = async () => {
      try {
        let key = (import.meta as any).env.VITE_OLA_MAPS_API_KEY;
        if (!key) {
            const res = await apiGet('/api/config/maps-key');
            key = res?.data?.key || res?.key;
        }
        if (!active || !mapContainerRef.current) return;
        
        map = new maplibregl.Map({
             container: mapContainerRef.current!,
             style: 'https://api.olamaps.io/styleEditor/v1/styleEdit/styles/53575843-c000-4b22-ac12-5818a67991bd/LowCost',
             center: [77.5946, 12.9716], // Default Bangalore
             zoom: 12,
             minZoom: 10,
             maxZoom: 17,
             transformRequest: (url, resourceType) => {
                 if (url.includes('api.olamaps.io')) {
                     return { url: `${url}${url.includes('?') ? '&' : '?'}api_key=${key}` };
                 }
                 return { url };
             }
        });
        
        let rLat = 12.98;
        let rLng = 77.58;
        try {
            const res = await apiGet(`/api/v1/restaurants/${order.restaurantId}`);
            if (res?.data?.lat) rLat = res.data.lat;
            if (res?.data?.lng) rLng = res.data.lng;
        } catch (err) {
            console.warn('Could not fetch restaurant location, using defaults', err);
        }

        setMapInstance(map);

        if (map && active) {
            const bounds = new maplibregl.LngLatBounds();
            bounds.extend([rLng, rLat]);

            new maplibregl.Marker({ element: createRestaurantMarker() })
                .setLngLat([rLng, rLat])
                .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>${order.restaurantName}</strong><br/>Restaurant`))
                .addTo(map);

            availableDrivers.forEach(driver => {
                if (driver.lat && driver.lng) {
                    bounds.extend([driver.lng, driver.lat]);
                    
                    const markerEl = createDriverMarker(driver.fullName);
                    
                    // Bind the assign button inside the marker element
                    const assignBtn = markerEl.querySelector('.assign-btn');
                    if (assignBtn) {
                        assignBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            onAssign(order.id, driver.id);
                        });
                    }

                    const marker = new maplibregl.Marker({ element: markerEl })
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

      } catch (e) {
         console.error('Map init failed', e);
      }
    };
    
    initMap();
    
    return () => {
      active = false;
      if (map) map.remove();
    };
  }, [order.id, order.restaurantId, availableDrivers]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
