import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const RefundRequest = z
  .object({
    gatewayOrderId: z.string(),
    amountInInr: z.number(),
    reason: z.string().optional(),
  })
  .passthrough();
const CreateOrderRequest = z
  .object({
    internalOrderId: z
      .string()
      .regex(
        /^([a-zA-Z0-9_]+_)?([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/
      ),
    amountInInr: z.number(),
    customerPhone: z.string().optional(),
  })
  .passthrough();
const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.string(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  RefundRequest,
  CreateOrderRequest,
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
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/payments/create-order",
    alias: "createOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateOrderRequest,
      },
      {
        name: "gateway",
        type: "Query",
        schema: z.enum(["RAZORPAY", "CASHFREE", "VYAPAR"]),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/payments/refund",
    alias: "refundOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RefundRequest,
      },
      {
        name: "gateway",
        type: "Query",
        schema: z.enum(["RAZORPAY", "CASHFREE", "VYAPAR"]),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/webhooks/cashfree",
    alias: "handleCashfreeWebhook",
    requestFormat: "json",
    parameters: [
      {
        name: "x-webhook-signature",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "x-webhook-timestamp",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "x-webhook-event-id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/webhooks/razorpay",
    alias: "handleRazorpayWebhook",
    requestFormat: "json",
    parameters: [
      {
        name: "x-razorpay-signature",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "x-razorpay-event-id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/webhooks/vyapar",
    alias: "handleVyaparWebhook",
    requestFormat: "json",
    parameters: [
      {
        name: "X-VyaparGateway-Signature",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "X-VyaparGateway-Event-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
