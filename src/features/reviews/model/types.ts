/**
 * Shapes the review API returns.
 *
 * Declared here rather than inferred from the generated Zod schemas because `commonZodiosConfig`
 * sets `validate: false` — the generated response validators are `z.void()` for most endpoints, so
 * the inferred types carry no information. These mirror `ReviewDto`, `ReviewDetailDto`,
 * `ReviewAggregateDto`, `ReviewEligibilityDto` and `ReviewTargetDto` on the service side.
 */

export type ReviewEntityType = 'RESTAURANT' | 'DRIVER' | 'PRODUCT';

/** The public projection. Deliberately carries no `userId` and no `orderId`. */
export interface Review {
  id: string;
  entityType: ReviewEntityType;
  entityId: string;
  rating: number;
  comment?: string | null;
  /** Null for driver reviews, and when the order carried no customer name. */
  authorDisplayName?: string | null;
  createdAt: string;
}

/** The author's own view, and the admin one. */
export interface ReviewDetail extends Review {
  orderId: string;
  userId: string;
}

export interface ReviewAggregate {
  entityType: ReviewEntityType;
  entityId: string;
  totalReviews: number;
  averageRating: number | string;
}

export interface ReviewTarget {
  entityType: ReviewEntityType;
  entityId: string;
  displayName: string;
  alreadyReviewed: boolean;
  existingRating?: number | null;
  existingComment?: string | null;
  existingReviewedAt?: string | null;
}

export interface ReviewEligibility {
  orderId: string;
  reviewable: boolean;
  reason?: string | null;
  reasonDetail?: string | null;
  windowClosesAt?: string | null;
  targets: ReviewTarget[];
}

/**
 * One entry of a submission. Only targets the customer actually rated are sent.
 *
 * A `type`, not an `interface`, on purpose: it is passed straight into the generated Zodios client,
 * whose `.passthrough()` schemas infer an index signature. TypeScript gives type aliases an implicit
 * index signature and interfaces none, so an interface here would force a cast at the call site —
 * and a cast is exactly what stops a future shape change from being caught.
 */
export type ReviewEntry = {
  entityType: ReviewEntityType;
  entityId: string;
  rating: number;
  comment?: string;
};

/** `averageRating` arrives as a string from the BigDecimal on the service side. */
export function toAverage(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
