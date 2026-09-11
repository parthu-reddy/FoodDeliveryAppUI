import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

export const FailedRefundDto = z
  .object({
    refundId: z.string().uuid(),
    orderId: z.string().uuid(),
    amount: z.number(),
    status: z.enum([
      "REQUESTED",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ]),
    errorMessage: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    customerName: z.string().uuid(),
    restaurantId: z.string().uuid(),
    orderStatus: z.enum([
      "CREATED",
      "PENDING_ACCEPTANCE",
      "AWAITING_DELAY_APPROVAL",
      "ACCEPTED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "HANDED_OVER",
      "CANCELLED",
      "CANCELLED_BY_RESTAURANT",
      "CANCELLED_BY_PLATFORM",
      "DELIVERY_FAILED",
    ]),
    totalAmount: z.number(),
  })
  .partial()
  .passthrough();
export const PageResponseDtoFailedRefundDto = z
  .object({
    content: z.array(FailedRefundDto),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();

export const schemas = {
  FailedRefundDto,
  PageResponseDtoFailedRefundDto,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/dlq/retry",
    alias: "retryDlqEvent",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
      {
        name: "topic",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/dlq/refunds/:refundId/retry",
    alias: "retryRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "refundId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/dlq/refunds",
    alias: "getFailedRefunds",
    requestFormat: "json",
    parameters: [
      {
        name: "page",
        type: "Query",
        schema: z.number().int().optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
    ],
    response: PageResponseDtoFailedRefundDto,
  },
]);

export const Admin_dlq_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
