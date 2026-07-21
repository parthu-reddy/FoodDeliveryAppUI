import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { apiGet } from '../lib/apiClient';
import { getToken } from '../lib/tokenStore';

import { Order } from '../types';

(window as any).maplibregl = maplibregl;

export default function OrderTrackingMap({ order, enableLiveTracking = false }: { order: Order; enableLiveTracking?: boolean }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    let active = true;
    let map: any = null;

    const createHomeMarker = (lat: number, lng: number) => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white shadow-blue-600/50 cursor-pointer pointer-events-auto hover:scale-110 transition-transform';
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
      el.onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
      return el;
    };

    const createRiderMarker = () => {
      const el = document.createElement('div');
      el.className = 'w-10 h-10 bg-indigo-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center shadow-indigo-500/50 cursor-pointer pointer-events-auto hover:scale-110 transition-transform';
      // Bike icon
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 5.5h5l-4-5h-3L8 12M5.5 17.5 8 12M18.5 17.5 15 11.5"/></svg>';
      return el;
    };

    const createRestaurantMarker = (lat: number, lng: number) => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white shadow-rose-600/50 cursor-pointer pointer-events-auto hover:scale-110 transition-transform';
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>';
      el.onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
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
        
        // Set customer location to order delivery coordinates (if available) or fallback
        const cLat = order.deliveryLat || 12.96;
        const cLng = order.deliveryLng || 77.61;

        map = new maplibregl.Map({
             container: mapContainerRef.current!,
             style: 'https://api.olamaps.io/styleEditor/v1/styleEdit/styles/53575843-c000-4b22-ac12-5818a67991bd/LowCost',
             center: [cLng, cLat], // Center on delivery location initially
             zoom: 12,
             minZoom: 10, // Prevent zooming out too far
             maxZoom: 17, // Prevent over-zooming to reduce tile fetch
             interactive: false, // Block user interaction with the map itself
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

        // cLat and cLng computed above

        const addMarkers = (riderLat: number | null, riderLng: number | null) => {
          if (!map || !active) return;
          
          if (riderLat !== null && riderLng !== null) {
            map.flyTo({ center: [riderLng, riderLat], zoom: 13 });
            new maplibregl.Marker({ element: createRiderMarker() })
              .setLngLat([riderLng, riderLat])
              .addTo(map);
          }

          // Customer delivery location
          const homePopup = new maplibregl.Popup({ offset: 25, closeButton: false, closeOnClick: false })
            .setHTML('<div class="text-xs font-semibold text-center cursor-pointer text-blue-600">Customer<br/><span class="text-gray-500 font-normal">Click for Google Maps</span></div>');
            
          const homeMarker = new maplibregl.Marker({ element: createHomeMarker(cLat, cLng) })
            .setLngLat([cLng, cLat])
            .setPopup(homePopup)
            .addTo(map);
            
          // Add click to popup as well
          homePopup.on('open', () => {
             const content = homePopup.getElement();
             if (content) content.onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${cLat},${cLng}`, '_blank');
          });
          homeMarker.togglePopup();

          // Actual restaurant location
          const restPopup = new maplibregl.Popup({ offset: 25, closeButton: false, closeOnClick: false })
            .setHTML('<div class="text-xs font-semibold text-center cursor-pointer text-rose-600">Restaurant<br/><span class="text-gray-500 font-normal">Click for Google Maps</span></div>');

          const restMarker = new maplibregl.Marker({ element: createRestaurantMarker(rLat, rLng) })
            .setLngLat([rLng, rLat])
            .setPopup(restPopup)
            .addTo(map);
            
          restPopup.on('open', () => {
             const content = restPopup.getElement();
             if (content) content.onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${rLat},${rLng}`, '_blank');
          });
          restMarker.togglePopup();
        };

        // Try geolocation to center map if we want to show rider's current location too
        if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
               (position) => {
                 const { latitude, longitude } = position.coords;
                 if (order.deliveryExecutiveId || order.status === 'DISPATCHED') {
                   addMarkers(latitude, longitude);
                 } else {
                   addMarkers(null, null);
                 }
               },
               () => {
                 // Fallback if location fails
                 addMarkers(null, null);
               },
               { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
             );
        } else {
             // Fallback if geolocation unavailable
             addMarkers(null, null);
        }

      } catch (e) {
         console.error('Map init failed', e);
      }
    };
    
    initMap();
    
    // Set up SSE for live tracking ONLY if enabled
    let riderMarker: maplibregl.Marker | null = null;
    const ctrl = new AbortController();
    
    if (enableLiveTracking) {
        try {
            const token = getToken();
            fetchEventSource(`${(import.meta as any).env.VITE_API_BASE_URL || ''}/api/v1/orders/${order.id}/live-tracking`, {
                method: 'GET',
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {},
                signal: ctrl.signal,
                onmessage(event) {
                    if (!active || !map) return;
                    try {
                        const data = JSON.parse(event.data);
                        if (data.lat && data.lng) {
                            if (!riderMarker) {
                                riderMarker = new maplibregl.Marker({ element: createRiderMarker() })
                                    .setLngLat([data.lng, data.lat])
                                    .addTo(map);
                            } else {
                                riderMarker.setLngLat([data.lng, data.lat]);
                            }
                        }
                    } catch (e) {
                        console.warn('Error parsing SSE data', e);
                    }
                },
                onerror(err) {
                    console.warn('Could not connect to SSE stream', err);
                }
            });
        } catch (e) {
            console.warn('Could not connect to SSE stream', e);
        }
    }
    
    return () => {
      active = false;
      if (map) map.remove();
      ctrl.abort();
    };
  }, [order.id, order.restaurantId]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Global CSS to disable canvas interaction but enable marker interaction */}
      <style>
        {`
          .maplibregl-canvas { pointer-events: none !important; }
          .maplibregl-marker { pointer-events: auto !important; }
          .maplibregl-popup { pointer-events: auto !important; }
        `}
      </style>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
