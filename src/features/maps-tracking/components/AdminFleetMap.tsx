import { Button, createMapPin, createMapPopupContent, Select, Surface } from '@shared/ui';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { customerApi, deliveryApi, restaurantApi } from "@/lib/zodiosClients";
import { formatTime } from '@shared/time';
import { MapPanel } from './MapPanel';
import { maplibre, type MapInstance } from '../model/maplibre';
import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { z } from 'zod';
import { NearbyRestaurantDTO } from '@/api/generated/schemas/restaurant/restaurant_outlet_controller';
import { DriverLocationDTO } from '@/api/generated/schemas/delivery/admin_delivery_controller';
import { CustomerAddressDto } from '@/api/generated/schemas/customer/common';

type Restaurant = z.infer<typeof NearbyRestaurantDTO>;
type Rider = z.infer<typeof DriverLocationDTO>;
type CustomerAddress = z.infer<typeof CustomerAddressDto>;


const FLEET_REFRESH_INTERVAL_MS = 30_000;

type CoordinateCarrier = {
  lat?: number | null;
  lng?: number | null;
};

function hasUsableCoordinates<T extends CoordinateCarrier>(location: T): location is T & { lat: number; lng: number } {
  return typeof location.lat === 'number'
    && typeof location.lng === 'number'
    && Number.isFinite(location.lat)
    && Number.isFinite(location.lng)
    && location.lat !== 0
    && location.lng !== 0;
}

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
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [refreshError, setRefreshError] = useState<string | null>(null);
 const [lastUpdated, setLastUpdated] = useState<number | null>(null);
 const [refreshVersion, setRefreshVersion] = useState(0);
 const [cityScopeVersion, setCityScopeVersion] = useState(0);
 const [fleetCities, setFleetCities] = useState<string[]>([]);
 const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
 const markersRef = useRef<Array<{ remove: () => void }>>([]);
 const fittedMapRef = useRef<MapInstance | null>(null);
 const hasFittedBoundsRef = useRef(false);
 const locatedRiderCount = riders.filter(hasUsableCoordinates).length;

 useEffect(() => {
 let active = true;

 const loadFleetCities = async () => {
 setIsRefreshing(true);
 try {
 const cities = await deliveryApi.adminDelivery.get(
 '/api/v1/internal/admin/delivery/fleet-cities',
 {},
 );
 if (!active) return;
 const canonicalCities = Array.isArray(cities)
 ? cities.filter((city): city is string => typeof city === 'string' && city.trim().length > 0)
 : [];
 if (canonicalCities.length === 0) {
 throw new Error('No fleet cities are configured');
 }
 setFleetCities(canonicalCities);
 setSelectedCityId(current => current && canonicalCities.includes(current)
 ? current
 : canonicalCities[0]);
 setRefreshError(null);
 setRefreshVersion(version => version + 1);
 } catch (err: unknown) {
 if (active) {
 console.error('Failed to load fleet city scope', err);
 setFleetCities([]);
 setSelectedCityId(null);
 setRefreshError('Could not load fleet city scope. Try again.');
 setIsRefreshing(false);
 }
 }
 };

 void loadFleetCities();
 return () => { active = false; };
 }, [cityScopeVersion]);

 useEffect(() => {
 if (!selectedCityId) return;
 let active = true;
 let inFlight = false;

 const fetchData = async () => {
 if (inFlight) return;
 inFlight = true;
 setIsRefreshing(true);
 try {
 const [resOutlets, resDrivers, resCustomers] = await Promise.allSettled([
 (restaurantApi.restaurantOutlet.get('/api/v1/internal/admin/restaurants/all-with-location', { queries: { cityId: selectedCityId } })),
 (deliveryApi.adminDelivery.get('/api/v1/internal/admin/delivery/drivers/all-with-location', { queries: { cityId: selectedCityId } })),
 (customerApi.adminCustomer.get('/api/v1/internal/admin/customers/addresses', { queries: { cityId: selectedCityId } }))
 ]);

 if (!active) return;

 let hasFailure = false;
 let hasFreshData = false;
 if (resOutlets.status === 'fulfilled') {
 setRestaurants(resOutlets.value?.data?.content ?? []);
 hasFreshData = true;
 } else {
 hasFailure = true;
 }
 if (resDrivers.status === 'fulfilled') {
 setRiders(resDrivers.value?.content ?? []);
 hasFreshData = true;
 } else {
 hasFailure = true;
 }
 if (resCustomers.status === 'fulfilled') {
 setCustomers(resCustomers.value?.data?.content ?? []);
 hasFreshData = true;
 } else {
 hasFailure = true;
 }

 setRefreshError(hasFailure
 ? 'Some fleet data could not be refreshed. Showing the latest available data.'
 : null);
 if (hasFreshData) setLastUpdated(Date.now());
 } catch (err: unknown) {
 if (active) {
 console.error("Failed to fetch map data", err);
 setRefreshError('Could not refresh fleet data. Try again.');
 }
 } finally {
 inFlight = false;
 if (active) setIsRefreshing(false);
 }
 };

 void fetchData();
 const refreshTimer = window.setInterval(() => { void fetchData(); }, FLEET_REFRESH_INTERVAL_MS);

 return () => {
 active = false;
 window.clearInterval(refreshTimer);
 // Clear stale markers when the city scope changes so the next effect starts fresh.
 setRestaurants([]);
 setRiders([]);
 setCustomers([]);
 hasFittedBoundsRef.current = false;
 };
 }, [refreshVersion, selectedCityId]);

 // The markers are re-placed whenever the fleet data changes; the map itself is built once,
 // by MapPanel, and handed over through onReady.
 useEffect(() => {
 const map = mapInstance;
 if (!map) return;

 if (fittedMapRef.current !== map) {
 fittedMapRef.current = map;
 hasFittedBoundsRef.current = false;
 }

 let active = true;
 const clearMarkers = () => {
 markersRef.current.forEach(marker => marker.remove());
 markersRef.current = [];
 };

 const renderMarkers = () => {
 if (!active) return;
 clearMarkers();

 const bounds = new maplibre.LngLatBounds();
 let hasPoints = false;

 // Add Restaurants (Rose)
 restaurants.forEach(r => {
 if (hasUsableCoordinates(r)) {
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

 const marker = new maplibre.Marker({ element: el })
 .setLngLat([r.lng, r.lat])
 .setPopup(new maplibre.Popup({ offset: 25 }).setDOMContent(createMapPopupContent([
 { label: 'Restaurant:', value: r.name || 'Unknown' },
 { label: 'Status:', value: r.isActive ? 'Active' : 'Inactive' },
 ])))
 .addTo(map!);
 markersRef.current.push(marker);
 }
 });

 // Add Riders (Indigo)
 riders.forEach(r => {
 if (hasUsableCoordinates(r)) {
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

 const marker = new maplibre.Marker({ element: el })
 .setLngLat([r.lng, r.lat])
 .setPopup(new maplibre.Popup({ offset: 25 }).setDOMContent(createMapPopupContent([
 { label: 'Rider:', value: r.fullName || 'Unknown' },
 { label: 'Status:', value: r.status },
 ])))
 .addTo(map!);
 markersRef.current.push(marker);
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

 const marker = new maplibre.Marker({ element: el })
 .setLngLat([c.longitude, c.latitude])
 .setPopup(new maplibre.Popup({ offset: 25 }).setDOMContent(createMapPopupContent([
 { label: 'Customer:', value: c.label || 'Home' },
 { value: c.addressLine1 || 'Address unavailable' },
 ])))
 .addTo(map!);
 markersRef.current.push(marker);
 }
 });

 if (hasPoints && !hasFittedBoundsRef.current) {
 map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
 hasFittedBoundsRef.current = true;
 }
 };

 if (map.loaded()) {
 renderMarkers();
 } else {
 map.once('load', renderMarkers);
 }

 return () => {
 active = false;
 map.off('load', renderMarkers);
 clearMarkers();
 };
 }, [mapInstance, restaurants, riders, customers]);

 return (
 <Surface radius="md" elevation={1} className="w-full h-full min-h-[500px] flex flex-col overflow-hidden relative">
 <Surface radius="md" elevation={2} className="absolute top-4 left-4 z-10 px-4 py-3 pointer-events-auto">
 <div className="mb-2 flex items-center justify-between gap-3">
 <h3 className="font-bold text-sm text-slate-800 dark:text-white">Fleet Map Legend</h3>
 <Button
 variant="secondary"
 size="sm"
 loading={isRefreshing}
 aria-label="Refresh fleet map"
 icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
 onClick={() => setCityScopeVersion(version => version + 1)}
 >
 Refresh
 </Button>
 </div>
 <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
 <span>Fleet city</span>
 <Select
 aria-label="Fleet city"
 value={selectedCityId ?? ''}
 disabled={fleetCities.length === 0}
 onChange={setSelectedCityId}
 options={fleetCities.map(cityId => ({ value: cityId, label: cityId }))}
 selectSize="sm"
 placeholder="Select city"
 />
 </div>
 <div className="flex flex-col gap-2 text-xs">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-rose-600"></div>
 <span className="text-slate-600 dark:text-slate-300">Restaurants ({restaurants.length})</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-blue-600"></div>
 <span className="text-slate-600 dark:text-slate-300">Riders ({riders.length})</span>
 </div>
 {locatedRiderCount === 0 && (
 <p data-testid="fleet-riders-empty" className="text-slate-500 dark:text-slate-400">
 No riders are currently sharing a usable location.
 </p>
 )}
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
 <span className="text-slate-600 dark:text-slate-300">Customers ({customers.length})</span>
 </div>
 </div>
 {lastUpdated && (
 <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400" role="status">
 Updated at {formatTime(lastUpdated)}
 </p>
 )}
 {refreshError && (
 <p className="mt-2 max-w-56 text-[10px] leading-snug text-rose-700 dark:text-rose-300" role="alert">
 {refreshError}
 </p>
 )}
 </Surface>
 <MapPanel
 label="Live fleet map"
 center={[77.670900, 12.990300]}
 zoom={11}
 navigation
 onReady={setMapInstance}
 className="w-full flex-1 min-h-[500px]"
 />
 {toastMsg && (
 <Surface radius="full" elevation={2} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white px-4 py-2 font-medium text-sm duration-300">
 {toastMsg}
 </Surface>
 )}
 </Surface>
 );
}
