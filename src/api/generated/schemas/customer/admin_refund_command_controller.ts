import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { RefundView } from "./common";

export const RefundItemRequest = z
  .object({
    orderItemId: z.string().uuid(),
    quantity: z.number().int().optional(),
  })
  .passthrough();
export const AdminRefundRequest = z
  .object({
    orderId: z.string().uuid(),
    items: z.array(RefundItemRequest).max(100),
    faultType: z.enum([
      "PLATFORM_FAULT",
      "RESTAURANT_FAULT",
      "RIDER_FAULT",
      "CUSTOMER_FAULT",
      "UNKNOWN",
    ]),
    reasonText: z.string().min(0).max(2000),
  })
  .passthrough();

export const schemas = {
  RefundItemRequest,
  AdminRefundRequest,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/refunds/request",
    alias: "requestRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AdminRefundRequest,
      },
    ],
    response: RefundView,
  },
]);

export const Admin_refund_command_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
