import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { WalletDto } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

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
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();

export const schemas = {
  WalletTransactionDto,
  PageWalletTransactionDto,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/wallets/:entityType/:entityId",
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
    response: PageWalletTransactionDto,
  },
]);

export const Wallet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
