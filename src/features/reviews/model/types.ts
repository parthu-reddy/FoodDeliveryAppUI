import type { infer as ZodInfer } from 'zod';
import type {
  ReviewAggregateDto,
  ReviewDetailDto,
  ReviewDto,
  ReviewEligibilityDto,
  ReviewEntryRequest,
  ReviewReceivedDto,
  ReviewTargetDto,
} from '@/api/generated/schemas/reviews/common';

/** API contracts are inferred from the OpenAPI-generated Zod schemas. */
export type Review = ZodInfer<typeof ReviewDto>;
export type ReviewDetail = ZodInfer<typeof ReviewDetailDto>;
export type ReviewReceived = ZodInfer<typeof ReviewReceivedDto>;
export type ReviewAggregate = ZodInfer<typeof ReviewAggregateDto>;
export type ReviewTarget = ZodInfer<typeof ReviewTargetDto>;
export type ReviewEligibility = ZodInfer<typeof ReviewEligibilityDto>;
export type ReviewEntry = ZodInfer<typeof ReviewEntryRequest>;
export type ReviewEntityType = Review['entityType'];
export type ReviewVisibility = ReviewTarget['visibility'];
export type ReviewAuthorRole = ReviewDetail['authorRole'];
export type ReviewRejectionReason = NonNullable<ReviewEligibility['reason']>;

/** `averageRating` comes from a decimal aggregate; accept both JSON number and decimal string. */
export function toAverage(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
