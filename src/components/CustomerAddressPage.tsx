import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Search, MapPin, X } from 'lucide-react';
import { apiGet, apiPost } from '../lib/apiClient';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { z } from 'zod';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label cannot exceed 50 characters'),
  addressLine1: z.string().min(1, 'Address Line 1 is required').max(255, 'Address cannot exceed 255 characters'),
  city: z.string().min(1, 'City is required').max(100, 'City cannot exceed 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State cannot exceed 100 characters'),
  zipCode: z.string().min(1, 'ZIP Code is required').max(20, 'ZIP Code cannot exceed 20 characters'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

(window as any).maplibregl = maplibregl;

export default function CustomerAddressPage({
  setView,
  addressSearchQuery,
  setAddressSearchQuery,
  address,
  setAddress,
  onAddApiLog = () => {},
  savedAddresses,
  setSavedAddresses,
  userId
}: any) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [label, setLabel] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState('');
  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
        if (onAddApiLog) {
            onAddApiLog({ id: 'reverse_geocode', label: `GET /api/places/reverse-geocode?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`, method: 'GET' });
        }
        const res = await apiGet(`/api/places/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.address) {
            setAddress(res.address);
        }
    } catch (e) {
        console.error(e);
    }
  };

  useEffect(() => {
    let active = true;
    let map: any = null;

    const initMap = async () => {
      try {
        if (onAddApiLog) {
           onAddApiLog({ id: 'fetch_maps_key', label: 'GET /api/config/maps-key', method: 'GET' });
        }
        const { key } = await apiGet('/api/config/maps-key');
        if (!active || !mapContainerRef.current) return;
        
        map = new maplibregl.Map({
             container: mapContainerRef.current!,
             style: 'https://api.olamaps.io/styleEditor/v1/styleEdit/styles/53575843-c000-4b22-ac12-5818a67991bd/LowCost',
             minZoom: 10,
             maxZoom: 17,
             interactive: false,
             transformRequest: (url, resourceType) => {
                 if (url.includes('api.olamaps.io')) {
                     return {
                         url: `${url}${url.includes('?') ? '&' : '?'}api_key=${key}`
                     };
                 }
                 return { url };
             }
        });
        
        setMapInstance(map);

        map.on('moveend', async () => {
             try {
                const center = map.getCenter();
                if (onAddApiLog) {
                   onAddApiLog({ id: 'reverse_geocode', label: `GET /api/places/reverse-geocode?lat=${center.lat.toFixed(4)}&lng=${center.lng.toFixed(4)}`, method: 'GET' });
                }
                const res = await apiGet(`/api/places/reverse-geocode?lat=${center.lat}&lng=${center.lng}`);
                if (active && res.address) {
                   setAddress(res.address);
                   const parts = res.address.split(',').map((p: string) => p.trim());
                   let zip = '';
                   let state = '';
                   let city = '';
                   let currentIndex = parts.length - 1;
                   if (currentIndex >= 0 && (parts[currentIndex].toLowerCase() === 'india' || parts[currentIndex].toLowerCase() === 'in')) {
                       currentIndex--;
                   }
                   if (currentIndex >= 0) {
                       const zipMatch = parts[currentIndex].match(/(.*?)\s+([\d\s-]{5,10})$/);
                       if (zipMatch) {
                           state = zipMatch[1].trim();
                           zip = zipMatch[2].trim();
                           currentIndex--;
                       } else if (/^[\d\s-]{5,10}$/.test(parts[currentIndex])) {
                           zip = parts[currentIndex];
                           currentIndex--;
                       }
                   }
                   if (currentIndex >= 0 && !state) {
                       state = parts[currentIndex];
                       currentIndex--;
                   }
                   if (currentIndex >= 0) {
                       city = parts[currentIndex];
                   }
                   if (zip) setZipCode(zip);
                   if (state) setState(state);
                   if (city) setCity(city);
                }
              } catch (e) {
                console.error(e);
              }
           });

           // Request geolocation
           if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
               (position) => {
                 const { latitude, longitude } = position.coords;
                 if (map && active) {
                   map.flyTo({ center: [longitude, latitude], zoom: 16 });
                 }
               },
               (error) => {
                 console.error("Geolocation error:", error);
               },
               { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
             );
           }
      } catch (e) {
         console.error('Map init failed', e);
      }
    };
    
    initMap();
    
    return () => {
      active = false;
      if (map) {
         map.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!addressSearchQuery || addressSearchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
       try {
         setIsSearching(true);
         if (onAddApiLog) {
            onAddApiLog({ id: 'autocomplete', label: `GET /api/places/autocomplete?input=${encodeURIComponent(addressSearchQuery)}`, method: 'GET' });
         }
         const res = await apiGet(`/api/places/autocomplete?input=${encodeURIComponent(addressSearchQuery)}`);
         setSuggestions(res || []);
       } catch (e) {
         console.error(e);
       } finally {
         setIsSearching(false);
       }
    }, 500);
    return () => clearTimeout(timer);
  }, [addressSearchQuery]);

  const handleSuggestionClick = async (suggestion: any) => {
      setAddressSearchQuery(suggestion.description);
      setSuggestions([]);
      let loc = null;
      if (suggestion.geometry && suggestion.geometry.location) {
          loc = suggestion.geometry.location;
      } else {
          try {
              if (onAddApiLog) onAddApiLog({ id: 'geocode', label: `GET /api/places/geocode?address=${encodeURIComponent(suggestion.description)}`, method: 'GET' });
              const res = await apiGet(`/api/places/geocode?address=${encodeURIComponent(suggestion.description)}`);
              if (res && res.lat && res.lng) {
                  loc = res;
              }
          } catch (e) {
              console.error(e);
          }
      }

      if (loc && mapInstance) {
         mapInstance.flyTo({ center: [loc.lng, loc.lat], zoom: 16 });
         setAddress(suggestion.description);
         const parts = suggestion.description.split(',').map((p: string) => p.trim());
         let zip = '';
         let state = '';
         let city = '';
         let currentIndex = parts.length - 1;
         if (currentIndex >= 0 && (parts[currentIndex].toLowerCase() === 'india' || parts[currentIndex].toLowerCase() === 'in')) {
             currentIndex--;
         }
         if (currentIndex >= 0) {
             const zipMatch = parts[currentIndex].match(/(.*?)\s+([\d\s-]{5,10})$/);
             if (zipMatch) {
                 state = zipMatch[1].trim();
                 zip = zipMatch[2].trim();
                 currentIndex--;
             } else if (/^[\d\s-]{5,10}$/.test(parts[currentIndex])) {
                 zip = parts[currentIndex];
                 currentIndex--;
             }
         }
         if (currentIndex >= 0 && !state) {
             state = parts[currentIndex];
             currentIndex--;
         }
         if (currentIndex >= 0) {
             city = parts[currentIndex];
         }
         if (zip) setZipCode(zip);
         if (state) setState(state);
         if (city) setCity(city);
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent"
    >
      <div className="flex items-center gap-3 shrink-0 mb-4">
        <button
          onClick={() => setView('settings')}
          className="p-2 rounded-xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 text-slate-500 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:text-white cursor-pointer transition-all"
        >
          <X className="w-5 h-5" />
        </button>
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
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-64 overflow-y-auto z-10">
                {suggestions.map((s, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSuggestionClick(s)}
                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-700"
                  >
                    <p className="text-sm text-slate-800 dark:text-[#f0ede6] truncate">{s.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="relative w-full h-[300px] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shrink-0 shadow-inner">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
            {/* Fixed Center Pin */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl mb-5">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Current Address Details */}
          <div className="space-y-4 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md/50 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex gap-4">
               <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Label</label>
                  <input
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="e.g. Home, Work"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
               </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address Line 1</label>
              <textarea
                value={address}
                onChange={(e) => { setAddress(e.target.value); setError(''); }}
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
                required
                minLength={5}
                maxLength={255}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => { setCity(e.target.value); setError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    required
                    minLength={2}
                    maxLength={100}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => { setState(e.target.value); setError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    required
                    minLength={2}
                    maxLength={100}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zip</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={e => { setZipCode(e.target.value); setError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    required
                    pattern="^\d{5,10}$"
                  />
               </div>
            </div>
            </div>
            
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
                       const res = await apiPost(`/api/v1/customers/${userId}/addresses`, payload);
                       const data = res?.data || res;
                       if (data && data.id) {
                         setSavedAddresses((prev: any[]) => [...prev, data]);
                       }
                     } catch (e) {
                        console.error("Failed to save address", e);
                     }
                   }
                   setView('settings');
                 }}
                 className="w-full py-3.5 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
               >
                 Confirm Location
               </button>
             </div>
             
        </div>
      </div>
    </motion.div>
  );
}

