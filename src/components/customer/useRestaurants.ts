import { useState, useEffect } from 'react';
import { Restaurant } from '../../types';
import { apiGet } from '../../lib/apiClient';

interface UseRestaurantsOptions {
  deliveryLat: string | number;
  deliveryLng: string | number;
  radiusKm?: number;
}

export function useRestaurants({ deliveryLat, deliveryLng, radiusKm = 10.0 }: UseRestaurantsOptions) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;
    if (deliveryLat && deliveryLng) {
      setIsRestaurantsLoading(true);
      apiGet(`/api/v1/restaurants/nearby?lat=${deliveryLat}&lng=${deliveryLng}&radius=${radiusKm}`)
        .then(res => {
          if (!ignore && res.data) setRestaurants(res.data);
        })
        .catch(err => {
          console.error(err);
          if (!ignore) setError(err);
        })
        .finally(() => {
          if (!ignore) setIsRestaurantsLoading(false);
        });
    }
    return () => { ignore = true; };
  }, [deliveryLat, deliveryLng, radiusKm]);

  return { restaurants, isRestaurantsLoading, error };
}
