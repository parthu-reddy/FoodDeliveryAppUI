import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { DriverOrderEarnings } from "./common";
import { PayoutSummaryDto } from "./common";
import { PageResponseDtoLedgerStatementLineDto } from "./common";
import { LedgerStatementLineDto } from "./common";

export const DriverSummary = z
  .object({
    deliveries: z.number().int(),
    gross: z.number(),
    taxes: z.number(),
    net: z.number(),
    tips: z.number(),
    pendingBalance: z.number(),
    lastPayout: PayoutSummaryDto,
  })
  .partial()
  .passthrough();

export const schemas = {
  DriverSummary,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/money/driver/:driverId/orders/:orderId",
    alias: "fetchOrderEarnings_1",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DriverOrderEarnings,
  },
  {
    method: "get",
    path: "/api/v1/money/driver/summary",
    alias: "fetchSummary_1",
    requestFormat: "json",
    parameters: [
      {
        name: "from",
        type: "Query",
        schema: z.string().datetime({ offset: true }),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().datetime({ offset: true }),
      },
    ],
    response: DriverSummary,
  },
  {
    method: "get",
    path: "/api/v1/money/driver/statement",
    alias: "fetchStatement_1",
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
        schema: z.number().int().optional().default(20),
      },
    ],
    response: PageResponseDtoLedgerStatementLineDto,
  },
]);

export const Driver_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
