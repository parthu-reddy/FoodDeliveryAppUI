import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const DispatchOrderRequest = z
  .object({
    cityId: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    restaurantCoords: z
      .string()
      .min(0)
      .max(50)
      .regex(
        /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
      ),
  })
  .passthrough();
export const SetAvailabilityRequest = z
  .object({
    cityId: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    driverId: z
      .string()
      .min(0)
      .max(36)
      .regex(/^[0-9a-fA-F\-]{36}$/),
    available: z.boolean(),
  })
  .passthrough();
export const UpdateLocationRequest = z
  .object({
    cityId: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    driverId: z
      .string()
      .min(0)
      .max(36)
      .regex(/^[0-9a-fA-F\-]{36}$/),
    lat: z.number(),
    lng: z.number(),
  })
  .passthrough();
export const ReverseGeocodeResponse = z
  .object({ address: z.string() })
  .partial()
  .passthrough();
export const AutocompleteResponse = z
  .object({ description: z.string(), placeId: z.string() })
  .partial()
  .passthrough();
export const RoutePolylineDto = z
  .object({
    polyline: z.string(),
    distance: z.string(),
    duration: z.string(),
    steps: z.array(z.record(z.object({}).partial().passthrough())),
  })
  .partial()
  .passthrough();
export const ApiResponseRoutePolylineDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: RoutePolylineDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
