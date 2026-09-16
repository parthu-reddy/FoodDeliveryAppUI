import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { WalletDto } from "./common";
import { PageResponseDtoWalletTransactionDto } from "./common";
import { WalletTransactionDto } from "./common";

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/money/advertiser/:entityType/:entityId",
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
    path: "/api/v1/money/advertiser/:entityType/:entityId/transactions",
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
    path: "/api/v1/money/advertiser/:entityType/:entityId/topups/:topupId",
    alias: "getTopupStatus",
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
        name: "topupId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.object({}).partial().passthrough()),
  },
]);

export const Payee_wallet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
