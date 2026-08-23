import { z } from "zod";

export const LocalTime = z
  .object({
    hour: z.number().int(),
    minute: z.number().int(),
    second: z.number().int(),
    nano: z.number().int(),
  })
  .partial()
  .passthrough();
export const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({}).partial().passthrough(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const MasterMenuItem = z
  .object({
    id: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    name: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    basePrice: z.number(),
    packingCharge: z.number().gte(0).lt(10),
    defaultPrepTimeMinutes: z.number().int().optional(),
    version: z.number().int().optional(),
  })
  .passthrough();
export const ApiResponseListMasterMenuItem = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(MasterMenuItem),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const ApiResponseMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.object({}).partial().passthrough()),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const SortObject = z
  .object({
    direction: z.string(),
    nullHandling: z.string(),
    ascending: z.boolean(),
    property: z.string(),
    ignoreCase: z.boolean(),
  })
  .partial()
  .passthrough();
export const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: z.array(SortObject),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .partial()
  .passthrough();
