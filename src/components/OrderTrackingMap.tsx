import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiGet } from '../lib/apiClient';

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
    
    return () => {
      active = false;
      if (map) map.remove();
    };
  }, [order.id, order.restaurantId]);

  return <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />;
}
