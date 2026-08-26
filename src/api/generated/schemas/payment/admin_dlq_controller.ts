import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const SortObject = z
  .object({
    direction: z.string(),
    nullHandling: z.string(),
    ascending: z.boolean(),
    property: z.string(),
    ignoreCase: z.boolean(),
  })
  .partial()
  .passthrough();
const PageableObject = z
  .object({
    sort: z.array(SortObject),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
    offset: z.number().int(),
  })
  .partial()
  .passthrough();
const OutboxEventEntity = z
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
      "PAYMENT_PARTIALLY_REFUNDED",
      "ORDER_PARTIALLY_REFUNDED",
      "LEDGER_TRANSACTION_REQUEST",
      "LEDGER_TRANSACTION_FAILED",
      "LEDGER_REVERSAL_REQUEST",
      "LEDGER_BULK_TRANSACTION_REQUEST",
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
      "REFUND_GENERATED",
      "REVERSAL_GENERATED",
      "EARNINGS_GENERATED",
      "PAYOUT_GENERATED",
      "CHAT_REFUND_QUOTE_REQUESTED",
      "CHAT_REFUND_REQUESTED",
      "CHAT_REFUND_QUOTE_RESPONSE",
      "CHAT_REFUND_DECISION",
      "CHAT_REFUND_ERROR",
      "REVIEW_CREATED",
    ]),
    idempotencyKey: z.string(),
    payload: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    status: z.enum(["UNPROCESSED", "PROCESSED", "FAILED", "DLQ"]),
    processedAt: z.string().datetime({ offset: true }),
    errorMessage: z.string(),
    retryCount: z.number().int(),
    new: z.boolean(),
  })
  .partial()
  .passthrough();
const PageOutboxEventEntity = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    size: z.number().int(),
    content: z.array(OutboxEventEntity),
    number: z.number().int(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  SortObject,
  PageableObject,
  OutboxEventEntity,
  PageOutboxEventEntity,
  ApiResponseString,
};

const endpoints = makeApi([
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
    response: PageOutboxEventEntity,
  },
]);

export const Admin_dlq_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
