import { z } from "zod";

export const WalletDto = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: z.enum([
      "CUSTOMER",
      "RESTAURANT",
      "DRIVER",
      "PLATFORM",
      "ADVERTISER",
    ]),
    balance: z.number(),
    currency: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  })
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
    sort: z.array(SortObject).optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .passthrough();
