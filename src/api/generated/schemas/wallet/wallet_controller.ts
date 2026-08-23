import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const WalletTransaction = z
  .object({
    id: z.string().uuid(),
    walletId: z.string().uuid(),
    amount: z.number(),
    transactionType: z.enum(["CREDIT", "DEBIT", "HOLD", "RELEASE", "REFUND"]),
    referenceId: z.string(),
    description: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    metadata: z.string(),
  })
  .partial()
  .passthrough();
const SortObject = z
  .object({
    direction: z.string(),
    nullHandling: z.string(),
    ascending: z.boolean(),
    property: z.string(),
    ignoreCase: z.boolean(),
  })
  .partial()
  .passthrough();
const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: z.array(SortObject),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .partial()
  .passthrough();
const PageWalletTransaction = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(WalletTransaction),
    number: z.number().int(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    first: z.boolean(),
    last: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const WalletDto = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: z.enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"]),
    balance: z.number(),
    currency: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  })
  .partial()
  .passthrough();
const CreateWalletRequest = z
  .object({
    entityId: z.string().uuid(),
    entityType: z.enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"]),
    currency: z.string(),
  })
  .partial()
  .passthrough();
const TransactionRequest = z
  .object({
    amount: z.number(),
    referenceId: z.string(),
    description: z.string(),
  })
  .partial()
  .passthrough();

export const schemas = {
  WalletTransaction,
  SortObject,
  PageableObject,
  PageWalletTransaction,
  WalletDto,
  CreateWalletRequest,
  TransactionRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/wallets",
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
    path: "/api/v1/wallets/:entityType/:entityId/debit",
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
        schema: z.enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"]),
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
    path: "/api/v1/wallets/:entityType/:entityId/credit",
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
        schema: z.enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"]),
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
    path: "/api/v1/wallets/:entityType/:entityId",
    alias: "getWallet",
    requestFormat: "json",
    parameters: [
      {
        name: "entityType",
        type: "Path",
        schema: z.enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"]),
      },
      {
        name: "entityId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: WalletDto,
  },
  {
    method: "get",
    path: "/api/v1/wallets/:entityType/:entityId/transactions",
    alias: "getTransactions",
    requestFormat: "json",
    parameters: [
      {
        name: "entityType",
        type: "Path",
        schema: z.enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"]),
      },
      {
        name: "entityId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
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
    response: PageWalletTransaction,
  },
]);

export const Wallet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
