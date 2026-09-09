import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageResponseDtoPayoutDto } from "./common";
import { PayoutDto } from "./common";
import { PayoutLineDto } from "./common";

export const PayoutDetailDto = z
  .object({ payout: PayoutDto, lines: z.array(PayoutLineDto) })
  .partial()
  .passthrough();

export const schemas = {
  PayoutDetailDto,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/ledger/payouts/:payeeType/:payeeId",
    alias: "getPayouts",
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
    path: "/api/v1/ledger/payouts/:payeeType/:payeeId/:payoutId",
    alias: "getPayoutDetail",
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
      {
        name: "payoutId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PayoutDetailDto,
  },
]);

export const Payee_payout_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
