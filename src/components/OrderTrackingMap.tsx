import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiGet } from '../lib/apiClient';
import { getToken } from '../lib/authStore';

import { Order } from '../types';

(window as any).maplibregl = maplibregl;

export default function OrderTrackingMap({ order }: { order: Order }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    let active = true;
    let map: any = null;

    const initMap = async () => {
      try {
        const { key } = await apiGet('/api/config/maps-key');
        if (!active || !mapContainerRef.current) return;
        
        map = new maplibregl.Map({
             container: mapContainerRef.current!,
             style: 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json',
             center: [77.5946, 12.9716], // Default Bangalore
             zoom: 12,
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

        // Try geolocation to center map
        if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
               (position) => {
                 const { latitude, longitude } = position.coords;
                 if (map && active) {
                   map.flyTo({ center: [longitude, latitude], zoom: 13 });
                   
                   // Customer location
                   new maplibregl.Marker({ color: '#10b981' })
                     .setLngLat([longitude, latitude])
                     .addTo(map);
                     
                   // Actual restaurant location
                   new maplibregl.Marker({ color: '#f59e0b' })
                     .setLngLat([rLng, rLat])
                     .addTo(map);
                 }
               },
               () => {
                 if (map && active) {
                    new maplibregl.Marker({ color: '#f59e0b' }).setLngLat([rLng, rLat]).addTo(map);
                    new maplibregl.Marker({ color: '#10b981' }).setLngLat([77.61, 12.96]).addTo(map);
                 }
               },
               { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
             );
        } else {
             new maplibregl.Marker({ color: '#f59e0b' }).setLngLat([rLng, rLat]).addTo(map);
             new maplibregl.Marker({ color: '#10b981' }).setLngLat([77.61, 12.96]).addTo(map);
        }

      } catch (e) {
         console.error('Map init failed', e);
      }
    };
    
    initMap();
    
    // Set up SSE for live tracking
    let eventSource: EventSource | null = null;
    let riderMarker: maplibregl.Marker | null = null;
    try {
        const token = getToken();
        const tokenParam = token ? `&token=${token}` : '';
        eventSource = new EventSource(`${(import.meta as any).env.VITE_API_BASE_URL || ''}/api/v1/tracking/stream?orderId=${order.id}${tokenParam}`);
        eventSource.onmessage = (event) => {
            if (!active || !map) return;
            try {
                const data = JSON.parse(event.data);
                if (data.lat && data.lng) {
                    if (!riderMarker) {
                        const el = document.createElement('div');
                        el.className = 'w-6 h-6 bg-indigo-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center';
                        el.innerHTML = '<div class="w-2 h-2 bg-white rounded-full"></div>';
                        riderMarker = new maplibregl.Marker({ element: el })
                            .setLngLat([data.lng, data.lat])
                            .addTo(map);
                    } else {
                        riderMarker.setLngLat([data.lng, data.lat]);
                    }
                }
            } catch (e) {
                console.warn('Error parsing SSE data', e);
            }
        };
    } catch (e) {
        console.warn('Could not connect to SSE stream', e);
    }
    
    return () => {
      active = false;
      if (map) map.remove();
      if (eventSource) eventSource.close();
    };
  }, [order.id, order.restaurantId]);

  return <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />;
}
