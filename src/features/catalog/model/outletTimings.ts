import { z } from 'zod';

/**
 * An outlet's operating shift.
 *
 * In its own module because a file that exports both a component and a value breaks React
 * Fast Refresh — the same reason `surfaceStyle.ts` sits beside `Surface.tsx`.
 */
export interface OutletTiming {
  openingTime: string;
  closingTime: string;
}

export const DEFAULT_TIMING: OutletTiming = { openingTime: "09:00", closingTime: "23:00" };

/** What the server will accept as a new outlet. */
export const outletSchema = z.object({
  name: z.string().min(1, 'Outlet name is required.').max(100, 'Outlet name cannot exceed 100 characters.'),
  fssai: z.string().length(14, 'FSSAI License must be exactly 14 characters.'),
  banner: z.string().url('Invalid Banner URL.').max(1000, 'Banner URL cannot exceed 1000 characters.').optional().or(z.literal('')),
  lat: z.number().min(-90, 'Invalid Latitude').max(90, 'Invalid Latitude'),
  lng: z.number().min(-180, 'Invalid Longitude').max(180, 'Invalid Longitude')
});
