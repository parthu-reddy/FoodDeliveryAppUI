import { Surface } from '@shared/ui';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/contexts/ToastContext';
import { restaurantApi } from '@/lib/zodiosClients';
import ImageUploadField from "@features/kyc/components/ImageUploadField";
import { Button, FormField, Input, Spinner } from '@shared/ui';
import { AlertCircle, CheckCircle, MapPin, Plus, Store } from 'lucide-react';
import { MapPanel } from '@features/maps-tracking/components/MapPanel';
import { maplibre, type MapInstance } from '@features/maps-tracking/model/maplibre';
import { fetchPlaceLocation, usePlaceAutocomplete } from '@features/maps-tracking/model/usePlaceAutocomplete';
import { requestCurrentPosition, reverseGeocode } from '@features/maps-tracking/model/currentLocation';
import { CoordinateFields } from '@features/maps-tracking/components/CoordinateFields';
import { PlaceSearchField } from '@features/maps-tracking/components/PlaceSearchField';
import { OutletTimingsField } from '@features/catalog/components/restaurant/OutletTimingsField';
import { DEFAULT_TIMING, outletSchema, type OutletTiming } from '@features/catalog/model/outletTimings';
import React, { useRef, useState } from 'react';

interface OutletRegistrationProps {
 onRefresh: () => void;
 brandId: string;
}

