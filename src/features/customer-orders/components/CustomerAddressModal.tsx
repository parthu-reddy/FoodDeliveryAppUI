import { Surface } from '@shared/ui';
import { useConfig } from "@/contexts/ConfigContext";
import { useToast } from "@/contexts/ToastContext";
import { customerApi } from "@/lib/zodiosClients";
import { Button, Spinner } from '@shared/ui';
import { MapPin, Navigation, X } from 'lucide-react';
import { MapPanel } from '@features/maps-tracking/components/MapPanel';
import { fetchPlaceLocation, usePlaceAutocomplete } from '@features/maps-tracking/model/usePlaceAutocomplete';
import { AddressFormFields } from '@features/customer-orders/components/AddressFormFields';
import { PlaceSearchField } from '@features/maps-tracking/components/PlaceSearchField';
import { addressSchema, parseIndianAddress } from '@features/customer-orders/model/addressParts';
import { requestCurrentPosition, reverseGeocode } from '@features/maps-tracking/model/currentLocation';
import { maplibre, type MapInstance } from '@features/maps-tracking/model/maplibre';
import { useRef, useState } from 'react';

interface SavedAddress {
 id: string;
 label: string;
 addressLine1: string;
 addressLine2?: string;
 city: string;
 latitude: string;
 longitude: string;
}

interface CustomerAddressModalProps {
 isAddressModalOpen: boolean;
 setIsAddressModalOpen: (val: boolean) => void;
 addressSearchQuery: string;
 setAddressSearchQuery: (val: string) => void;
 address?: string;
 setAddress?: (val: string) => void;
 savedAddresses?: SavedAddress[];
 onAddApiLog?: (log: unknown) => void;
 customerId?: string;
 onSelectDeliveryLocation?: (address: string, lat: string | number, lng: string | number) => void;
 initialLat?: number | string;
 initialLng?: number | string;
 onAddressAdded?: () => void;
}

