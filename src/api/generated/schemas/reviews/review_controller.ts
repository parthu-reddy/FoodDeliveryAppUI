import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageMetadata } from "./common";
import { ReviewDetailDto } from "./common";
import { ApiResponsePagedModelReviewDetailDto } from "./common";
import { PagedModelReviewDetailDto } from "./common";

export const ReviewEntryRequest = z
  .object({
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
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
export const ApiResponseListReviewDetailDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(ReviewDetailDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ReviewDto = z
  .object({
    id: z.string().uuid(),
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
    entityId: z.string(),
    rating: z.number().int(),
    comment: z.string().optional(),
    authorDisplayName: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
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
export const ReviewTargetDto = z
  .object({
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
    entityId: z.string(),
    displayName: z.string(),
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
export const ReviewAggregateDto = z
  .object({
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
    entityId: z.string(),
    totalReviews: z.number().int(),
    averageRating: z.number(),
  })
  .passthrough();
export const AggregateBatchDto = z
  .object({
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
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

export const schemas = {
  ReviewEntryRequest,
  CreateReviewRequest,
  ApiResponseListReviewDetailDto,
  ReviewDto,
  PagedModelReviewDto,
  ApiResponsePagedModelReviewDto,
  ReviewTargetDto,
  ReviewEligibilityDto,
  ApiResponseReviewEligibilityDto,
  ReviewAggregateDto,
  AggregateBatchDto,
  ApiResponseAggregateBatchDto,
  ApiResponseReviewAggregateDto,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/reviews",
    alias: "getReviews",
    requestFormat: "json",
    parameters: [
      {
        name: "entityType",
        type: "Query",
        schema: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
      },
      {
        name: "entityId",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(20),
      },
    ],
    response: ApiResponsePagedModelReviewDto,
  },
  {
    method: "post",
    path: "/api/v1/reviews",
    alias: "createReviews",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateReviewRequest,
      },
    ],
    response: ApiResponseListReviewDetailDto,
  },
  {
    method: "get",
    path: "/api/v1/reviews/orders/:orderId/eligibility",
    alias: "getEligibility",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseReviewEligibilityDto,
  },
  {
    method: "get",
    path: "/api/v1/reviews/me",
    alias: "getMyReviews",
    requestFormat: "json",
    parameters: [
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(20),
      },
    ],
    response: ApiResponsePagedModelReviewDetailDto,
  },
  {
    method: "get",
    path: "/api/v1/reviews/aggregates",
    alias: "getAggregates",
    requestFormat: "json",
    parameters: [
      {
        name: "entityType",
        type: "Query",
        schema: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
      },
      {
        name: "entityIds",
        type: "Query",
        schema: z.array(z.string()),
      },
    ],
    response: ApiResponseAggregateBatchDto,
  },
  {
    method: "get",
    path: "/api/v1/reviews/aggregate",
    alias: "getAggregate",
    requestFormat: "json",
    parameters: [
      {
        name: "entityType",
        type: "Query",
        schema: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
      },
      {
        name: "entityId",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: ApiResponseReviewAggregateDto,
  },
]);

export const Review_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