export default function OutletRegistration({ onRefresh, brandId }: OutletRegistrationProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [name, setName] = useState('');
 const [fssai, setFssai] = useState('');
 const [banner, setBanner] = useState('');
 
 const [lat, setLat] = useState("12.9716");
 const [lng, setLng] = useState("77.5946");
 const [timings, setTimings] = useState<OutletTiming[]>([{ ...DEFAULT_TIMING }]);
 const [error, setError] = useState('');
 const [isSaving, setIsSaving] = useState(false);

 // Map state
 const mapRef = useRef<MapInstance | null>(null);
 const markerRef = useRef<maplibre.Marker | null>(null);
 
 const [searchQuery, setSearchQuery] = useState('');
 const { showError } = useToast();
 useConfig();
 const { results: searchResults, isSearching, setResults: setSearchResults, setIsSearching } =
   usePlaceAutocomplete(searchQuery, 300);

 const attachMap = (map: MapInstance) => {
 mapRef.current = map;
 const marker = new maplibre.Marker({ draggable: true, color: '#f97316' })
 .setLngLat([parseFloat(lng), parseFloat(lat)])
 .addTo(map);
 marker.on('dragend', () => {
 const lngLat = marker.getLngLat();
 setLng(lngLat.lng.toFixed(6));
 setLat(lngLat.lat.toFixed(6));
 });
 markerRef.current = marker;
 return () => {
 marker.remove();
 mapRef.current = null;
 markerRef.current = null;
 };
 };




 const handleSearch = (query: string) => {
 setSearchQuery(query);
 };

 const selectLocation = async (placeId: string, description: string) => {
 setSearchQuery(description);
 setSearchResults([]);
 const location = await fetchPlaceLocation(placeId);
 if (location) {
 setLat(location.lat.toFixed(6));
 setLng(location.lng.toFixed(6));
 mapRef.current?.flyTo({ center: [location.lng, location.lat], zoom: 15 });
 markerRef.current?.setLngLat([location.lng, location.lat]);
 }
 };

 const handleUseCurrentLocation = async () => {
 setIsSearching(true);
 try {
 const { latitude, longitude } = await requestCurrentPosition();
 setLat(latitude.toString());
 setLng(longitude.toString());
 mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15 });
 markerRef.current?.setLngLat([longitude, latitude]);

 const description = await reverseGeocode(latitude, longitude);
 if (description) setSearchQuery(description);
 } catch (e: unknown) {
 console.error("Current location failed", e);
 showError(e instanceof Error ? e.message : "Could not get your current location.");
 } finally {
 setIsSearching(false);
 }
 };

 const handleRegister = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');

 const parsedLat = parseFloat(lat);
 const parsedLng = parseFloat(lng);
 
 const validation = outletSchema.safeParse({
 name,
 fssai,
 banner,
 lat: parsedLat,
 lng: parsedLng
 });

 if (!validation.success) {
 setError(validation.error.issues[0].message);
 return;
 }

 const newOutlet = {
 name,
 fssaiLicenseNumber: fssai,
 lat: parsedLat,
 lng: parsedLng,
 timings: timings.map(t => ({
 openingTime: t.openingTime + ":00",
 closingTime: t.closingTime + ":00"
 })),
 bannerUrl: banner,
 createdAt: new Date().toISOString()
 };

 try {
 setIsSaving(true);
 await restaurantApi.restaurantOutlet.post('/api/v1/brands/:brandId/outlets', newOutlet, { params: { brandId } });
 setIsOpen(false);
 setName('');
 setFssai('');
 setLat("12.9716");
 setLng("77.5946");
 setTimings([{ openingTime: "09:00", closingTime: "23:00" }]);
 onRefresh();
 } catch (err: unknown) {
 const axiosErr = err as { response?: { data?: { message?: string, error?: string } }, message?: string };
 setError(axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message || 'Failed to register outlet');
 } finally {
 setIsSaving(false);
 }
 };


 if (!isOpen) {
 return (
 <Button
 onClick={() => setIsOpen(true)}
 variant="outline"
 fullWidth
 className="!p-4 border-dashed border-2 !border-rose-500/30 hover:!border-amber-500/50 hover:!bg-amber-50/50 dark:hover:!bg-amber-950/20 !text-slate-500 hover:!text-amber-500"
 >
 <Plus className="w-5 h-5" />
 <span className="font-bold text-sm">Register New Outlet</span>
 </Button>
 );
 }

 return (
 <Surface radius="xl" elevation={1} className="p-5">
 <div className="flex items-center gap-2 text-amber-500 mb-4">
 <Store className="w-5 h-5" />
 <h4 className="font-extrabold text-sm tracking-tight uppercase">New Outlet Registration</h4>
 </div>
 <form onSubmit={handleRegister} className="space-y-4">
 <FormField label="Outlet Name" required>
 <Input
 type="text"
 required
 value={name}
 onChange={e => setName(e.target.value)}
 placeholder="e.g. Bella Italia (Downtown)"
 />
 </FormField>
 
 <div className="grid grid-cols-2 gap-3">
 <FormField label="FSSAI License" required>
 <Input
 type="text"
 required
 value={fssai}
 onChange={e => setFssai(e.target.value)}
 placeholder="14-digit FSSAI number"
 />
 </FormField>
 <FormField label="Banner Image URL">
 <ImageUploadField 
 value={banner} 
 onChange={setBanner} 
 folderId={brandId} 
 placeholder="Banner Image URL" 
 />
 </FormField>
 </div>

 <div className="space-y-3 pt-2">
 <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase flex items-center gap-1">
 <MapPin className="w-3 h-3" />
 Location Coordinates
 </label>
      <PlaceSearchField
        value={searchQuery}
        onChange={handleSearch}
        results={searchResults}
        isSearching={isSearching}
        onSelect={selectLocation}
        onUseCurrentLocation={handleUseCurrentLocation}
        placeholder="Search for an address or landmark..."
      />
 
 <MapPanel
 label="Outlet location"
 center={[parseFloat(lng), parseFloat(lat)]}
 zoom={12}
 minZoom={10}
 maxZoom={17}
 interactive={false}
 navigation
 onReady={attachMap}
 className="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 z-0"
 />

      <CoordinateFields
        lat={lat}
        lng={lng}
        onChange={({ lat: nextLat, lng: nextLng }) => {
          setLat(nextLat);
          setLng(nextLng);
          const parsedLat = parseFloat(nextLat);
          const parsedLng = parseFloat(nextLng);
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            markerRef.current?.setLngLat([parsedLng, parsedLat]);
            mapRef.current?.setCenter([parsedLng, parsedLat]);
          }
        }}
      />
 </div>

 <OutletTimingsField timings={timings} setTimings={setTimings} />

 {error && (
 <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span className="font-bold">{error}</span>
 </div>
 )}

 <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
 <Button
 type="button"
 variant="outline"
 className="flex-1"
 onClick={() => setIsOpen(false)}
 >
 Cancel
 </Button>
 <Button
 type="submit"
 disabled={isSaving}
 variant="primary"
 className="flex-1 !bg-gradient-to-r from-amber-500 to-rose-500"
 >
 {isSaving ? <Spinner size="xs" /> : <CheckCircle className="w-4 h-4" />}
 {isSaving ? 'Registering...' : 'Register Outlet'}
 </Button>
 </div>
 </form>
 </Surface>
 );
}
