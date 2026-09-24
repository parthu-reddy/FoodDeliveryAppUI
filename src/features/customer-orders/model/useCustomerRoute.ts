import { useMemo, useState } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import type { Restaurant } from '@/types';

/**
 * Everything the customer home reads from the URL: which restaurant is open, whether the
 * settings screen is showing and on which tab. Moved verbatim out of `CustomerDashboard`
 * (2026-09-24) to bring it back under the 300-line gate.
 */
export type CustomerSettingsTab = 'profile' | 'history' | 'addresses' | 'wallet' | 'reviews';

export function useCustomerRoute(restaurants: Restaurant[] | null | undefined) {
  const navigate = useNavigate();
  const location = useLocation();

  // Route matches to derive state
  const restaurantMatch = useMatch('/customer/restaurant/:id');
  const restaurantIdFromUrl = restaurantMatch?.params?.id;

  const [overrideRestaurant, setOverrideRestaurant] = useState<Restaurant | null>(null);

  const selectedRestaurant = useMemo(() => {
    if (!restaurantIdFromUrl) return null;
    if (overrideRestaurant && overrideRestaurant.id === restaurantIdFromUrl) return overrideRestaurant;
    if (!restaurants) return null;
    return restaurants.find(r => r.id === restaurantIdFromUrl) || null;
  }, [restaurantIdFromUrl, restaurants, overrideRestaurant]);

  // viewMode and settingsTab are now derived from routes
  const isSettingsView = location.pathname.includes('/customer/settings');
  const viewMode = isSettingsView ? 'settings' : 'home';
  
  // All five tabs the settings screen has. Wallet and reviews used to fall through to
  // 'profile', so /customer/settings/wallet opened the profile tab.
  const tabMatch = location.pathname.match(/\/customer\/settings\/(profile|history|addresses|wallet|reviews)/);
  const settingsTab: CustomerSettingsTab = (tabMatch?.[1] as CustomerSettingsTab | undefined) ?? 'profile';

  // We provide dummy setViewMode and setSettingsTab for compatibility with child components
  const setViewMode = (mode: 'home' | 'settings') => navigate(mode === 'settings' ? '/customer/settings' : '/customer');
  const setSettingsTab = (tab: CustomerSettingsTab) => navigate(`/customer/settings/${tab}`);
  const setSelectedRestaurantRoute = (r: Restaurant | null) => {
    if (r) {
      setOverrideRestaurant(r);
      navigate(`/customer/restaurant/${r.id}`);
    } else {
      setOverrideRestaurant(null);
      navigate(`/customer`);
    }
  };

  return {
    selectedRestaurant, viewMode, setViewMode,
    settingsTab, setSettingsTab, setSelectedRestaurantRoute,
  };
}
