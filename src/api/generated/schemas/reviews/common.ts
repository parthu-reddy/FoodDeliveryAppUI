import { z } from "zod";

export const PageMetadata = z
  .object({
    size: z.number().int(),
    number: z.number().int(),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
  })
  .passthrough();
export const ReviewDetailDto = z
  .object({
    id: z.string().uuid(),
    entityType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
    entityId: z.string(),
    orderId: z.string().uuid(),
    userId: z.string(),
    authorDisplayName: z.string().optional(),
    rating: z.number().int(),
    comment: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
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
