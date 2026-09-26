import type { ReviewEntityType } from './types';
import { formatDate } from '@/shared/time';

/**
 * What a review is about, in words. `MyReviewsList` held the only copy; `RateOrderModal`
 * rendered the icon with no label beside it at all.
 */
export const ENTITY_LABEL: Record<ReviewEntityType, string> = {
  RESTAURANT: 'Restaurant',
  DRIVER: 'Delivery partner',
  PRODUCT: 'Dish',
};

/**
 * Server rejection reasons, in words a customer can act on.
 *
 * The API returns these as `ApiResponse.errorCode` (see `ReviewRejectionReason` on the service
 * side). Showing the enum name, or a generic "something went wrong", would leave someone staring at
 * a missing button with no idea whether to wait, retry, or give up.
 */
export type ReviewRejectionReason =
  | 'ORDER_NOT_FOUND'
  | 'NOT_YOUR_ORDER'
  | 'ORDER_NOT_DELIVERED'
  | 'REVIEW_WINDOW_CLOSED'
  | 'TARGET_NOT_ON_ORDER'
  | 'ALREADY_REVIEWED'
  | 'DUPLICATE_ENTRY';

const COPY: Record<ReviewRejectionReason, string> = {
  ORDER_NOT_FOUND: "We couldn't find this order.",
  NOT_YOUR_ORDER: 'This order belongs to a different account.',
  ORDER_NOT_DELIVERED: "You can leave a review once this order has been delivered.",
  REVIEW_WINDOW_CLOSED: 'The review window for this order has closed.',
  TARGET_NOT_ON_ORDER: "That wasn't part of this order.",
  ALREADY_REVIEWED: "You've already reviewed this — reviews can't be changed once submitted.",
  DUPLICATE_ENTRY: 'That was rated twice in the same submission.',
};

export function reviewRejectionCopy(reason: string | null | undefined): string {
  if (!reason) return 'This order cannot be reviewed right now.';
  return COPY[reason as ReviewRejectionReason] ?? 'This order cannot be reviewed right now.';
}

/** True when the server is telling us the review already exists, not that something broke. */
export function isAlreadyReviewed(reason: string | null | undefined): boolean {
  return reason === 'ALREADY_REVIEWED';
}

/** "Priya R." — or a neutral stand-in when the author is withheld or unknown. */
export function authorLabel(authorDisplayName: string | null | undefined): string {
  return authorDisplayName?.trim() || 'A customer';
}

/** "14 Sept" — the date a review was written, or a window closes. */
export function shortDate(iso: string | null | undefined): string {
  return formatDate(iso);
}
