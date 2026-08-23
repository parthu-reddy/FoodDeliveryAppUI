import { restaurantApi } from '@/lib/zodiosClients';
import { Restaurant } from '@/types';
import { useEffect, useState } from 'react';

interface UseRestaurantsOptions {
  deliveryLat: number | null;
  deliveryLng: number | null;
  radiusKm?: number;
}

export function useRestaurants({ deliveryLat, deliveryLng, radiusKm = 10.0 }: UseRestaurantsOptions) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    if (deliveryLat !== null && deliveryLng !== null) {
      setIsRestaurantsLoading(true);
      restaurantApi.restaurantOutlet.get('/api/v1/restaurants/nearby', { 
        queries: { lat: deliveryLat, lng: deliveryLng, radius: radiusKm },
        signal: controller.signal 
      })
        .then(res => {
          if (res.data) setRestaurants(res.data);
        })
        .catch(err => {
          if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
            console.log('Request cancelled due to rapid address change');
          } else {
            console.error(err);
            setError(err);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsRestaurantsLoading(false);
        });
    } else {
      setRestaurants([]);
    }
    return () => { controller.abort(); };
  }, [deliveryLat, deliveryLng, radiusKm]);

  return { restaurants, isRestaurantsLoading, error };
}
