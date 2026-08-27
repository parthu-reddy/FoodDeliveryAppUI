import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const CampaignResponse = z
  .object({
    id: z.string().uuid(),
    advertiserId: z.string().uuid(),
    name: z.string(),
    status: z.enum([
      "DRAFT",
      "SCHEDULED",
      "ACTIVE",
      "PAUSED",
      "COMPLETED",
      "ARCHIVED",
      "DELETED",
    ]),
    dailyBudget: z.number(),
    lifetimeBudget: z.number(),
    maxBid: z.number(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }),
    frequencyCap: z.number().int(),
    version: z.number().int(),
  })
  .partial()
  .passthrough();
export const ApiResponseCampaignResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: CampaignResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const CampaignRequest = z
  .object({
    advertiserId: z.string().uuid(),
    name: z.string().min(0).max(255),
    dailyBudget: z.number(),
    lifetimeBudget: z.number().optional(),
    maxBid: z.number(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }).optional(),
    frequencyCap: z.number().int().optional(),
  })
  .passthrough();
export const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.object({}).partial().passthrough().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const GeoTargeting = z
  .object({ regions: z.array(z.string()).max(400) })
  .partial()
  .passthrough();
export const Daypart = z
  .object({ dayOfWeek: z.string(), startTime: z.string(), endTime: z.string() })
  .partial()
  .passthrough();
export const DaypartingConfig = z
  .object({ dayparts: z.array(Daypart).max(400) })
  .partial()
  .passthrough();
export const ContextualKeywords = z
  .object({ keywords: z.array(z.string()).max(400) })
  .partial()
  .passthrough();
export const AdGroupResponse = z
  .object({
    id: z.string().uuid(),
    campaignId: z.string().uuid(),
    name: z.string(),
    geoTargeting: GeoTargeting,
    daypartingConfig: DaypartingConfig,
    contextualKeywords: ContextualKeywords,
    brandSafetyBlocklist: z.array(z.string()),
    active: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const ApiResponseAdGroupResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: AdGroupResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const AdGroupRequest = z
  .object({
    name: z.string(),
    geoTargeting: GeoTargeting.optional(),
    daypartingConfig: DaypartingConfig.optional(),
    contextualKeywords: ContextualKeywords.optional(),
    brandSafetyBlocklist: z.array(z.string()).optional(),
    active: z.boolean().optional(),
  })
  .passthrough();
export const CampaignPacingDTO = z
  .object({
    dailyBudget: z.number(),
    lifetimeBudget: z.number(),
    advertiserId: z.string().uuid(),
  })
  .partial()
  .passthrough();
export const AdvertiserResponse = z
  .object({
    id: z.string().uuid(),
    userId: z.string(),
    companyName: z.string(),
    externalRef: z.string(),
    walletBalanceId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const ApiResponseAdvertiserResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: AdvertiserResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const AdvertiserRegistrationRequest = z
  .object({ companyName: z.string(), externalRef: z.string().optional() })
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
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(CampaignResponse),
    first: z.boolean(),
    last: z.boolean(),
    numberOfElements: z.number().int(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const ApiResponsePageCampaignResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageCampaignResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageAdGroupResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(AdGroupResponse),
    first: z.boolean(),
    last: z.boolean(),
    numberOfElements: z.number().int(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const ApiResponsePageAdGroupResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageAdGroupResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const AdCreativeResponse = z
  .object({
    id: z.string().uuid(),
    adGroupId: z.string().uuid(),
    format: z.enum(["BANNER", "CAROUSEL", "VIDEO", "VIDEO_VAST", "NATIVE"]),
    assetUrl: z.string(),
    vastXml: z.string(),
    auditStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const ApiResponseListAdCreativeResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(AdCreativeResponse).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const AdCreativeRequest = z
  .object({
    format: z.enum(["BANNER", "CAROUSEL", "VIDEO", "VIDEO_VAST", "NATIVE"]),
    assetUrl: z.string().optional(),
    vastXml: z.string().optional(),
  })
  .passthrough();
export const ApiResponseAdCreativeResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: AdCreativeResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const TopupWalletRequest = z
  .object({ amount: z.number(), gatewayName: z.string().optional() })
  .passthrough();
export const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.record(z.string()).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const CampaignPerformanceResponse = z
  .object({
    id: z.string().uuid(),
    advertiserId: z.string().uuid(),
    campaignId: z.string().uuid(),
    date: z.string(),
    impressions: z.number().int(),
    clicks: z.number().int(),
    conversions: z.number().int(),
    spend: z.number(),
  })
  .partial()
  .passthrough();
export const PageCampaignPerformanceResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(CampaignPerformanceResponse),
    first: z.boolean(),
    last: z.boolean(),
    numberOfElements: z.number().int(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const ApiResponsePageCampaignPerformanceResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageCampaignPerformanceResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const Pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
