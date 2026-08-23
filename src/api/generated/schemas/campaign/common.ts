import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const CampaignRequest = z
  .object({
    advertiserId: z.string().uuid(),
    name: z.string(),
    dailyBudget: z.number(),
    lifetimeBudget: z.number(),
    maxBid: z.number(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
export const CampaignResponse = z
  .object({
    id: z.string().uuid(),
    advertiserId: z.string().uuid(),
    name: z.string(),
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
    dailyBudget: z.number(),
    lifetimeBudget: z.number(),
    maxBid: z.number(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }),
    version: z.number().int(),
  })
  .partial()
  .passthrough();
export const CampaignPacingDTO = z
  .object({ dailyBudget: z.number(), advertiserId: z.string().uuid() })
  .partial()
  .passthrough();
export const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
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
export const PageCampaignResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CampaignResponse),
    number: z.number().int(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    last: z.boolean(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const CampaignPerformance = z
  .object({
    id: z.string().uuid(),
    campaignId: z.string().uuid(),
    advertiserId: z.string().uuid(),
    date: z.string(),
    impressions: z.number().int(),
    clicks: z.number().int(),
    conversions: z.number().int(),
    spend: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const Pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
export const TopupWalletRequest = z.object({ amount: z.number() }).passthrough();
