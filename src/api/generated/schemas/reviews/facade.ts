import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_review } from './review_controller';
import { createApiClient as create_adminReview } from './admin_review_controller';

export function createReviewsFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  review: create_review(baseUrl, options),
  adminReview: create_adminReview(baseUrl, options),
  };
}
