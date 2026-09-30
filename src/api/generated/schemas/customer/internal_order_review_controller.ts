import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const OrderReviewTargetAuthorizationRequest = z
  .object({
    targetType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    targetId: z.string(),
  })
  .passthrough();
export const OrderReviewAuthorizationRequest = z
  .object({
    reviewerId: z.string().uuid(),
    reviewerRole: z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"]),
    targets: z.array(OrderReviewTargetAuthorizationRequest).max(100),
  })
  .passthrough();
export const OrderReviewAuthorizationResult = z
  .object({
    targetType: z.enum(["RESTAURANT", "DRIVER", "PRODUCT", "CUSTOMER"]),
    targetId: z.string(),
    allowed: z.boolean(),
    reasonCode: z.string(),
  })
  .partial()
  .passthrough();
export const ApiResponseListOrderReviewAuthorizationResult = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(OrderReviewAuthorizationResult).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  OrderReviewTargetAuthorizationRequest,
  OrderReviewAuthorizationRequest,
  OrderReviewAuthorizationResult,
  ApiResponseListOrderReviewAuthorizationResult,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/orders/:orderId/review-authorizations",
    alias: "authorizeTargets",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OrderReviewAuthorizationRequest,
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseListOrderReviewAuthorizationResult,
  },
]);

export const Internal_order_review_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
