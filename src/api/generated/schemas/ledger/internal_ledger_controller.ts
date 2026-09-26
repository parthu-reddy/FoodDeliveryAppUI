import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";
import { LedgerStatementLineDto } from "./common";

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/ledger/statements/references/:referenceId",
    alias: "getStatementByReference",
    requestFormat: "json",
    parameters: [
      {
        name: "referenceId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(LedgerStatementLineDto),
  },
  {
    method: "get",
    path: "/api/v1/internal/ledger/orders/:orderId/total",
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
    path: "/api/v1/internal/ledger/accounts/:ownerType/:ownerId/totals",
    alias: "getCategoryTotal",
    requestFormat: "json",
    parameters: [
      {
        name: "ownerType",
        type: "Path",
        schema: z.enum([
          "GATEWAY_RECEIVABLE",
          "BANK",
          "PLATFORM_CLEARING",
          "PLATFORM_REVENUE",
          "TAX_PAYABLE",
          "PAYOUT_IN_TRANSIT",
          "RESTAURANT_PAYABLE",
          "DRIVER_PAYABLE",
          "CUSTOMER_CREDIT",
          "ADVERTISER_PREPAID",
        ]),
      },
      {
        name: "ownerId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "category",
        type: "Query",
        schema: z.enum([
          "DELIVERY_FEE",
          "PLATFORM_FIXED_FEE",
          "PLATFORM_BONUS",
          "FOOD_COST",
          "SGST",
          "CGST",
          "REFUND",
          "ORDER_TOTAL",
          "AD_IMPRESSION",
          "AD_CLICK",
          "AD_CONVERSION",
          "AD_WALLET_TOPUP",
          "CLAWBACK",
          "PAYOUT_TRANSFER",
          "STORE_CREDIT",
        ]),
      },
      {
        name: "direction",
        type: "Query",
        schema: z.enum(["CREDIT", "DEBIT"]),
      },
      {
        name: "from",
        type: "Query",
        schema: z.string().datetime({ offset: true }),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().datetime({ offset: true }),
      },
    ],
    response: z.void(),
  },
]);

export const Internal_ledger_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
