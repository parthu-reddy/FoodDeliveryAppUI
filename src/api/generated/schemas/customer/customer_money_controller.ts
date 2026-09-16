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
const WalletDto = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: z.enum(["CUSTOMER", "ADVERTISER"]),
    balance: z.number(),
    currency: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  })
  .passthrough();
const PageResponseDtoMapStringObject = z
  .object({
    content: z.array(z.record(z.object({}).partial().passthrough())),
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
  ReceiptItem,
  CustomerReceipt,
  WalletDto,
  PageResponseDtoMapStringObject,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/money/customer/wallet",
    alias: "getMyWallet",
    requestFormat: "json",
    response: WalletDto,
  },
  {
    method: "get",
    path: "/api/v1/money/customer/wallet/transactions",
    alias: "getMyWalletTransactions",
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
    response: PageResponseDtoMapStringObject,
  },
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
