import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const LedgerTransactionDto = z
  .object({
    transactionId: z.string().uuid(),
    category: z.enum([
      "DELIVERY_FEE",
      "PLATFORM_FIXED_FEE",
      "PLATFORM_BONUS",
      "FOOD_COST",
      "TIP",
      "PACKAGING_FEE",
      "SURGE_PRICING",
      "TAX",
      "SGST",
      "CGST",
      "REFUND",
      "ORDER_TOTAL",
      "PAYOUT",
      "AD_IMPRESSION",
      "AD_CLICK",
      "AD_CONVERSION",
      "AD_WALLET_TOPUP",
      "AD_REVENUE",
    ]),
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number(),
    date: z.string().datetime({ offset: true }),
  })
  .passthrough();
const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
const PageableObject = z
  .object({
    offset: z.number().int(),
    pageSize: z.number().int(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    sort: SortObject.optional(),
    unpaged: z.boolean(),
  })
  .passthrough();
const PageLedgerTransactionDto = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(LedgerTransactionDto),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
const LedgerEntry = z
  .object({
    id: z.string().uuid(),
    transactionId: z.string().uuid(),
    referenceId: z.string().uuid().optional(),
    accountId: z.string().uuid(),
    direction: z.enum(["CREDIT", "DEBIT"]),
    category: z.enum([
      "DELIVERY_FEE",
      "PLATFORM_FIXED_FEE",
      "PLATFORM_BONUS",
      "FOOD_COST",
      "TIP",
      "PACKAGING_FEE",
      "SURGE_PRICING",
      "TAX",
      "SGST",
      "CGST",
      "REFUND",
      "ORDER_TOTAL",
      "PAYOUT",
      "AD_IMPRESSION",
      "AD_CLICK",
      "AD_CONVERSION",
      "AD_WALLET_TOPUP",
      "AD_REVENUE",
    ]),
    amount: z.number(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const PageLedgerEntry = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(LedgerEntry),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
const PayoutSettlementRequest = z
  .object({
    ownerId: z.string().uuid(),
    ownerType: z.enum([
      "CUSTOMER",
      "PLATFORM",
      "RESTAURANT",
      "DRIVER",
      "ADVERTISER_WALLET",
      "GOVERNMENT",
    ]),
    amount: z.number(),
  })
  .passthrough();
const LedgerAccount = z
  .object({
    id: z.string().uuid(),
    ownerType: z.enum([
      "CUSTOMER",
      "PLATFORM",
      "RESTAURANT",
      "DRIVER",
      "ADVERTISER_WALLET",
      "GOVERNMENT",
    ]),
    ownerId: z.string().uuid(),
    balance: z.number(),
    lockVersion: z.number().int(),
  })
  .passthrough();

export const schemas = {
  LedgerTransactionDto,
  SortObject,
  PageableObject,
  PageLedgerTransactionDto,
  LedgerEntry,
  PageLedgerEntry,
  PayoutSettlementRequest,
  LedgerAccount,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/ledger/payouts/settle",
    alias: "settlePayout",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PayoutSettlementRequest,
      },
    ],
    response: z.record(z.string()),
  },
  {
    method: "get",
    path: "/api/v1/ledger/payouts/pending",
    alias: "getPendingPayouts",
    requestFormat: "json",
    response: z.array(LedgerAccount),
  },
  {
    method: "get",
    path: "/api/v1/ledger/orders/:orderId/total",
    alias: "getOrderLedgerAmount",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/ledger/admin/transactions",
    alias: "getTransactions",
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
      {
        name: "transactionId",
        type: "Query",
        schema: z.string().uuid().optional(),
      },
      {
        name: "ownerId",
        type: "Query",
        schema: z.string().uuid().optional(),
      },
      {
        name: "ownerType",
        type: "Query",
        schema: z
          .enum([
            "CUSTOMER",
            "PLATFORM",
            "RESTAURANT",
            "DRIVER",
            "ADVERTISER_WALLET",
            "GOVERNMENT",
          ])
          .optional(),
      },
      {
        name: "category",
        type: "Query",
        schema: z
          .enum([
            "DELIVERY_FEE",
            "PLATFORM_FIXED_FEE",
            "PLATFORM_BONUS",
            "FOOD_COST",
            "TIP",
            "PACKAGING_FEE",
            "SURGE_PRICING",
            "TAX",
            "SGST",
            "CGST",
            "REFUND",
            "ORDER_TOTAL",
            "PAYOUT",
            "AD_IMPRESSION",
            "AD_CLICK",
            "AD_CONVERSION",
            "AD_WALLET_TOPUP",
            "AD_REVENUE",
          ])
          .optional(),
      },
      {
        name: "direction",
        type: "Query",
        schema: z.enum(["CREDIT", "DEBIT"]).optional(),
      },
    ],
    response: PageLedgerTransactionDto,
  },
  {
    method: "get",
    path: "/api/v1/ledger/admin/entries",
    alias: "getEntries",
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
      {
        name: "transactionId",
        type: "Query",
        schema: z.string().uuid().optional(),
      },
      {
        name: "ownerId",
        type: "Query",
        schema: z.string().uuid().optional(),
      },
      {
        name: "ownerType",
        type: "Query",
        schema: z
          .enum([
            "CUSTOMER",
            "PLATFORM",
            "RESTAURANT",
            "DRIVER",
            "ADVERTISER_WALLET",
            "GOVERNMENT",
          ])
          .optional(),
      },
      {
        name: "category",
        type: "Query",
        schema: z
          .enum([
            "DELIVERY_FEE",
            "PLATFORM_FIXED_FEE",
            "PLATFORM_BONUS",
            "FOOD_COST",
            "TIP",
            "PACKAGING_FEE",
            "SURGE_PRICING",
            "TAX",
            "SGST",
            "CGST",
            "REFUND",
            "ORDER_TOTAL",
            "PAYOUT",
            "AD_IMPRESSION",
            "AD_CLICK",
            "AD_CONVERSION",
            "AD_WALLET_TOPUP",
            "AD_REVENUE",
          ])
          .optional(),
      },
      {
        name: "direction",
        type: "Query",
        schema: z.enum(["CREDIT", "DEBIT"]).optional(),
      },
    ],
    response: PageLedgerEntry,
  },
  {
    method: "get",
    path: "/api/v1/ledger/accounts/:ownerType/:ownerId",
    alias: "getAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "ownerType",
        type: "Path",
        schema: z.enum([
          "CUSTOMER",
          "PLATFORM",
          "RESTAURANT",
          "DRIVER",
          "ADVERTISER_WALLET",
          "GOVERNMENT",
        ]),
      },
      {
        name: "ownerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LedgerAccount,
  },
]);

export const Ledger_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
