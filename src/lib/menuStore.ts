import { MenuItem, MasterMenuItem, OutletOverride } from '../types';

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
  openingTime: string;
  closingTime: string;
  bannerUrl: string;
  createdAt: string;
}

// Ensure fetch is absolute or relative properly. Since we serve both on 3000, we can use relative.
const API_BASE = '/api/v1';

export async function getBrands(): Promise<Brand[]> {
  const res = await fetch(`${API_BASE}/brands`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveBrands(brands: Brand[]) {
  // Mocked for now, not fully implemented in API
}

export async function getOutlets(): Promise<Outlet[]> {
  const res = await fetch(`${API_BASE}/outlets`);
  if (!res.ok) return [];
  return res.json();
}

export async function getOutletsByBrand(brandId: string): Promise<Outlet[]> {
  const res = await fetch(`${API_BASE}/brands/${brandId}/outlets`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveOutlets(outlets: Outlet[]) {
  // Mocked for now
}

export async function getMasterMenuItems(brandId: string): Promise<MasterMenuItem[]> {
  const res = await fetch(`${API_BASE}/brands/${brandId}/master-menu`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveMasterMenuItems(items: MasterMenuItem[]) {
  // Mocked
}

export async function getOutletOverrides(outletId: string): Promise<OutletOverride[]> {
  const res = await fetch(`${API_BASE}/outlets/${outletId}/menu-overrides`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveOutletOverrides(overrides: OutletOverride[]) {
  // Mocked
}

// Add Master Menu Item
export async function addMasterMenuItem(
  brandId: string, 
  name: string, 
  basePrice: number, 
  defaultPrepTimeMinutes: number, 
  imageUrl: string, 
  category = 'Burgers', 
  description = '', 
  isVeg = false
): Promise<MasterMenuItem | null> {
  const res = await fetch(`${API_BASE}/brands/${brandId}/master-menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name, basePrice, defaultPrepTimeMinutes, imageUrl, category, description, isVeg
    })
  });
  if (!res.ok) return null;
  return res.json();
}

// Add/Update Override
export async function upsertOverride(
  outletId: string, 
  masterMenuItemId: string, 
  price?: number, 
  active?: boolean
): Promise<OutletOverride | null> {
  const res = await fetch(`${API_BASE}/outlets/${outletId}/menu-overrides/${masterMenuItemId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price, active })
  });
  if (!res.ok) return null;
  return res.json();
}

// Dynamically calculates the Effective Menu for an outlet
export async function getEffectiveMenu(restaurantId: string): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/catalog/items`);
  if (!res.ok) return [];
  return res.json();
}

export async function addMenuItem(restaurantId: string, item: Partial<MenuItem>): Promise<MenuItem | null> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateMenuItem(restaurantId: string, itemId: string, item: Partial<MenuItem>): Promise<MenuItem | null> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/menu/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteMenuItem(restaurantId: string, itemId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/menu/${itemId}`, {
    method: 'DELETE'
  });
  return res.ok;
}
