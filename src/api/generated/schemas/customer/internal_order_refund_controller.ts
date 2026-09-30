import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

export const Item = z
  .object({ orderItemId: z.string().uuid(), quantity: z.number().int() })
  .partial()
  .passthrough();
export const RefundCommand = z
  .object({
    orderId: z.string().uuid(),
    amount: z.number(),
    items: z.array(Item),
    reasonCode: z.string(),
    reasonText: z.string(),
    faultType: z.enum([
      "PLATFORM_FAULT",
      "RESTAURANT_FAULT",
      "RIDER_FAULT",
      "CUSTOMER_FAULT",
      "UNKNOWN",
    ]),
    destination: z.enum(["ORIGINAL_METHOD", "STORE_CREDIT", "NONE"]),
    source: z.enum([
      "CUSTOMER_TICKET",
      "RESTAURANT",
      "ADMIN",
      "SYSTEM_CANCELLATION",
      "SYSTEM_DELIVERY_FAILED",
      "SYSTEM_LATE_PAYMENT",
    ]),
    initiatorType: z.enum(["CUSTOMER", "RESTAURANT", "ADMIN", "SYSTEM"]),
    initiatorId: z.string().uuid(),
    idempotencyKey: z.string(),
    ticketId: z.string().uuid(),
  })
  .partial()
  .passthrough();

export const schemas = {
  Item,
  RefundCommand,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/orders/:orderId/partial-refund",
    alias: "initiatePartialRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RefundCommand,
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseString,
  },
]);

export const Internal_order_refund_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
