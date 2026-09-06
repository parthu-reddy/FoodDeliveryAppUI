import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const WebhookDelivery = z
  .object({
    id: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int(),
    gatewayName: z.enum(["RAZORPAY", "CASHFREE", "VYAPAR"]),
    eventId: z.string(),
    eventType: z.string(),
    payload: z.string(),
    processingStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "DEAD_LETTER"]),
    errorLog: z.string(),
  })
  .partial()
  .passthrough();
export const PageResponseDtoWebhookDelivery = z
  .object({
    content: z.array(WebhookDelivery),
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
export const OutboxEventEntity = z
  .object({
    id: z.string().uuid(),
    aggregateType: z.enum([
      "ORDER",
      "PAYMENT",
      "NOTIFICATION",
      "OUTLET",
      "BRAND",
      "LEDGER",
      "ADVERTISEMENT",
      "WALLET",
      "CHAT_SESSION",
      "REVIEW",
    ]),
    aggregateId: z.string(),
    eventType: z.enum([
      "ORDER_CREATED",
      "ORDER_PAID",
      "ORDER_PLACED_COD",
      "ORDER_ACCEPTED",
      "ORDER_PREPARING",
      "ORDER_READY",
      "ORDER_DELIVERED",
      "ORDER_REJECTED",
      "ORDER_AT_RESTAURANT",
      "ORDER_STATUS_UPDATED",
      "ORDER_STATUS_SYNC",
      "ORDER_CANCELLED",
      "ORDER_CANCELLED_BY_RESTAURANT",
      "ORDER_CANCELLED_BY_CUSTOMER",
      "ORDER_CANCELLED_BY_ADMIN",
      "ORDER_DELAY_APPROVAL_REQUESTED",
      "ORDER_DELAY_APPROVED",
      "ORDER_DELAY_REJECTED",
      "DISPATCH_CANDIDATE_FOUND",
      "DISPATCH_FAILED",
      "DRIVER_ASSIGNED",
      "ORDER_DRIVER_REJECTED",
      "MANUAL_INTERVENTION_REQUIRED",
      "FORCE_ASSIGN_DRIVER",
      "DELIVERY_FAILED",
      "NOTIFICATION_REQUEST",
      "NOTIFICATION_DISPATCH",
      "PAYMENT_WEBHOOK",
      "PAYMENT_COMPLETED",
      "PAYMENT_FAILED",
      "PAYMENT_REFUNDED",
      "PAYMENT_REFUND_REQUESTED",
      "PAYMENT_REFUND_FAILED",
      "REFUND_REQUESTED",
      "REFUND_FAILED",
      "PAYMENT_PARTIALLY_REFUNDED",
      "ORDER_PARTIALLY_REFUNDED",
      "LEDGER_TRANSACTION_REQUEST",
      "OUTLET_ACTIVATED",
      "MENU_UPDATED",
      "OUTLET_DEACTIVATED",
      "BRAND_CREATED",
      "AD_CAMPAIGN_CREATED",
      "AD_CAMPAIGN_UPDATED",
      "AD_CAMPAIGN_PAUSED",
      "AD_CAMPAIGN_RESUMED",
      "AD_CAMPAIGN_COMPLETED",
      "AD_CAMPAIGN_DELETED",
      "AD_CREATIVE_PENDING",
      "AD_CREATIVE_APPROVED",
      "AD_CREATIVE_REJECTED",
      "AD_CAMPAIGN_BUDGET_EXHAUSTED",
      "AD_CAMPAIGN_PACING_UPDATED",
      "AD_IMPRESSION_BILLED",
      "AD_CLICK_BILLED",
      "AD_CONVERSION_BILLED",
      "AD_WALLET_TOPUP_REQUEST",
      "AD_WALLET_TOPUP_COMPLETED",
      "AD_BUDGET_ALERT",
      "CHAT_REFUND_QUOTE_REQUESTED",
      "CHAT_REFUND_REQUESTED",
      "CHAT_REFUND_QUOTE_RESPONSE",
      "CHAT_REFUND_DECISION",
      "CHAT_REFUND_ERROR",
      "REVIEW_CREATED",
    ]),
    idempotencyKey: z.string().optional(),
    payload: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    status: z.enum(["UNPROCESSED", "PROCESSED", "FAILED", "DLQ"]),
    processedAt: z.string().datetime({ offset: true }).optional(),
    errorMessage: z.string().optional(),
    retryCount: z.number().int(),
    new: z.boolean().optional(),
  })
  .passthrough();
export const PageResponseDtoOutboxEventEntity = z
  .object({
    content: z.array(OutboxEventEntity),
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
export const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  WebhookDelivery,
  PageResponseDtoWebhookDelivery,
  OutboxEventEntity,
  PageResponseDtoOutboxEventEntity,
  ApiResponseString,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/payments/dlq/webhooks/:eventId/retry",
    alias: "retryWebhookEvent",
    requestFormat: "json",
    parameters: [
      {
        name: "eventId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/payments/dlq/retry",
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
      {
        name: "eventId",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/payments/dlq/outbox/:eventId/retry",
    alias: "retryOutboxDlqEvent",
    requestFormat: "json",
    parameters: [
      {
        name: "eventId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/payments/dlq/webhooks",
    alias: "getFailedWebhooks",
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
    response: PageResponseDtoWebhookDelivery,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/payments/dlq/outbox",
    alias: "getOutboxDlqEvents",
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
    response: PageResponseDtoOutboxEventEntity,
  },
]);

export const Admin_dlq_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
