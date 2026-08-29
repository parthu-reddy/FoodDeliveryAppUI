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
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: SortObject.optional(),
    unpaged: z.boolean(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
  })
  .passthrough();
