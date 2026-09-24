import { schemas as restaurantSchemas } from '@/api/generated/schemas/restaurant/restaurant_outlet_controller';
import { z } from 'zod';
import { useCallback, useEffect, useState } from 'react';
import { restaurantApi } from '@/lib/zodiosClients';

type Restaurant = z.infer<typeof restaurantSchemas.NearbyRestaurantDTO>;

interface UseRestaurantsOptions {
  deliveryLat: number | null;
  deliveryLng: number | null;
  radiusKm?: number;
}

export function useRestaurants({ deliveryLat, deliveryLng, radiusKm = 10.0 }: UseRestaurantsOptions) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  // Bumped by `retry`; part of the effect's key so a failed load can be asked for again.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    
    if (deliveryLat !== null && deliveryLng !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRestaurantsLoading(true);
      setError(null);
      restaurantApi.restaurantOutlet.get('/api/v1/restaurants/nearby', { 
        queries: { lat: deliveryLat, lng: deliveryLng, radius: radiusKm },
        signal: controller.signal 
      })
        .then((res) => {
          if (res && res.data) setRestaurants(res.data);
        })
        .catch(err => {
          // Checked on the signal, not the error's shape: Zodios' interceptor logs and may
          // re-wrap a cancel, and a superseded request must never surface as a load failure.
          if (controller.signal.aborted || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
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
  }, [deliveryLat, deliveryLng, radiusKm, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { restaurants, isRestaurantsLoading, error, retry };
}
