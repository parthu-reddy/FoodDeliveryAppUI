import { MenuItem, MasterMenuItem, OutletOverride } from '../types';
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export interface Brand {
  id: string;
  name: string;
  gstin: string;
  pan: string;
  cin: string;
  bankAccountNumber: string;
  ifscCode: string;
  logoUrl: string;
  owner: string;
  createdAt: string;
}

export interface Outlet {
  id: string;
  brandId: string;
  name: string;
  fssaiLicenseNumber: string;
  lat: number;
  lng: number;
  timings?: { openingTime: string; closingTime: string }[];
  bannerUrl: string;
  defaultPrepTimeSeconds?: number;
  createdAt: string;
}

// Ensure fetch is absolute or relative properly. Since we serve both on 3000, we can use relative.
const API_BASE = '/api/v1';

export async function getBrands(): Promise<Brand[]> {
  try {
    const res = await apiGet(`${API_BASE}/brands`);
    return res.data || [];
  } catch { return []; }
}

export async function saveBrands(brands: Brand[]) {
  // Mocked for now, not fully implemented in API
}

export async function getOutlets(): Promise<Outlet[]> {
  try {
    const res = await apiGet(`${API_BASE}/outlets`);
    return res.data || [];
  } catch { return []; }
}

export async function getOutletsByBrand(brandId: string): Promise<Outlet[]> {
  try {
    const res = await apiGet(`${API_BASE}/brands/${brandId}/outlets`);
    return res.data || [];
  } catch { return []; }
}

export async function saveOutlets(outlets: Outlet[]) {
  // Mocked for now
}

export async function getMasterMenuItems(brandId: string): Promise<MasterMenuItem[]> {
  if (!brandId || brandId === 'undefined') return [];
  try {
    const res = await apiGet(`${API_BASE}/brands/${brandId}/master-menu`);
    return res.data || [];
  } catch { return []; }
}

export async function saveMasterMenuItems(items: MasterMenuItem[]) {
  // Mocked
}

export async function getOutletOverrides(outletId: string): Promise<OutletOverride[]> {
  try {
    const res = await apiGet(`${API_BASE}/outlets/${outletId}/menu-overrides`);
    return res.data || [];
  } catch { return []; }
}

export async function saveOutletOverrides(overrides: OutletOverride[]) {
  // Mocked
}

// Add Master Menu Item
export async function addMasterMenuItem(brandId: string, item: Partial<MasterMenuItem>): Promise<MasterMenuItem | null> {
  try {
    const res = await apiPost(`${API_BASE}/brands/${brandId}/master-menu`, item);
    return res.data || null;
  } catch { return null; }
}

// Add/Update Override
export async function upsertOverride(
  outletId: string, 
  masterMenuItemId: string, 
  price?: number, 
  active?: boolean
): Promise<OutletOverride | null> {
  try {
    const res = await apiPost(`${API_BASE}/outlets/${outletId}/menu-overrides/${masterMenuItemId}`, { price, active });
    return res.data || null;
  } catch { return null; }
}

// Dynamically calculates the Effective Menu for an outlet
export async function getEffectiveMenu(restaurantId: string): Promise<MenuItem[]> {
  try {
    const res = await apiGet(`${API_BASE}/restaurants/${restaurantId}/catalog/items`);
    return res.data || [];
  } catch { return []; }
}

export async function addMenuItem(restaurantId: string, item: Partial<MenuItem>): Promise<MenuItem | null> {
  try {
    const res = await apiPost(`${API_BASE}/restaurants/${restaurantId}/menu`, item);
    return res.data || null;
  } catch { return null; }
}

export async function updateMenuItem(restaurantId: string, itemId: string, item: Partial<MenuItem>): Promise<MenuItem | null> {
  try {
    const res = await apiPut(`${API_BASE}/restaurants/${restaurantId}/menu/${itemId}`, item);
    return res.data || null;
  } catch { return null; }
}

export async function deleteMenuItem(restaurantId: string, itemId: string): Promise<boolean> {
  try {
    await apiDelete(`${API_BASE}/restaurants/${restaurantId}/menu/${itemId}`);
    return true;
  } catch { return false; }
}
