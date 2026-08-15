import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, MapPin, Loader, Navigation } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from '../../lib/zodiosClients';
import { useToast } from '../../context/ToastContext';
import { z } from 'zod';
import { Input, Button, Spinner } from '../ui';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfig } from '../../contexts/ConfigContext';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label cannot exceed 50 characters'),
  addressLine1: z.string().min(1, 'Address Line 1 is required').max(255, 'Address cannot exceed 255 characters'),
  addressLine2: z.string().max(255, 'Address cannot exceed 255 characters').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City cannot exceed 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State cannot exceed 100 characters'),
  zipCode: z.string().min(1, 'ZIP Code is required').max(20, 'ZIP Code cannot exceed 20 characters'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export default function CustomerAddressModal({
  isAddressModalOpen,
  setIsAddressModalOpen,
  addressSearchQuery,
  setAddressSearchQuery,
  address,
  setAddress,
  savedAddresses = [],
  onAddApiLog,
  customerId,
  onSelectDeliveryLocation
}: any) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [addressForm, setAddressForm] = useState({
    label: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showError } = useToast();
  const { olaMapsApiKey } = useConfig();
  
  const debouncedSearchQuery = useDebounce(addressSearchQuery, 500);

  useEffect(() => {
    async function searchPlaces() {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const apiKey = olaMapsApiKey || (import.meta as any).env.VITE_OLA_MAPS_API_KEY || '';
        const res = await fetch(`https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(debouncedSearchQuery)}&api_key=${apiKey}`);
        const data = await res.json();
        if (data.predictions) {
          setSearchResults(data.predictions);
        }
      } catch (err) {
        console.error('Autocomplete Error:', err);
      } finally {
        setIsSearching(false);
      }
    }
    searchPlaces();
  }, [debouncedSearchQuery]);

  const handleSearch = (query: string) => {
    setAddressSearchQuery(query);
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    try {
      const apiKey = olaMapsApiKey || (import.meta as any).env.VITE_OLA_MAPS_API_KEY || '';
      const res = await fetch(`https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${apiKey}`);
      const data = await res.json();
      if (data.result && data.result.geometry) {
        const location = data.result.geometry.location;
        setLat(location.lat.toString());
        setLng(location.lng.toString());
        
        // Auto populate fields
        const parts = description.split(',').map(p => p.trim());
        setAddressForm(prev => ({
          ...prev,
          addressLine1: parts[0] || '',
          addressLine2: parts.length > 3 ? parts[1] : '',
          city: parts.length > 2 ? parts[parts.length - 3] || '' : (parts[1] || ''),
          state: parts.length > 1 ? parts[parts.length - 2] || '' : '',
          zipCode: parts.length > 0 ? parts[parts.length - 1] || '' : ''
        }));
        
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [location.lng, location.lat], zoom: 15 });
        }
        if (markerRef.current) {
          markerRef.current.setLngLat([location.lng, location.lat]);
        }
        setSearchResults([]);
        setAddressSearchQuery(description);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setLat(latitude.toString());
            setLng(longitude.toString());
            
            if (mapRef.current) {
              mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
            }
            if (markerRef.current) {
              markerRef.current.setLngLat([longitude, latitude]);
            }
            
            // Try to reverse geocode
            const res = await (customerApi.get as any)(`/api/places/reverse-geocode?lat=${latitude}&lng=${longitude}`);
            if (res && res.address) {
              const description = res.address;
              setAddressSearchQuery(description);
              const parts = description.split(',').map((p: string) => p.trim());
              setAddressForm(prev => ({
                ...prev,
                addressLine1: parts[0] || '',
                addressLine2: parts.length > 3 ? parts[1] : '',
                city: parts.length > 2 ? parts[parts.length - 3] || '' : (parts[1] || ''),
                state: parts.length > 1 ? parts[parts.length - 2] || '' : '',
                zipCode: parts.length > 0 ? parts[parts.length - 1] || '' : ''
              }));
            }
          } catch (e) {
            console.error("Reverse geocoding failed", e);
          } finally {
            setIsSearching(false);
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          setIsSearching(false);
          showError("Could not get your current location.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      showError("Geolocation is not supported by this browser.");
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
      await (customerApi.post as any)(`/api/v1/customers/${customerId}/addresses`, payload);
      setIsAddressModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isAddressModalOpen && mapContainerRef.current && !mapRef.current) {
      const apiKey = olaMapsApiKey || (import.meta as any).env.VITE_OLA_MAPS_API_KEY || '';
      
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://api.olamaps.io/styleEditor/v1/styleEdit/styles/53575843-c000-4b22-ac12-5818a67991bd/LowCost?api_key=${apiKey}`,
        center: [parseFloat(lng), parseFloat(lat)],
        zoom: 12,
        minZoom: 10,
        maxZoom: 17,
        interactive: false,
        attributionControl: false,
        transformRequest: (url) => {
          if (url.includes('api.olamaps.io') && !url.includes('api_key=')) {
            const separator = url.includes('?') ? '&' : '?';
            return { url: `${url}${separator}api_key=${apiKey}` };
          }
          return { url };
        }
      });
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      const marker = new maplibregl.Marker({ draggable: true, color: '#f97316' })
        .setLngLat([parseFloat(lng), parseFloat(lat)])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setLng(lngLat.lng.toFixed(6));
        setLat(lngLat.lat.toFixed(6));
      });

      mapRef.current = map;
      markerRef.current = marker;
    }
  }, [isAddressModalOpen]);

  useEffect(() => {
    if (!isAddressModalOpen && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  }, [isAddressModalOpen]);

  return (
    <>
      {/* ------------------- ADDRESS MODAL ------------------- */}
      {isAddressModalOpen && (
        <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-[2rem] p-5 shadow-sm animate-fade-in flex flex-col space-y-4">
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search for area, street name..."
                    value={addressSearchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl py-3.5 pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isSearching ? (
                      <Loader className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <button
                        onClick={handleUseCurrentLocation}
                        className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Use Current Location"
                      >
                        <Navigation className="w-3 h-3" />
                        <span className="hidden sm:inline">Locate Me</span>
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {searchResults.map((result: any) => (
                          <button
                            key={result.place_id}
                            onClick={() => handleSelectPlace(result.place_id, result.description)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-start gap-3"
                          >
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{result.description.split(',')[0]}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{result.description}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Maplibre Map */}
                <div ref={mapContainerRef} className="relative w-full h-48 rounded-2xl overflow-hidden shrink-0 border border-rose-500/20 dark:border-rose-500/30">
                  <div className="absolute bottom-3 inset-x-0 mx-auto w-fit bg-white/20 dark:bg-slate-900/20 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full shadow-sm text-slate-700 dark:text-[#f0ede6] z-10 pointer-events-none">
                    Drag pin to move
                  </div>
                </div>
                {/* Saved Addresses */}
                {savedAddresses && savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Saved Addresses</label>
                    <div className="flex flex-col gap-2">
                      {savedAddresses.map((addr: any) => (
                        <button
                          key={addr.id}
                          onClick={() => {
                            const addrStr = `${addr.label}: ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}`;
                            if (onSelectDeliveryLocation) {
                              onSelectDeliveryLocation(addrStr, addr.latitude, addr.longitude);
                            } else {
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
                <div className="space-y-3 flex-1 pb-4">
                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Address Details</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Input
                        type="text"
                        placeholder="Label (e.g. Home, Work)"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        type="text"
                        placeholder="Address Line 1"
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Input
                        type="text"
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Input
                        type="text"
                        placeholder="State"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        type="text"
                        placeholder="ZIP Code"
                        value={addressForm.zipCode}
                        onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

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
        </div>
      )}
    </>
  );
}
