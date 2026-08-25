import { customerApi, deliveryApi, restaurantApi } from "@/lib/zodiosClients";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';

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

import { ErrorBoundary } from "@shared/ui";

export default function AdminFleetMap() {
  return (
    <ErrorBoundary>
      <AdminFleetMapInner />
    </ErrorBoundary>
  );
}

function AdminFleetMapInner() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [customers, setCustomers] = useState<CustomerAddress[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [resOutlets, resDrivers, resCustomers] = await Promise.all([
          (restaurantApi.restaurantOutlet.get('/api/v1/internal/admin/restaurants/all-with-location', {})),
          // @ts-expect-error auto-migration type suppression
          (deliveryApi.adminDelivery.get('/api/v1/internal/admin/delivery/drivers/all-with-location', { queries: { pageable: {} } })),
          (customerApi.adminCustomer.get('/api/v1/internal/admin/customers/addresses', { queries: { pageable: {} } }))
        ]);

        if (!active) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractList = (data: any) => {
          if (!data) return [];
          if (Array.isArray(data)) return data;
          if (Array.isArray(data.data)) return data.data;
          if (data.data?.content && Array.isArray(data.data.content)) return data.data.content;
          if (data.content && Array.isArray(data.content)) return data.content;
          return [];
        };

        setRestaurants(extractList(resOutlets));
        setRiders(extractList(resDrivers));
        setCustomers(extractList(resCustomers));
      } catch (err: unknown) {
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
          el.className = 'fleet-marker w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white shadow-red-600/50 cursor-pointer pointer-events-auto';
          el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>';

          const restaurantUnknown = r as unknown as { phone?: string, phoneNumber?: string };
          if (restaurantUnknown.phone || restaurantUnknown.phoneNumber) {
            el.title = `Phone: ${restaurantUnknown.phone || restaurantUnknown.phoneNumber}`;
          }

          el.onclick = () => {
            navigator.clipboard.writeText(r.id).then(() => {
              setToastMsg(`Copied Restaurant ID: ${r.id}`);
              setTimeout(() => setToastMsg(null), 3000);
            }).catch(err => console.error("Failed to copy:", err));
          };

          new maplibregl.Marker({ element: el })
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
          const bgClass = isOnline ? 'bg-blue-600' : 'bg-slate-400';
          const shadowClass = isOnline ? 'shadow-blue-500/50' : 'shadow-slate-400/50';

          const el = document.createElement('div');
          el.className = `fleet-marker w-10 h-10 ${bgClass} rounded-full border-2 border-white shadow-xl flex items-center justify-center ${shadowClass} cursor-pointer pointer-events-auto`;
          el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 5.5h5l-4-5h-3L8 12M5.5 17.5 8 12M18.5 17.5 15 11.5"/></svg>';

          const riderUnknown = r as unknown as { phone?: string, phoneNumber?: string };
          if (riderUnknown.phone || riderUnknown.phoneNumber) {
            el.title = `Phone: ${riderUnknown.phone || riderUnknown.phoneNumber}`;
          }

          el.onclick = () => {
            navigator.clipboard.writeText(r.id).then(() => {
              setToastMsg(`Copied Rider ID: ${r.id}`);
              setTimeout(() => setToastMsg(null), 3000);
            }).catch(err => console.error("Failed to copy:", err));
          };

          new maplibregl.Marker({ element: el })
            .setLngLat([r.lng, r.lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>Rider:</strong> ${r.name}<br>Status: ${r.status}`))
            .addTo(map!);
        }
      });

      // Add Customers (Blue)
      customers.forEach(c => {
        if (c.latitude && c.longitude && c.latitude !== 0 && c.longitude !== 0) {
          hasPoints = true;
          bounds.extend([c.longitude, c.latitude]);

          const el = document.createElement('div');
          el.className = 'fleet-marker w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white shadow-orange-500/50 cursor-pointer pointer-events-auto';
          el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';

          const customerUnknown = c as unknown as { phone?: string, phoneNumber?: string };
          if (customerUnknown.phone || customerUnknown.phoneNumber) {
            el.title = `Phone: ${customerUnknown.phone || customerUnknown.phoneNumber}`;
          }

          el.onclick = () => {
            navigator.clipboard.writeText(c.id).then(() => {
              setToastMsg(`Copied Customer Address ID: ${c.id}`);
              setTimeout(() => setToastMsg(null), 3000);
            }).catch(err => console.error("Failed to copy:", err));
          };

          new maplibregl.Marker({ element: el })
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
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-slate-600 dark:text-slate-300">Restaurants ({restaurants.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-slate-600 dark:text-slate-300">Riders ({riders.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-600 dark:text-slate-300">Customers ({customers.length})</span>
          </div>
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full h-full" />
      {toastMsg && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
