import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageResponseDtoPayoutDto } from "./common";
import { PayoutDto } from "./common";
import { BeneficiaryResponse } from "./common";

export const PayeeMoneySummaryDto = z
  .object({
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    unsettledAmount: z.number(),
    pendingPayoutAmount: z.number(),
    lastPayout: PayoutDto,
    beneficiary: BeneficiaryResponse,
  })
  .partial()
  .passthrough();

export const schemas = {
  PayeeMoneySummaryDto,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/ledger/payouts",
    alias: "getPayouts_1",
    requestFormat: "json",
    parameters: [
      {
        name: "payeeType",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "payeeId",
        type: "Query",
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
    response: PageResponseDtoPayoutDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/ledger/payouts/latest/:payeeType/:payeeId",
    alias: "getPayeeSummary",
    requestFormat: "json",
    parameters: [
      {
        name: "payeeType",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "payeeId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PayeeMoneySummaryDto,
  },
]);

export const Internal_payout_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
