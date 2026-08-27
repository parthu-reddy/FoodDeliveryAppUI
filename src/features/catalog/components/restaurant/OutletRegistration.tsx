import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/contexts/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';
import { mapsApi, restaurantApi } from '@/lib/zodiosClients';
import ImageUploadField from "@features/kyc/components/ImageUploadField";
import { Button, FormField, Input, Spinner } from '@shared/ui';
import { AlertCircle, CheckCircle, Clock, Loader, MapPin, Navigation, Plus, Search, Store, Trash2 } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { asUntyped } from '../../../../lib/untypedResponse';

const outletSchema = z.object({
  name: z.string().min(1, 'Outlet name is required.').max(100, 'Outlet name cannot exceed 100 characters.'),
  fssai: z.string().length(14, 'FSSAI License must be exactly 14 characters.'),
  banner: z.string().url('Invalid Banner URL.').max(1000, 'Banner URL cannot exceed 1000 characters.').optional().or(z.literal('')),
  lat: z.number().min(-90, 'Invalid Latitude').max(90, 'Invalid Latitude'),
  lng: z.number().min(-180, 'Invalid Longitude').max(180, 'Invalid Longitude')
});

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
  const [timings, setTimings] = useState([{ openingTime: "09:00", closingTime: "23:00" }]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { showError } = useToast();
  useConfig();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (isOpen && mapContainerRef.current && !mapRef.current) {
      
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [parseFloat(lng), parseFloat(lat)],
        zoom: 12,
        minZoom: 10,
        maxZoom: 17,
        interactive: false,
        attributionControl: false,
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

    return () => {
      // Cleanup happens when modal closes
    };
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Clean map instance when closing
  useEffect(() => {
    if (!isOpen) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    async function searchPlaces() {
      if (debouncedSearchQuery.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await window.fetch(`/olamaps/places/v1/autocomplete?input=${encodeURIComponent(debouncedSearchQuery)}`);
        const data = await res.json();
        if (data.predictions) {
          setSearchResults(data.predictions);
        }
      } catch (err: unknown) {
        console.error('Autocomplete Error:', err);
      } finally {
        setIsSearching(false);
      }
    }
    searchPlaces();
  }, [debouncedSearchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const selectLocation = async (placeId: string, description: string) => {
    setSearchQuery(description);
    setSearchResults([]);
    try {
      const res = await window.fetch(`/olamaps/places/v1/details?place_id=${placeId}`);
      const data = await res.json();
      if (data.result && data.result.geometry && data.result.geometry.location) {
        const location = data.result.geometry.location;
        const newLat = location.lat.toFixed(6);
        const newLng = location.lng.toFixed(6);
        setLat(newLat);
        setLng(newLng);
        
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [location.lng, location.lat], zoom: 15 });
        }
        if (markerRef.current) {
          markerRef.current.setLngLat([location.lng, location.lat]);
        }
      }
    } catch (err: unknown) {
      console.error('Place Details Error:', err);
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
            const res = await mapsApi.integration.get('/api/places/reverse-geocode', { queries: { lat: latitude, lng: longitude } });
            if (res && res.address) {
              setSearchQuery(asUntyped<{ address?: string }>(res).address ?? '');
            }
          } catch (e: unknown) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await restaurantApi.restaurantOutlet.post('/api/v1/brands/:brandId/outlets', newOutlet as any, { params: { brandId } });
      setIsOpen(false);
      setName('');
      setFssai('');
      setLat("12.9716");
      setLng("77.5946");
      setTimings([{ openingTime: "09:00", closingTime: "23:00" }]);
      onRefresh();
    } catch (err: unknown) {
      // @ts-expect-error auto-migration type suppression
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).response?.data?.message || (err as any).response?.data?.error || err.message || 'Failed to register outlet');
    } finally {
      setIsSaving(false);
    }
  };

  const addTiming = () => {
    setTimings([...timings, { openingTime: "09:00", closingTime: "23:00" }]);
  };

  const updateTiming = (index: number, field: 'openingTime' | 'closingTime', value: string) => {
    const newTimings = [...timings];
    newTimings[index][field] = value;
    setTimings(newTimings);
  };

  const removeTiming = (index: number) => {
    if (timings.length > 1) {
      setTimings(timings.filter((_, i) => i !== index));
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        fullWidth
        className="!p-4 border-dashed border-2 !border-rose-500/30 hover:!border-orange-500/50 hover:!bg-orange-50/50 dark:hover:!bg-orange-950/20 !text-slate-500 hover:!text-orange-500"
      >
        <Plus className="w-5 h-5" />
        <span className="font-bold text-sm">Register New Outlet</span>
      </Button>
    );
  }

  return (
    <div className="bg-white/20 dark:bg-slate-900/20 border border-rose-500/20 dark:border-rose-500/30 rounded-[2rem] p-5 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 text-orange-500 mb-4">
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
          <div className="relative z-10">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search for an address or landmark..."
                className="w-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-xl pl-10 pr-24 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <div className="absolute right-3 top-2.5 flex items-center gap-2">
                {isSearching ? (
                  <Loader className="w-4 h-4 text-orange-500 animate-spin" />
                ) : (
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Use Current Location"
                  >
                    <Navigation className="w-3 h-3" />
                    <span className="hidden sm:inline">Locate Me</span>
                  </button>
                )}
              </div>
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20">
                { }
                { }
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {searchResults.map((result: any) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => selectLocation(result.place_id, result.description)}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    {result.description}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div 
            ref={mapContainerRef} 
            className="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative z-0"
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Latitude" required>
              <Input
                type="number"
                 
                step="any"
                required
                value={lat}
                onChange={e => {
                  setLat(e.target.value);
                  const newLat = parseFloat(e.target.value);
                  const newLng = parseFloat(lng);
                  if (!isNaN(newLat) && !isNaN(newLng)) {
                    if (markerRef.current) markerRef.current.setLngLat([newLng, newLat]);
                    if (mapRef.current) mapRef.current.setCenter([newLng, newLat]);
                  }
                }}
              />
            </FormField>
            <FormField label="Longitude" required>
              <Input
                type="number"
                 
                step="any"
                required
                value={lng}
                onChange={e => {
                  setLng(e.target.value);
                  const newLat = parseFloat(lat);
                  const newLng = parseFloat(e.target.value);
                  if (!isNaN(newLat) && !isNaN(newLng)) {
                    if (markerRef.current) markerRef.current.setLngLat([newLng, newLat]);
                    if (mapRef.current) mapRef.current.setCenter([newLng, newLat]);
                  }
                }}
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Operating Shifts
            </label>
            <button
              type="button"
              onClick={addTiming}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 flex items-center gap-1 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-lg"
            >
              <Plus className="w-3 h-3" /> Add Shift
            </button>
          </div>
          
          <div className="space-y-2">
            {timings.map((timing, index) => (
              <div key={index} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/20 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <FormField label="Opens" required>
                    <Input
                      type="time"
                      required
                      value={timing.openingTime}
                      onChange={e => updateTiming(index, 'openingTime', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Closes" required>
                    <Input
                      type="time"
                      required
                      value={timing.closingTime}
                      onChange={e => updateTiming(index, 'closingTime', e.target.value)}
                    />
                  </FormField>
                </div>
                {timings.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTiming(index)}
                    className="mt-4 text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-950/30"
                    title="Remove Shift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
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
            className="flex-1 !bg-gradient-to-r from-orange-500 to-rose-500"
          >
            {isSaving ? <Spinner size="xs" /> : <CheckCircle className="w-4 h-4" />}
            {isSaving ? 'Registering...' : 'Register Outlet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
