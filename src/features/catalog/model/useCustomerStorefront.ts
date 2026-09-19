import { useEffect, useState } from 'react';
import { customerApi } from '@/lib/zodiosClients';
import { getEffectiveMenu } from '@features/catalog/model/menuStore';
import type { MenuItem, Restaurant } from '@/types';

/**
 * The restaurant a customer is currently looking at: its menu, its sibling outlets, and
 * whether it can deliver to where they are.
 *
 * Lifted verbatim out of an 887-line `CustomerDashboard`. All three fetches key off the same
 * selected restaurant and all three guard with an `ignore` flag, which is the pattern that
 * keeps a slow response for a restaurant the customer has already navigated away from out of
 * the screen they are now on.
 */

interface UseCustomerStorefrontOptions {
  selectedRestaurant: Restaurant | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
}

export function useCustomerStorefront({
  selectedRestaurant,
  deliveryLat,
  deliveryLng,
}: UseCustomerStorefrontOptions) {
  const [brandOutlets, setBrandOutlets] = useState<Restaurant[]>([]);
  const [effectiveMenu, setEffectiveMenu] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState<boolean>(false);
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState<boolean | null>(null);
  const [deliveryAvailabilityError, setDeliveryAvailabilityError] = useState<string | null>(null);



useEffect(() => {
  let ignore = false;
  if (selectedRestaurant && selectedRestaurant.id) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuLoading(true);
    getEffectiveMenu(selectedRestaurant.id).then(menu => {
      if (!ignore) {
        setEffectiveMenu(menu);
        setIsMenuLoading(false);
       
      }
    }).catch(() => {
      if (!ignore) setIsMenuLoading(false);
    });
  } else {
    setEffectiveMenu([]);
    setIsMenuLoading(false);
  }
  return () => { ignore = true; };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedRestaurant?.id]); // Only refetch menu when outlet ID changes

 

useEffect(() => {
  let ignore = false;
  if (selectedRestaurant?.brandId) {
    customerApi.customerRestaurant.getBrandOutlets({
      params: { brandId: selectedRestaurant.brandId },
      queries: { lat: deliveryLat ?? 0, lng: deliveryLng ?? 0 }
    })
      .then(res => {
        if (!ignore && res && res.data) setBrandOutlets(res.data);
      })
      .catch(console.error);
  } else {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrandOutlets([]);
  }
  return () => { ignore = true; };
  // Only refetch outlets when the brand or the delivery point changes.
}, [selectedRestaurant?.brandId, deliveryLat, deliveryLng]);

useEffect(() => {
  let ignore = false;
  if (selectedRestaurant && selectedRestaurant.id) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDeliveryAvailable(null);
    setDeliveryAvailabilityError(null);
    customerApi.customerRestaurant.get('/api/v1/restaurants/:id/delivery-availability', { params: { id: selectedRestaurant.id } })
      .then(res => {
        if (!ignore && typeof res === 'boolean') {
          setIsDeliveryAvailable(res);
         
        }
      })
      .catch(err => {
        console.error(err);
        if (!ignore && err.response && (err.response.status === 409 || err.response.status === 400)) {
          setIsDeliveryAvailable(false);
          setDeliveryAvailabilityError(err.response.data?.errorCode || err.response.data?.message || 'OUT_OF_SERVICE_AREA');
        }
       
      });
  }
  return () => { ignore = true; };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedRestaurant?.id]);


  return {
    brandOutlets, effectiveMenu, isMenuLoading,
    isDeliveryAvailable, deliveryAvailabilityError,
  };
}
