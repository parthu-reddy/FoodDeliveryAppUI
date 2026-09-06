import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const PageableObject = z
  .object({
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
    offset: z.number().int(),
  })
  .passthrough();
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
export const PageWalletTransactionDto = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(WalletTransactionDto),
    number: z.number().int(),
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
  .partial()
  .passthrough();
export const PageWalletDto = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(WalletDto),
    number: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const CreateWalletRequest = z
  .object({
    entityId: z.string().uuid(),
    entityType: z.enum(["CUSTOMER", "ADVERTISER"]),
    currency: z.string(),
  })
  .partial()
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
  SortObject,
  PageableObject,
  WalletTransactionDto,
  PageWalletTransactionDto,
  WalletDto,
  PageWalletDto,
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
    response: PageWalletTransactionDto,
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
        schema: z.number().int().optional().default(100),
      },
    ],
    response: PageWalletDto,
  },
]);

export const Internal_wallet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
