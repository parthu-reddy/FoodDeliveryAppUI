import { useEffect, useRef } from 'react';

/**
 * Tells the customer their carts survived an address change, once per change and only when
 * there was something in them. Moved verbatim out of `CustomerDashboard` (2026-09-24).
 */
export function useAddressChangeNotice(locationKey: string, totalCartItems: number, showInfo: (msg: string) => void) {
  const prevLocationKeyRef = useRef(locationKey);
  const prevCartItemsRef = useRef(totalCartItems);

  useEffect(() => {
    prevCartItemsRef.current = totalCartItems;
  }, [totalCartItems]);

  useEffect(() => {
    if (prevLocationKeyRef.current !== locationKey) {
      if (prevCartItemsRef.current > 0) {
        showInfo("Address changed. Your cart items from the previous address are saved.");
      }
      prevLocationKeyRef.current = locationKey;
    }
  }, [locationKey, showInfo]);

}
