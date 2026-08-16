import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

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
  .partial()
  .passthrough();

export const schemas = {
  PayoutSettlementRequest,
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/ledger/payouts/pending",
    alias: "getPendingPayouts",
    requestFormat: "json",
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
    response: z.void(),
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
    response: z.void(),
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
    response: z.void(),
  },
]);

export const Ledger_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
