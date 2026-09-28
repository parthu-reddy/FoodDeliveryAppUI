import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const ReviewDto = z
  .object({
    id: z.string().uuid(),
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    entityId: z.string(),
    rating: z.number().int(),
    comment: z.string().optional(),
    authorDisplayName: z.string().optional(),
    authorRole: z.enum(["CUSTOMER", "RESTAURANT", "DELIVERY"]).optional(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageMetadata = z
  .object({
    size: z.number().int(),
    number: z.number().int(),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
  })
  .passthrough();
export const PagedModelReviewDto = z
  .object({ content: z.array(ReviewDto), page: PageMetadata.optional() })
  .passthrough();
export const ApiResponsePagedModelReviewDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PagedModelReviewDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ReviewEntryRequest = z
  .object({
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    entityId: z.string(),
    rating: z.number().int().gte(1).lte(5),
    comment: z.string().min(0).max(1000).optional(),
  })
  .passthrough();
export const CreateReviewRequest = z
  .object({
    orderId: z.string().uuid(),
    entries: z.array(ReviewEntryRequest).max(20),
  })
  .passthrough();
export const ReviewDetailDto = z
  .object({
    id: z.string().uuid(),
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    entityId: z.string(),
    orderId: z.string().uuid(),
    userId: z.string(),
    authorRole: z.enum(["CUSTOMER", "RESTAURANT", "DELIVERY"]),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    authorDisplayName: z.string().optional(),
    rating: z.number().int(),
    comment: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseListReviewDetailDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(ReviewDetailDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ReviewTargetDto = z
  .object({
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    entityId: z.string(),
    displayName: z.string(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    alreadyReviewed: z.boolean(),
    existingRating: z.number().int().optional(),
    existingComment: z.string().optional(),
    existingReviewedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
export const ReviewEligibilityDto = z
  .object({
    orderId: z.string().uuid(),
    reviewable: z.boolean(),
    reason: z
      .enum([
        "ORDER_NOT_FOUND",
        "NOT_YOUR_ORDER",
        "ORDER_NOT_DELIVERED",
        "REVIEW_WINDOW_CLOSED",
        "TARGET_NOT_ON_ORDER",
        "ALREADY_REVIEWED",
        "DUPLICATE_ENTRY",
        "ROLE_TARGET_NOT_ALLOWED",
        "SELF_REVIEW",
      ])
      .optional(),
    reasonDetail: z.string().optional(),
    windowClosesAt: z.string().datetime({ offset: true }).optional(),
    targets: z.array(ReviewTargetDto),
  })
  .passthrough();
export const ApiResponseReviewEligibilityDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: ReviewEligibilityDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ReviewReceivedDto = z
  .object({
    id: z.string().uuid(),
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    entityId: z.string(),
    authorRole: z.enum(["CUSTOMER", "RESTAURANT", "DELIVERY"]),
    rating: z.number().int(),
    comment: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PagedModelReviewReceivedDto = z
  .object({
    content: z.array(ReviewReceivedDto),
    page: PageMetadata.optional(),
  })
  .passthrough();
export const ApiResponsePagedModelReviewReceivedDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PagedModelReviewReceivedDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PagedModelReviewDetailDto = z
  .object({ content: z.array(ReviewDetailDto), page: PageMetadata.optional() })
  .passthrough();
export const ApiResponsePagedModelReviewDetailDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PagedModelReviewDetailDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ReviewAggregateDto = z
  .object({
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    entityId: z.string(),
    totalReviews: z.number().int(),
    averageRating: z.number(),
  })
  .passthrough();
export const AggregateBatchDto = z
  .object({
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    aggregates: z.array(ReviewAggregateDto),
  })
  .passthrough();
export const ApiResponseAggregateBatchDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: AggregateBatchDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseReviewAggregateDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: ReviewAggregateDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
