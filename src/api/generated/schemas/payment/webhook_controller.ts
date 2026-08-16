import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
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
    response: z.any(),
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
    response: z.any(),
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
    response: z.any(),
  },
]);

export const Webhook_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
