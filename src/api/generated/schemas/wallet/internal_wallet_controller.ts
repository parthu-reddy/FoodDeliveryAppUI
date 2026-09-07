import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const WalletTransactionDto = z
  .object({
    id: z.string().uuid(),
    walletId: z.string().uuid(),
    amount: z.number(),
    transactionType: z.enum(["CREDIT", "DEBIT"]),
    referenceId: z.string().optional(),
    description: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
    metadata: z.string().optional(),
  })
  .passthrough();
export const PageResponseDtoWalletTransactionDto = z
  .object({
    content: z.array(WalletTransactionDto),
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
export const WalletDto = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: z.enum(["CUSTOMER", "ADVERTISER"]),
    balance: z.number(),
    currency: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  })
  .passthrough();
export const PageResponseDtoWalletDto = z
  .object({
    content: z.array(WalletDto),
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
export const CreateWalletRequest = z
  .object({
    entityId: z.string().uuid().optional(),
    entityType: z.enum(["CUSTOMER", "ADVERTISER"]).optional(),
    currency: z.string(),
  })
  .passthrough();
export const TransactionRequest = z
  .object({
    amount: z.number(),
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
    description: z.string().optional(),
  })
  .passthrough();

export const schemas = {
  WalletTransactionDto,
  PageResponseDtoWalletTransactionDto,
  WalletDto,
  PageResponseDtoWalletDto,
  CreateWalletRequest,
  TransactionRequest,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/wallets",
    alias: "createWallet",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateWalletRequest,
      },
    ],
    response: WalletDto,
  },
  {
    method: "post",
    path: "/api/v1/internal/wallets/:entityType/:entityId/debit",
    alias: "debit",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: TransactionRequest,
      },
      {
        name: "entityType",
        type: "Path",
        schema: z.enum(["CUSTOMER", "ADVERTISER"]),
      },
      {
        name: "entityId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: WalletDto,
  },
  {
    method: "post",
    path: "/api/v1/internal/wallets/:entityType/:entityId/credit",
    alias: "credit",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: TransactionRequest,
      },
      {
        name: "entityType",
        type: "Path",
        schema: z.enum(["CUSTOMER", "ADVERTISER"]),
      },
      {
        name: "entityId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: WalletDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/wallets/:entityType/:entityId",
    alias: "getWallet",
    requestFormat: "json",
    parameters: [
      {
        name: "entityType",
        type: "Path",
        schema: z.enum(["CUSTOMER", "ADVERTISER"]),
      },
      {
        name: "entityId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: WalletDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/wallets/:entityType/:entityId/transactions",
    alias: "getTransactions",
    requestFormat: "json",
    parameters: [
      {
        name: "entityType",
        type: "Path",
        schema: z.enum(["CUSTOMER", "ADVERTISER"]),
      },
      {
        name: "entityId",
        type: "Path",
        schema: z.string().uuid(),
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
    response: PageResponseDtoWalletTransactionDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/wallets/transactions/reference/:referenceId",
    alias: "getTransactionByReference",
    requestFormat: "json",
    parameters: [
      {
        name: "referenceId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: WalletTransactionDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/wallets/balances",
    alias: "getBalances",
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
        schema: z.number().int().optional().default(50),
      },
    ],
    response: PageResponseDtoWalletDto,
  },
]);

export const Internal_wallet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
