import { createMapPin, Surface } from '@shared/ui';
import { customerApi, deliveryApi, restaurantApi } from "@/lib/zodiosClients";
import { MapPanel } from './MapPanel';
import { maplibre, type MapInstance } from '../model/maplibre';
import { useEffect, useState } from 'react';

import { z } from 'zod';
import { NearbyRestaurantDTO } from '@/api/generated/schemas/restaurant/restaurant_outlet_controller';
import { DriverLocationDTO } from '@/api/generated/schemas/delivery/admin_delivery_controller';
import { CustomerAddressDto } from '@/api/generated/schemas/customer/common';

type Restaurant = z.infer<typeof NearbyRestaurantDTO>;
type Rider = z.infer<typeof DriverLocationDTO>;
type CustomerAddress = z.infer<typeof CustomerAddressDto>;

import { ErrorBoundary } from "@shared/ui";

export default function AdminFleetMap() {
 return (
 <ErrorBoundary>
 <AdminFleetMapInner />
 </ErrorBoundary>
 );
}

function AdminFleetMapInner() {
 const [mapInstance, setMapInstance] = useState<MapInstance | null>(null);

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
 (deliveryApi.adminDelivery.get('/api/v1/internal/admin/delivery/drivers/all-with-location', { queries: { pageable: {}, cityId: 'BLR' } })),
 (customerApi.adminCustomer.get('/api/v1/internal/admin/customers/addresses', { queries: { pageable: {} } }))
 ]);

 if (!active) return;

 // Since the Zodios schema correctly types the ApiResponse wrapper,
 // we can safely access the nested data and fallback to an empty array.
 setRestaurants(resOutlets?.data?.content ?? []);
 setRiders(resDrivers?.content ?? []);
 setCustomers(resCustomers?.data?.content ?? []);
 } catch (err: unknown) {
 console.error("Failed to fetch map data", err);
 }
 };

 fetchData();

 return () => {
 active = false;
 };
 }, []);

 // The markers are re-placed whenever the fleet data changes; the map itself is built once,
 // by MapPanel, and handed over through onReady.
 useEffect(() => {
 const map = mapInstance;
 if (!map) return;

 const renderMarkers = () => {
 // Clear existing markers
 const existingMarkers = document.querySelectorAll('.fleet-marker');
 existingMarkers.forEach(m => m.remove());

 const bounds = new maplibre.LngLatBounds();
 let hasPoints = false;

 // Add Restaurants (Rose)
 restaurants.forEach(r => {
 if (r.lat && r.lng && r.lat !== 0 && r.lng !== 0) {
 hasPoints = true;
 bounds.extend([r.lng, r.lat]);

 const el = createMapPin({
   tone: 'restaurant',
   className: 'fleet-marker cursor-pointer pointer-events-auto',
   icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>',
 });



 el.onclick = () => {
 navigator.clipboard.writeText(r.id || '').then(() => {
 setToastMsg(`Copied Restaurant ID: ${r.id}`);
 setTimeout(() => setToastMsg(null), 3000);
 }).catch(err => console.error("Failed to copy:", err));
 };

 new maplibre.Marker({ element: el })
 .setLngLat([r.lng, r.lat])
 .setPopup(new maplibre.Popup({ offset: 25 }).setHTML(`<strong>Restaurant:</strong> ${r.name}<br>Status: ${r.isActive ? 'Active' : 'Inactive'}`))
 .addTo(map!);
 }
 });

 // Add Riders (Indigo)
 riders.forEach(r => {
 if (r.lat && r.lng && r.lat !== 0 && r.lng !== 0) {
 hasPoints = true;
 bounds.extend([r.lng, r.lat]);

 const isOnline = r.status === 'ONLINE';

 const el = createMapPin({
   tone: isOnline ? 'rider' : 'rider-offline',
   size: 40,
   className: 'fleet-marker cursor-pointer pointer-events-auto',
   icon: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 5.5h5l-4-5h-3L8 12M5.5 17.5 8 12M18.5 17.5 15 11.5"/></svg>',
 });

 if (r.phoneNumber) {
 el.title = `Phone: ${r.phoneNumber}`;
 }

 el.onclick = () => {
 navigator.clipboard.writeText(r.id || '').then(() => {
 setToastMsg(`Copied Rider ID: ${r.id}`);
 setTimeout(() => setToastMsg(null), 3000);
 }).catch(err => console.error("Failed to copy:", err));
 };

 new maplibre.Marker({ element: el })
 .setLngLat([r.lng, r.lat])
 .setPopup(new maplibre.Popup({ offset: 25 }).setHTML(`<strong>Rider:</strong> ${r.fullName || 'Unknown'}<br>Status: ${r.status}`))
 .addTo(map!);
 }
 });

 // Add Customers (Blue)
 customers.forEach(c => {
 if (c.latitude && c.longitude && c.latitude !== 0 && c.longitude !== 0) {
 hasPoints = true;
 bounds.extend([c.longitude, c.latitude]);

 const el = createMapPin({
   tone: 'customer',
   className: 'fleet-marker cursor-pointer pointer-events-auto',
   icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
 });



 el.onclick = () => {
 navigator.clipboard.writeText(c.id || '').then(() => {
 setToastMsg(`Copied Customer Address ID: ${c.id}`);
 setTimeout(() => setToastMsg(null), 3000);
 }).catch(err => console.error("Failed to copy:", err));
 };

 new maplibre.Marker({ element: el })
 .setLngLat([c.longitude, c.latitude])
 .setPopup(new maplibre.Popup({ offset: 25 }).setHTML(`<strong>Customer:</strong> ${c.label || 'Home'}<br>${c.addressLine1}`))
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
 <Surface radius="md" elevation={1} className="w-full h-full min-h-[500px] flex flex-col overflow-hidden relative">
 <Surface radius="md" elevation={2} className="absolute top-4 left-4 z-10 px-4 py-3 pointer-events-auto">
 <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Fleet Map Legend</h3>
 <div className="flex flex-col gap-2 text-xs">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-rose-600"></div>
 <span className="text-slate-600 dark:text-slate-300">Restaurants ({restaurants.length})</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-blue-600"></div>
 <span className="text-slate-600 dark:text-slate-300">Riders ({riders.length})</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
 <span className="text-slate-600 dark:text-slate-300">Customers ({customers.length})</span>
 </div>
 </div>
 </Surface>
 <MapPanel
 label="Live fleet map"
 center={[77.670900, 12.990300]}
 zoom={11}
 navigation
 onReady={setMapInstance}
 className="w-full h-full"
 />
 {toastMsg && (
 <Surface radius="full" elevation={2} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white px-4 py-2 font-medium text-sm duration-300">
 {toastMsg}
 </Surface>
 )}
 </Surface>
 );
}
