import { useEffect, useState } from 'react';
import { olaProxyBase } from '@/lib/olaMaps';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Place autocomplete, and the lookup that turns a chosen prediction into coordinates.
 *
 * `CustomerAddressModal` and `OutletRegistration` had the same debounced effect character for
 * character, down to the `'Autocomplete Error:'` prefix, plus their own copy of the details
 * fetch. What differs between them is what they do with the result — one fills a delivery
 * address, the other an outlet — so that stays at the call site and only the transport lives
 * here.
 */

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
}

export interface PlaceLocation {
  lat: number;
  lng: number;
}

/** Below this the API returns noise, and every caller was already guarding on it. */
const MIN_QUERY = 3;

export function usePlaceAutocomplete(query: string, delayMs = 500) {
  const debounced = useDebounce(query, delayMs);
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let live = true;
    async function searchPlaces() {
      if (!debounced || debounced.length < MIN_QUERY) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await window.fetch(
          `${olaProxyBase()}/places/v1/autocomplete?input=${encodeURIComponent(debounced)}`,
        );
        const data = await res.json();
        // `live` guards a late response from a query the user has already replaced, which
        // neither copy of this did: results could arrive out of order and the older one win.
        if (live && data.predictions) setResults(data.predictions);
      } catch (err: unknown) {
        console.error('Autocomplete Error:', err);
      } finally {
        if (live) setIsSearching(false);
      }
    }
    searchPlaces();
    return () => { live = false; };
  }, [debounced]);

  return { results, isSearching, setResults, setIsSearching };
}

/** The coordinates behind a prediction, or null if the lookup fails. */
export async function fetchPlaceLocation(placeId: string): Promise<PlaceLocation | null> {
  try {
    const res = await window.fetch(`${olaProxyBase()}/places/v1/details?place_id=${placeId}`);
    const data = await res.json();
    const location = data?.result?.geometry?.location;
    return location ? { lat: location.lat, lng: location.lng } : null;
  } catch (err: unknown) {
    console.error('Place Details Error:', err);
    return null;
  }
}
