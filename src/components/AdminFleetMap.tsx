import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiGet } from '../lib/apiClient';

interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isActive: boolean;
}

interface Rider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
}

interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  addressLine1: string;
  latitude: number;
  longitude: number;
}

export default function AdminFleetMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [customers, setCustomers] = useState<CustomerAddress[]>([]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [resOutlets, resDrivers, resCustomers] = await Promise.all([
          apiGet('/api/v1/internal/admin/restaurants/all-with-location'),
          apiGet('/api/v1/internal/admin/delivery/drivers/all-with-location'),
          apiGet('/api/v1/internal/admin/customers/addresses')
        ]);

        if (!active) return;

        const outData = resOutlets?.data || resOutlets;
        if (Array.isArray(outData)) {
            setRestaurants(outData);
        }
        
        const driverData = resDrivers?.data || resDrivers;
        if (Array.isArray(driverData)) {
            setRiders(driverData);
        }
        
        const customerData = resCustomers?.data || resCustomers;
        if (Array.isArray(customerData)) {
            setCustomers(customerData);
        }
      } catch (err) {
        console.error("Failed to fetch map data", err);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Initialize map if not exists
    let map = mapInstance;
    if (!map) {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [77.670900, 12.990300], // Default center
        zoom: 11
      });
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      setMapInstance(map);
    }

    // Wait for map to load before doing anything else
    const renderMarkers = () => {
      // Clear existing markers
      const existingMarkers = document.querySelectorAll('.fleet-marker');
      existingMarkers.forEach(m => m.remove());

      const bounds = new maplibregl.LngLatBounds();
      let hasPoints = false;

      // Add Restaurants (Rose)
      restaurants.forEach(r => {
        if (r.lat && r.lng && r.lat !== 0 && r.lng !== 0) {
          hasPoints = true;
          bounds.extend([r.lng, r.lat]);

          const el = document.createElement('div');
          el.className = 'fleet-marker w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white shadow-rose-600/50 hover:scale-110 transition-transform cursor-pointer';
          el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>';
          
          new maplibregl.Marker(el)
            .setLngLat([r.lng, r.lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>Restaurant:</strong> ${r.name}<br>Status: ${r.isActive ? 'Active' : 'Inactive'}`))
            .addTo(map!);
        }
      });

      // Add Riders (Indigo)
      riders.forEach(r => {
        if (r.lat && r.lng && r.lat !== 0 && r.lng !== 0) {
          hasPoints = true;
          bounds.extend([r.lng, r.lat]);
          
          const isOnline = r.status === 'ONLINE';
          const bgClass = isOnline ? 'bg-indigo-600' : 'bg-slate-400';
          const shadowClass = isOnline ? 'shadow-indigo-600/50' : 'shadow-slate-400/50';

          const el = document.createElement('div');
          el.className = `fleet-marker w-8 h-8 ${bgClass} rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white ${shadowClass} hover:scale-110 transition-transform cursor-pointer`;
          el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>';
          
          new maplibregl.Marker(el)
            .setLngLat([r.lng, r.lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>Rider:</strong> ${r.name}<br>Status: ${r.status}`))
            .addTo(map!);
        }
      });

      // Add Customers (Emerald)
      customers.forEach(c => {
        if (c.latitude && c.longitude && c.latitude !== 0 && c.longitude !== 0) {
          hasPoints = true;
          bounds.extend([c.longitude, c.latitude]);
          
          const el = document.createElement('div');
          el.className = 'fleet-marker w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white shadow-emerald-500/50 hover:scale-110 transition-transform cursor-pointer';
          el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
          
          new maplibregl.Marker(el)
            .setLngLat([c.longitude, c.latitude])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>Customer:</strong> ${c.label || 'Home'}<br>${c.addressLine1}`))
            .addTo(map!);
        }
      });

      if (hasPoints) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    };

    if (map.loaded()) {
      renderMarkers();
    } else {
      map.on('load', renderMarkers);
    }

  }, [mapInstance, restaurants, riders, customers]);

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative">
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 pointer-events-auto">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Fleet Map Legend</h3>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-600"></div>
            <span className="text-slate-600 dark:text-slate-300">Restaurants ({restaurants.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <span className="text-slate-600 dark:text-slate-300">Riders ({riders.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600 dark:text-slate-300">Customers ({customers.length})</span>
          </div>
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
