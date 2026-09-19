import { useEffect, useState } from 'react';
import { restaurantApi } from '@/lib/zodiosClients';
import type { Brand, MenuItem, Outlet } from '@/types';
import {
  getBrands,
  getEffectiveMenu,
  getMasterMenuItems,
  getOutletOverrides,
  getOutlets,
} from '@features/catalog/model/menuStore';

/**
 * What this restaurant sells and where: its brands, its outlets, the effective menu for the
 * outlet currently selected, and the two switches that matter during service — whether the
 * outlet is accepting orders at all, and whether a given dish is in stock.
 *
 * Lifted verbatim out of an 845-line `RestaurantDashboard`. Both toggles are optimistic and
 * both revert on failure; that is easy to get wrong a second time, which is the argument for
 * there being only one copy of them.
 */

interface UseRestaurantCatalogOptions {
  selectedOutletId: string;
  setSelectedOutletId: (id: string) => void;
  /** The dashboard still owns this; the loader reports what the API said the prep time is. */
  setApiPrepSeconds: (seconds: string) => void;
  showError: (message: string) => void;
}

export function useRestaurantCatalog({
  selectedOutletId,
  setSelectedOutletId,
  setApiPrepSeconds,
  showError,
}: UseRestaurantCatalogOptions) {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [, setMasterItems] = useState<unknown[]>([]);
  const [, setOverrides] = useState<unknown[]>([]);
  const [stockStatus, setStockStatus] = useState<Record<string, boolean>>({});
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<Record<string, boolean>>({});

  const hasOutlets = outlets.length > 0;
  const isCurrentOutletAcceptingOrders = hasOutlets && (isAcceptingOrders[selectedOutletId] ?? true);

const loadData = async () => {
  try {
    const [fetchedBrands, fetchedOutlets] = await Promise.all([
      getBrands(),
      getOutlets()
    ]);
     
    setBrands(fetchedBrands);
    setOutlets(fetchedOutlets);
    
    const newAcceptingState: Record<string, boolean> = {};
    fetchedOutlets.forEach((o: unknown) => {
      const outlet = o as { id: string, isActive?: boolean };
       
      newAcceptingState[outlet.id] = outlet.isActive !== false;
    });
     
    setIsAcceptingOrders(newAcceptingState);

    if (fetchedOutlets.length === 0) {
      if (selectedOutletId) {
        setSelectedOutletId('');
        localStorage.removeItem('restaurant_selectedOutletId');
        return;
      }
    }
    if (!selectedOutletId && fetchedOutlets.length > 0) {
      const firstOutletId = (fetchedOutlets[0] as {id: string}).id;
      setSelectedOutletId(firstOutletId);
      localStorage.setItem('restaurant_selectedOutletId', firstOutletId);
      return; // will re-trigger useEffect
    } else if (selectedOutletId && fetchedOutlets.length > 0 && !fetchedOutlets.find((o: unknown) => (o as {id: string}).id === selectedOutletId)) {
      const firstOutletId = (fetchedOutlets[0] as {id: string}).id;
      setSelectedOutletId(firstOutletId);
      localStorage.setItem('restaurant_selectedOutletId', firstOutletId);
      return; // replace stale id with first available
    } else if (selectedOutletId && fetchedOutlets.length === 0) {
      setSelectedOutletId('');
      localStorage.removeItem('restaurant_selectedOutletId');
      return;
    } else if (selectedOutletId) {
      localStorage.setItem('restaurant_selectedOutletId', selectedOutletId);
    }

    if (selectedOutletId) {
      const [fetchedEffective, fetchedOverrides] = await Promise.all([
        getEffectiveMenu(selectedOutletId),
        getOutletOverrides(selectedOutletId)
      ]);
      setMenuList(fetchedEffective);
      setOverrides(fetchedOverrides);

      const fetchedOutlet = fetchedOutlets.find((o: unknown) => (o as {id: string}).id === selectedOutletId) as Outlet | undefined;
      if (fetchedOutlet) {
        const fetchedMasterItems = await getMasterMenuItems(fetchedOutlet.brandId || '');
        setMasterItems(fetchedMasterItems as unknown[]);
        
        if (fetchedOutlet.defaultPrepTimeSeconds) {
          setApiPrepSeconds(fetchedOutlet.defaultPrepTimeSeconds.toString());
        }
      } else {
        setMasterItems([]);
      }
    }
  } catch {
    // best effort: failure here must not break the dashboard render
  }
};

const toggleOutletStatus = async () => {
  if (!selectedOutletId) return;
  const newStatus = !isCurrentOutletAcceptingOrders;
  // Optimistic UI update
  setIsAcceptingOrders(prev => ({ ...prev, [selectedOutletId]: newStatus }));
  try {
      await restaurantApi.restaurantOutlet.put('/api/v1/outlets/:outletId/status', { isActive: newStatus }, { params: { outletId: selectedOutletId } });
  } catch (err: unknown) {
      // Revert on error
      setIsAcceptingOrders(prev => ({ ...prev, [selectedOutletId]: !newStatus }));
      const typedErr = err as { response?: { data?: { message?: string, error?: string } }, message?: string };
      showError(typedErr.response?.data?.message || typedErr.response?.data?.error || typedErr.message || "Failed to update outlet status");
  }
};

const toggleStock = async (dishId: string, currentStatus: boolean) => {
  const key = `${selectedOutletId}_${dishId}`;
  const newStockStatus = !currentStatus;
  
  setStockStatus(prev => ({
    ...prev,
    [key]: newStockStatus
  }));

  try {
    await restaurantApi.catalog.post('/api/v1/outlets/:outletId/menu-overrides/:masterMenuItemId', {
            isAvailable: newStockStatus
          }, { params: { outletId: selectedOutletId, masterMenuItemId: dishId } });
  } catch (e: unknown) {
    console.error('Failed to update stock', e);
    setStockStatus(prev => ({
      ...prev,
      [key]: currentStatus
    }));
    showError('Failed to update stock status.');
  }
};
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutletId]);

  /**
   * The selected outlet's name. "No Outlet Registered" when there are none — that wording is
   * load-bearing: it is how a brand owner who has not finished onboarding learns why the
   * dashboard is empty.
   */
  const myRestaurantName =
    outlets.length > 0
      ? (outlets.find((o) => o.id === selectedOutletId)?.name || 'My Restaurant')
      : 'No Outlet Registered';

  return {
    menuList, brands, outlets, setBrands,
    stockStatus, hasOutlets, isCurrentOutletAcceptingOrders,
    myRestaurantName,
    loadData, toggleOutletStatus, toggleStock,
  };
}
