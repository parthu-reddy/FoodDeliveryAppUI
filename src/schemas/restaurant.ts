import { z } from 'zod';

export const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  cuisine: z.string(),
  rating: z.number(),
  reviewsCount: z.number(),
  deliveryTime: z.number(), // in mins
  deliveryFee: z.number(),
  tags: z.array(z.string()),
  distance: z.number(), // in km
  brandId: z.string().optional(),
  brandName: z.string().optional(),
  isSponsored: z.boolean().optional(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adData: z.any().optional(),
}).passthrough();

export type Restaurant = z.infer<typeof restaurantSchema>;

export const masterMenuItemSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  name: z.string(),
  basePrice: z.number(),
  packingCharge: z.number().optional(),
  defaultPrepTimeMinutes: z.number(),
  imageUrl: z.string(),
  category: z.string(),
  description: z.string(),
  isVeg: z.boolean(),
}).passthrough();

export type MasterMenuItem = z.infer<typeof masterMenuItemSchema>;

export const outletOverrideSchema = z.object({
  id: z.string(),
  outletId: z.string(),
  masterMenuItemId: z.string(),
  overriddenPrice: z.number().optional(),
  isAvailable: z.boolean().optional(),
  overriddenPrepTimeMinutes: z.number().optional(),
}).passthrough();

export type OutletOverride = z.infer<typeof outletOverrideSchema>;

export const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  gstin: z.string(),
  pan: z.string(),
  cin: z.string(),
  bankAccountNumber: z.string(),
  ifscCode: z.string(),
  logoUrl: z.string(),
  owner: z.string(),
  createdAt: z.string(),
}).passthrough();

export type Brand = z.infer<typeof brandSchema>;

export const outletSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  name: z.string(),
  fssaiLicenseNumber: z.string(),
  lat: z.number(),
  lng: z.number(),
  timings: z.array(z.object({
    openingTime: z.string(),
    closingTime: z.string()
  })).optional(),
  bannerUrl: z.string(),
  defaultPrepTimeSeconds: z.number().optional(),
  createdAt: z.string(),
}).passthrough();

export type Outlet = z.infer<typeof outletSchema>;
