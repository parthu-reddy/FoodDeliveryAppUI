import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const LedgerTransactionDto = z
  .object({
    transactionId: z.string().uuid(),
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
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number(),
    date: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageResponseDtoLedgerTransactionDto = z
  .object({
    content: z.array(LedgerTransactionDto),
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
export const ApiResponsePageResponseDtoLedgerTransactionDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoLedgerTransactionDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const LedgerEntry = z
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
    producer: z.string().optional(),
    description: z.string().optional(),
    authorizedBy: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageResponseDtoLedgerEntry = z
  .object({
    content: z.array(LedgerEntry),
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
export const ApiResponsePageResponseDtoLedgerEntry = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoLedgerEntry.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  LedgerTransactionDto,
  PageResponseDtoLedgerTransactionDto,
  ApiResponsePageResponseDtoLedgerTransactionDto,
  LedgerEntry,
  PageResponseDtoLedgerEntry,
  ApiResponsePageResponseDtoLedgerEntry,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/admin/ledger/transactions",
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
          ])
          .optional(),
      },
      {
        name: "direction",
        type: "Query",
        schema: z.enum(["CREDIT", "DEBIT"]).optional(),
      },
    ],
    response: ApiResponsePageResponseDtoLedgerTransactionDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/ledger/entries",
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
          ])
          .optional(),
      },
      {
        name: "direction",
        type: "Query",
        schema: z.enum(["CREDIT", "DEBIT"]).optional(),
      },
    ],
    response: ApiResponsePageResponseDtoLedgerEntry,
  },
]);

export const Admin_ledger_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