export default function CustomerAddressModal({
 isAddressModalOpen,
 setIsAddressModalOpen,
 addressSearchQuery,
 setAddressSearchQuery,
 setAddress,
 savedAddresses = [],
 customerId,
 onSelectDeliveryLocation,
 initialLat,
 initialLng,
 onAddressAdded
}: CustomerAddressModalProps) {
 const mapRef = useRef<MapInstance | null>(null);
 const markerRef = useRef<maplibre.Marker | null>(null);
 const [lat, setLat] = useState(initialLat ? String(initialLat) : '12.9716');
 const [lng, setLng] = useState(initialLng ? String(initialLng) : '77.5946');


 const [addressForm, setAddressForm] = useState({
 label: '',
 addressLine1: '',
 addressLine2: '',
 city: '',
 state: '',
 zipCode: ''
 });
 const [isSaving, setIsSaving] = useState(false);
 const { showError } = useToast();
 useConfig();
 const { results: searchResults, isSearching, setResults: setSearchResults, setIsSearching } =
   usePlaceAutocomplete(addressSearchQuery);



 const handleSearch = (query: string) => {
 setAddressSearchQuery(query);
 };

 const handleSelectPlace = async (placeId: string, description: string) => {
 try {
 const location = await fetchPlaceLocation(placeId);
 if (location) {
 setLat(location.lat.toString());
 setLng(location.lng.toString());
 
 setAddressForm(prev => ({ ...prev, ...parseIndianAddress(description) }));
 
 if (mapRef.current) {
 mapRef.current.flyTo({ center: [location.lng, location.lat], zoom: 15 });
 }
 if (markerRef.current) {
 markerRef.current.setLngLat([location.lng, location.lat]);
 }
 setSearchResults([]);
 setAddressSearchQuery(description);
 }
 } catch (err: unknown) {
 console.error(err);
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
 if (description) {
 setAddressSearchQuery(description);
 setAddressForm(prev => ({ ...prev, ...parseIndianAddress(description) }));
 }
 } catch (e: unknown) {
 console.error("Current location failed", e);
 showError(e instanceof Error ? e.message : "Could not get your current location.");
 } finally {
 setIsSearching(false);
 }
 };

 const handleSave = async () => {
 try {
 const payload = {
 ...addressForm,
 latitude: parseFloat(lat),
 longitude: parseFloat(lng)
 };

 const validation = addressSchema.safeParse(payload);
 if (!validation.success) {
 showError(validation.error.issues[0].message);
 return;
 }

 setIsSaving(true);
 if (!customerId) throw new Error("Customer ID missing");
 const addrRes = await customerApi.customerAddress.post('/api/v1/customers/:customerId/addresses', payload, { params: { customerId } });
 const savedAddr = addrRes.data;
 setIsAddressModalOpen(false);
 onAddressAdded?.();
 
 if (onSelectDeliveryLocation && savedAddr) {
 const formatted = `${savedAddr.label || 'Address'}: ${savedAddr.addressLine1 || ''}, ${savedAddr.city || ''}`;
 onSelectDeliveryLocation(formatted, savedAddr.latitude, savedAddr.longitude);
 }
 } catch (err: unknown) {
 console.error(err);
 showError(err instanceof Error ? err.message : "Failed to save address");
 } finally {
 setIsSaving(false);
 }
 };

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


 return (
 <>
 {/* ------------------- ADDRESS MODAL ------------------- */}
 {isAddressModalOpen && (
 <Surface variant="glass-chrome" radius="xl" elevation={1} className="p-5 flex flex-col space-y-4">
 <div className="flex justify-between items-center shrink-0 mb-4">
 <div>
 <h4 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Delivery Location</h4>
 <p className="text-xs text-slate-500 dark:text-slate-300">Set your precise location for faster delivery</p>
 </div>
 <button
 onClick={() => setIsAddressModalOpen(false)}
 className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex flex-col space-y-4">
 {/* Search Bar */}
            <PlaceSearchField
              value={addressSearchQuery}
              onChange={handleSearch}
              results={searchResults}
              isSearching={isSearching}
              onSelect={handleSelectPlace}
              onUseCurrentLocation={handleUseCurrentLocation}
            />

 {/* Maplibre Map */}
 <MapPanel
 label="Delivery location"
 center={[parseFloat(lng), parseFloat(lat)]}
 zoom={12}
 minZoom={10}
 maxZoom={17}
 interactive={false}
 navigation
 onReady={attachMap}
 className="w-full h-48 rounded-2xl overflow-hidden shrink-0 border border-rose-500/20 dark:border-rose-500/30"
 >
 <Surface variant="glass-chrome" radius="full" elevation={1} className="absolute bottom-3 inset-x-0 mx-auto w-fit backdrop-blur text-xs font-bold px-3 py-1.5 text-slate-700 dark:text-[#f0ede6] z-10 pointer-events-none">
 Drag pin to move
 </Surface>
 </MapPanel>
 {/* Saved Addresses */}
 {savedAddresses && savedAddresses.length > 0 && (
 <div className="space-y-2">
 <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Saved Addresses</label>
 <div className="flex flex-col gap-2">
 {savedAddresses.map((addr) => (
 <button
 key={addr.id}
 onClick={() => {
 const addrStr = `${addr.label}: ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}`;
 if (onSelectDeliveryLocation) {
 onSelectDeliveryLocation(addrStr, addr.latitude, addr.longitude);
 } else {
 // @ts-expect-error auto-migration type suppression
 setAddress(addrStr);
 setIsAddressModalOpen(false);
 }
 }}
 className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 transition-colors text-left"
 >
 <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
 <MapPin className="w-4 h-4 text-slate-500" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">{addr.label}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{addr.addressLine1}, {addr.city}</p>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Current Address Details */}
 <AddressFormFields addressForm={addressForm} setAddressForm={setAddressForm} />

 <div className="flex flex-col gap-2 mt-auto">
 <Button
 onClick={handleSave}
 disabled={isSaving || !addressForm.label || !addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.zipCode}
 variant="warning"
 fullWidth
 icon={isSaving ? <Spinner size="sm" className="text-white" /> : undefined}
 >
 Save Address
 </Button>

 {onSelectDeliveryLocation && (
 <Button 
 onClick={() => {
 const addrStr = `Current Location: ${addressSearchQuery || 'Selected on Map'}`;
 onSelectDeliveryLocation(addrStr, lat, lng);
 }}
 variant="outline"
 fullWidth
 icon={<Navigation className="w-4 h-4" />}
 >
 Deliver to this location (Temporary)
 </Button>
 )}
 </div>
 </div>
 </Surface>
 )}
 </>
 );
}
