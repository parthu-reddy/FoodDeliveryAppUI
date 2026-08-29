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
    endDate: z.string().datetime({ offset: true }).optional(),
    frequencyCap: z.number().int(),
    version: z.number().int(),
  })
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
  .passthrough();
export const Daypart = z
  .object({ dayOfWeek: z.string(), startTime: z.string(), endTime: z.string() })
  .passthrough();
export const DaypartingConfig = z
  .object({ dayparts: z.array(Daypart).max(400) })
  .passthrough();
export const ContextualKeywords = z
  .object({ keywords: z.array(z.string()).max(400) })
  .passthrough();
export const AdGroupResponse = z
  .object({
    id: z.string().uuid(),
    campaignId: z.string().uuid(),
    name: z.string(),
    geoTargeting: GeoTargeting.optional(),
    daypartingConfig: DaypartingConfig.optional(),
    contextualKeywords: ContextualKeywords.optional(),
    brandSafetyBlocklist: z.array(z.string()).optional(),
    active: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
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
    dailyBudget: z.number().optional(),
    lifetimeBudget: z.number().optional(),
    advertiserId: z.string().uuid(),
  })
  .passthrough();
export const AdvertiserResponse = z
  .object({
    id: z.string().uuid(),
    userId: z.string(),
    companyName: z.string(),
    externalRef: z.string().optional(),
    walletBalanceId: z.string().uuid().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
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
export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: SortObject,
  })
  .partial()
  .passthrough();
export const PageableObject = z
  .object({
    offset: z.number().int(),
    unpaged: z.boolean(),
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
  })
  .passthrough();
export const PageCampaignResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CampaignResponse),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
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
    size: z.number().int(),
    content: z.array(AdGroupResponse),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
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
    vastXml: z.string().optional(),
    auditStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
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
    impressions: z.number().int().optional(),
    clicks: z.number().int().optional(),
    conversions: z.number().int().optional(),
    spend: z.number(),
  })
  .passthrough();
export const PageCampaignPerformanceResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CampaignPerformanceResponse),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
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
    sort: SortObject,
  })
  .partial()
  .passthrough();
