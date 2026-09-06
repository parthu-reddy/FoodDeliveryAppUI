import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageableObject } from "./common";
import { SortObject } from "./common";

const WalletTransactionDto = z
  .object({
    id: z.string().uuid(),
    walletId: z.string().uuid(),
    amount: z.number(),
    transactionType: z.enum(["CREDIT", "DEBIT", "HOLD", "RELEASE", "REFUND"]),
    referenceId: z.string().optional(),
    description: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
    metadata: z.string().optional(),
  })
  .passthrough();
const PageWalletTransactionDto = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(WalletTransactionDto),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const WalletDto = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: z.enum([
      "CUSTOMER",
      "RESTAURANT",
      "DRIVER",
      "PLATFORM",
      "ADVERTISER",
    ]),
    balance: z.number(),
    currency: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  })
  .passthrough();
const CreateWalletRequest = z
  .object({
    entityId: z.string().uuid().optional(),
    entityType: z
      .enum(["CUSTOMER", "RESTAURANT", "DRIVER", "PLATFORM", "ADVERTISER"])
      .optional(),
    currency: z.string(),
  })
  .passthrough();
const TransactionRequest = z
  .object({
    amount: z.number(),
    referenceId: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const schemas = {
  WalletTransactionDto,
  PageWalletTransactionDto,
  WalletDto,
  CreateWalletRequest,
  TransactionRequest,
};

const endpoints = makeApi([
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
        schema: z.enum([
          "CUSTOMER",
          "RESTAURANT",
          "DRIVER",
          "PLATFORM",
          "ADVERTISER",
        ]),
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
        schema: z.enum([
          "CUSTOMER",
          "RESTAURANT",
          "DRIVER",
          "PLATFORM",
          "ADVERTISER",
        ]),
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
        schema: z.enum([
          "CUSTOMER",
          "RESTAURANT",
          "DRIVER",
          "PLATFORM",
          "ADVERTISER",
        ]),
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
        schema: z.enum([
          "CUSTOMER",
          "RESTAURANT",
          "DRIVER",
          "PLATFORM",
          "ADVERTISER",
        ]),
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
]);

export const Internal_wallet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
