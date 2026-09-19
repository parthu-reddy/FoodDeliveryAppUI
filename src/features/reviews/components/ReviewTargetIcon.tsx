import { Bike, Store, UtensilsCrossed } from 'lucide-react';
import type { ReviewEntityType } from '../model/types';

/**
 * The icon for what a review is about.
 *
 * `MyReviewsList` and `RateOrderModal` had each written this as an if-chain ending in a
 * fall-through default, so a fourth entity type would silently have rendered as a dish. A
 * total `Record` over the union makes that a compile error instead.
 *
 * `RESTAURANT` here is a review *target*, not a user role — the strings collide but the
 * meanings do not. Keying a map rather than comparing a literal says which one it is.
 */

const ICON: Record<ReviewEntityType, typeof Store> = {
  RESTAURANT: Store,
  DRIVER: Bike,
  PRODUCT: UtensilsCrossed,
};

interface ReviewTargetIconProps {
  entityType: ReviewEntityType;
  className?: string;
}

export function ReviewTargetIcon({ entityType, className = 'h-3.5 w-3.5' }: ReviewTargetIconProps) {
  const Icon = ICON[entityType];
  return <Icon className={className} />;
}
