import { Button, Surface } from '@shared/ui';
import { getToken } from "@/lib/tokenStore";
import { customerApi, mapsApi } from "@/lib/zodiosClients";
import { AutocompleteResponse } from '@/api/generated/schemas/maps/common';
import { MapPin, Search, X } from 'lucide-react';
import { MapPanel } from '@features/maps-tracking/components/MapPanel';
import type { MapInstance } from '@features/maps-tracking/model/maplibre';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import { useEffect, useState } from 'react';
import { AddressDetailsForm } from '@features/customer-orders/components/AddressDetailsForm';
import { addressSchema, parseIndianAddress } from '@features/customer-orders/model/addressParts';
import { z } from 'zod';

type AutocompleteSuggestion = z.infer<typeof AutocompleteResponse>;


interface SavedAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  latitude: number | string;
  longitude: number | string;
}

interface CustomerAddressPageProps {
  setView: (view: string) => void;
  addressSearchQuery: string;
  setAddressSearchQuery: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  onAddApiLog?: (log: unknown) => void;
  savedAddresses?: SavedAddress[];
  setSavedAddresses?: (updater: (prev: SavedAddress[]) => SavedAddress[]) => void;
  userId?: string;
}

export default function CustomerAddressPage({
  setView,
  addressSearchQuery,
  setAddressSearchQuery,
  address,
  setAddress,
  onAddApiLog = () => {},
  
  setSavedAddresses,
  userId
}: CustomerAddressPageProps) {
  const [mapInstance, setMapInstance] = useState<MapInstance | null>(null);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [, setIsSearching] = useState(false);

  const [label, setLabel] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState('');


  const attachMap = (map: MapInstance) => {
    let active = true;
    setMapInstance(map);
    if (onAddApiLog) {
      onAddApiLog({ id: 'fetch_maps_key', label: 'GET /api/config/maps-key', method: 'GET' });
    }

    map.on('moveend', async () => {
      try {
        const center = map.getCenter();
        if (onAddApiLog) {
          onAddApiLog({ id: 'reverse_geocode', label: `GET /api/places/reverse-geocode?lat=${center.lat.toFixed(4)}&lng=${center.lng.toFixed(4)}`, method: 'GET' });
        }
        const res = await mapsApi.integration.get('/api/places/reverse-geocode', { queries: { lat: center.lat, lng: center.lng } });
        if (!active || !res.address) return;
        setAddress(res.address);
        const parsed = parseIndianAddress(res.address as string);
        if (parsed.zipCode) setZipCode(parsed.zipCode);
        if (parsed.state) setState(parsed.state);
        if (parsed.city) setCity(parsed.city);
      } catch (e: unknown) {
        console.error(e);
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (active) map.flyTo({ center: [longitude, latitude], zoom: 16 });
        },
        (error) => { console.error('Geolocation error:', error); },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    }

    return () => { active = false; };
  };


  useEffect(() => {
    if (!addressSearchQuery || addressSearchQuery.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
       try {
         setIsSearching(true);
         if (onAddApiLog) {
            onAddApiLog({ id: 'autocomplete', label: `GET /api/places/autocomplete?input=${encodeURIComponent(addressSearchQuery)}`, method: 'GET' });
         }
         const res = await mapsApi.integration.autocomplete({ queries: { input: addressSearchQuery } });
         setSuggestions(res ?? []);
       } catch (e: unknown) {
         console.error(e);
       } finally {
         setIsSearching(false);
       }
    }, 500);
     
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressSearchQuery]);

  const handleSuggestionClick = async (suggestion: AutocompleteSuggestion) => {
      setAddressSearchQuery(suggestion.description ?? '');
      setSuggestions([]);
      const token = getToken();
      let loc = null;
      // The passthrough schema may include geometry from server response
      const geo = (suggestion as Record<string, unknown>).geometry as { location?: { lat: number; lng: number } } | undefined;
      if (geo?.location) {
          loc = geo.location;
      } else {
          try {
              if (onAddApiLog) onAddApiLog({ id: 'geocode', label: `GET /api/places/geocode?address=${encodeURIComponent(suggestion.description ?? '')}`, method: 'GET' });
              const rawRes = await window.fetch(`/api/places/geocode?address=${encodeURIComponent(suggestion.description ?? '')}`, { headers: { Authorization: `Bearer ${token}`, 'X-Calling-Service': 'CustomerApplication' } });
              if (!rawRes.ok) throw new Error('API Error');
              const res = await rawRes.json();
              if (res && res.lat && res.lng) {
                  loc = res;
              }
          } catch (e: unknown) {
              console.error(e);
          }
      }

      if (loc && mapInstance) {
         mapInstance.flyTo({ center: [loc.lng, loc.lat], zoom: 16 });
         setAddress(suggestion.description ?? '');
         // the fourth copy of this parse, inlined; it is one call now
         const parsed = parseIndianAddress(suggestion.description);
         if (parsed.zipCode) setZipCode(parsed.zipCode);
         if (parsed.state) setState(parsed.state);
         if (parsed.city) setCity(parsed.city);
      }
  };

  const presets = useMotionPresets();
  return (
    <motion.div {...presets.fade}
      className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent"
    >
      <div className="flex items-center gap-3 shrink-0 mb-4">
        <Button variant="secondary" size="icon" aria-label="Close" onClick={() => setView('settings')}>
          <X className="w-5 h-5" />
        </Button>
        <div>
          <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Delivery Location</h4>
          <p className="text-xs text-slate-500 dark:text-slate-300">Set your precise location for faster delivery</p>
        </div>
      </div>
      {error && (
        <div className="bg-rose-100 border border-rose-400 text-rose-700 px-4 py-3 rounded relative mb-2 text-sm" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search for area, street name..."
              value={addressSearchQuery}
              onChange={e => setAddressSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
            {suggestions.length > 0 && (
              <Surface radius="md" elevation={2} className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto z-10">
                {suggestions.map((s, idx) => (
                  <button type="button" 
                    key={idx} 
                    onClick={() => handleSuggestionClick(s)}
                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-700 text-left w-full"
                  >
                    <p className="text-sm text-slate-800 dark:text-[#f0ede6] truncate">{s.description}</p>
                  </button>
                ))}
              </Surface>
            )}
          </div>

          {/* Map Container */}
          <MapPanel
            label="Pick your delivery location"
            center={[77.5946, 12.9716]}
            minZoom={10}
            maxZoom={17}
            interactive={false}
            onReady={attachMap}
            className="w-full h-[300px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shrink-0"
          >
            {/* Fixed Center Pin */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center mb-5">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>
          </MapPanel>

          {/* Current Address Details */}
          <AddressDetailsForm
            label={label}
            setLabel={setLabel}
            address={address}
            setAddress={setAddress}
            city={city}
            setCity={setCity}
            state={state}
            setState={setState}
            zipCode={zipCode}
            setZipCode={setZipCode}
            onEdit={() => setError('')}
          />
            
             <div className="pt-4">
               <button
                 onClick={async () => {
                   const payload = {
                     label: label || 'New Address',
                     addressLine1: address,
                     city: city,
                     state: state,
                     zipCode: zipCode,
                     latitude: mapInstance ? mapInstance.getCenter().lat : 12.9716,
                     longitude: mapInstance ? mapInstance.getCenter().lng : 77.5946
                   };

                   const validation = addressSchema.safeParse(payload);
                   if (!validation.success) {
                     setError(validation.error.issues[0].message);
                     return;
                   }

                   if (setSavedAddresses && userId) {
                     try {
                       const res = await customerApi.customerAddress.post('/api/v1/customers/:customerId/addresses', payload, { params: { customerId: userId } });
                       const data = res?.data || res;
                       if (data && data.id) {
                         setSavedAddresses((prev) => [...prev, data as SavedAddress]);
                       }
                     } catch (e: unknown) {
                        console.error("Failed to save address", e);
                     }
                   }
                   setView('settings');
                 }}
                 className="w-full py-3.5 bg-rose-500 text-white rounded-xl font-bold active:scale-95 transition"
               >
                 Confirm Location
               </button>
             </div>
             
        </div>
      </div>
    </motion.div>
  );
}

