import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from '@/lib/zodiosClients';

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
      restaurantApi.restaurantOutlet.get('/api/v1/restaurants/nearby', { queries: { lat: Number(deliveryLat), lng: Number(deliveryLng), radius: radiusKm } })
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
