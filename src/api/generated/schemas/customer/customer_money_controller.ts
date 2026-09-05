import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { RefundView } from "./common";

const ReceiptItem = z
  .object({ name: z.string(), quantity: z.number().int(), price: z.number() })
  .partial()
  .passthrough();
const CustomerReceipt = z
  .object({
    items: z.array(ReceiptItem),
    itemTotal: z.number(),
    deliveryFee: z.number(),
    platformFee: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    total: z.number(),
    paymentMethod: z.string(),
    paidAt: z.string().datetime({ offset: true }),
    refunds: z.array(RefundView),
    storeCreditUsed: z.number(),
  })
  .partial()
  .passthrough();

export const schemas = {
  ReceiptItem,
  CustomerReceipt,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/money/customer/refunds",
    alias: "getMyRefunds",
    requestFormat: "json",
    response: z.array(RefundView),
  },
  {
    method: "get",
    path: "/api/v1/money/customer/orders/:orderId/refunds",
    alias: "getOrderRefunds",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(RefundView),
  },
  {
    method: "get",
    path: "/api/v1/money/customer/orders/:orderId/receipt",
    alias: "getReceipt",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CustomerReceipt,
  },
]);

export const Customer_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
