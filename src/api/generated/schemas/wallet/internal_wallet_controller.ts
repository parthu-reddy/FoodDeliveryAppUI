import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { WalletDto } from "./common";

const CreateWalletRequest = z
  .object({
    entityId: z.string().uuid().optional(),
    entityType: z
      .enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"])
      .optional(),
    currency: z.string(),
  })
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
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string().optional(),
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
        schema: z.enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"]),
      },
      {
        name: "entityId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string().optional(),
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
        schema: z.enum(["CUSTOMER", "ADVERTISER", "RESTAURANT", "DRIVER"]),
      },
      {
        name: "entityId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: WalletDto,
  },
]);

export const Internal_wallet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
