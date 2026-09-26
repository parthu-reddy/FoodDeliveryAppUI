import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

export const DeadLetterReplayResult = z
  .object({
    topic: z.string(),
    key: z.string(),
    eventType: z.string(),
    eventId: z.string(),
  })
  .partial()
  .passthrough();
export const ApiResponseDeadLetterReplayResult = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: DeadLetterReplayResult.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
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
export const DeadLetterReplayRequest = z
  .object({
    dltTopic: z.string(),
    partition: z.number().int(),
    offset: z.number().int(),
  })
  .passthrough();

export const schemas = {
  DeadLetterReplayResult,
  ApiResponseDeadLetterReplayResult,
  FailedRefundDto,
  PageResponseDtoFailedRefundDto,
  DeadLetterReplayRequest,
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
        schema: DeadLetterReplayRequest,
      },
    ],
    response: ApiResponseDeadLetterReplayResult,
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
