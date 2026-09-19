// The review feature's public surface. Everything else in this folder is internal to it.
export { StarRating } from './components/StarRating';
export { InlineRating } from './components/InlineRating';
export { RatingSummary } from './components/RatingSummary';
export { ReviewList } from './components/ReviewList';
export { MyReviewsList } from './components/MyReviewsList';
export { ReviewsPanel } from './components/ReviewsPanel';
export { DriverRatingCard } from './components/DriverRatingCard';
export { DishRatingsPanel } from './components/DishRatingsPanel';
export { AdminReviewsView } from './components/AdminReviewsView';
export { default as RateOrderModal } from './components/RateOrderModal';

export { useEntityAggregate } from './model/useEntityAggregate';
export { useEntityAggregates } from './model/useEntityAggregates';
export type { AggregateSummary } from './model/useEntityAggregates';
export { useEntityReviews } from './model/useEntityReviews';
export { useMyReviews } from './model/useMyReviews';
export { useOrderReviewEligibility } from './model/useOrderReviewEligibility';

export { authorLabel, isAlreadyReviewed, reviewRejectionCopy, shortDate } from './model/reviewCopy';
export type {
  Review,
  ReviewAggregate,
  ReviewDetail,
  ReviewEligibility,
  ReviewEntityType,
  ReviewEntry,
  ReviewTarget,
} from './model/types';
export { toAverage } from './model/types';
