import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const LedgerAccount = z
  .object({
    id: z.string().uuid(),
    ownerType: z.enum([
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
    ownerId: z.string().uuid(),
    kind: z.enum(["EXTERNAL", "INTERNAL", "PAYABLE", "PREPAID"]).optional(),
    balance: z.number(),
    currency: z.string().optional(),
    lockVersion: z.number().int(),
    createdAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();

export const schemas = {
  LedgerAccount,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/ledger/accounts/:ownerType/:ownerId",
    alias: "getAccount",
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
    ],
    response: LedgerAccount,
  },
]);

export const Ledger_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
