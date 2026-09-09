import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageResponseDtoCashRemittanceDto } from "./common";
import { CashRemittanceDto } from "./common";
import { CashSummaryDto } from "./common";

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/ledger/cash/drivers/:driverId",
    alias: "getCashByDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
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
    response: PageResponseDtoCashRemittanceDto,
  },
  {
    method: "get",
    path: "/api/v1/ledger/cash/drivers/:driverId/summary",
    alias: "getCashSummary",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CashSummaryDto,
  },
]);

export const Payee_cash_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
