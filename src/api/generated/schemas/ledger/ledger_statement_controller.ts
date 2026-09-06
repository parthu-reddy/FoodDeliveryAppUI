import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { SortObject } from "./common";
import { PageableObject } from "./common";

export const LedgerStatementLineDto = z
  .object({
    transactionId: z.string().uuid(),
    referenceId: z.string().uuid(),
    category: z.enum([
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
      "CASH_COLLECTED",
      "CASH_REMITTED",
      "STORE_CREDIT",
    ]),
    amount: z.number(),
    direction: z.enum(["CREDIT", "DEBIT"]),
    createdAt: z.string().datetime({ offset: true }),
    description: z.string(),
    payoutId: z.string().uuid(),
    payoutStatus: z.string(),
    settled: z.boolean(),
  })
  .partial()
  .passthrough();
export const PageLedgerStatementLineDto = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(LedgerStatementLineDto),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();

export const schemas = {
  LedgerStatementLineDto,
  PageLedgerStatementLineDto,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/ledger/statements/:ownerType/:ownerId",
    alias: "getStatement",
    requestFormat: "json",
    parameters: [
      {
        name: "ownerType",
        type: "Path",
        schema: z.enum([
          "GATEWAY_RECEIVABLE",
          "CASH_RECEIVABLE",
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
        name: "from",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "settled",
        type: "Query",
        schema: z.boolean().optional(),
      },
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
    response: PageLedgerStatementLineDto,
  },
  {
    method: "get",
    path: "/api/v1/ledger/statements/references/:referenceId",
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
]);

export const Ledger_statement_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
