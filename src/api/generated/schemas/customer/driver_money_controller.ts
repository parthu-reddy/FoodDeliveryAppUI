import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PayoutSummaryDto } from "./common";
import { PageResponseDtoLedgerStatementLineDto } from "./common";
import { LedgerStatementLineDto } from "./common";

export const DriverSummary = z
  .object({
    deliveries: z.number().int(),
    gross: z.number(),
    taxes: z.number(),
    net: z.number(),
    pendingBalance: z.number(),
    lastPayout: PayoutSummaryDto,
  })
  .partial()
  .passthrough();
export const DriverOrderEarnings = z
  .object({
    orderId: z.string().uuid(),
    driverId: z.string().uuid(),
    grossPayout: z.number(),
    taxes: z.number(),
    netPayout: z.number(),
    customerContribution: z.number(),
    restaurantContribution: z.number(),
    platformBonus: z.number(),
  })
  .partial()
  .passthrough();

export const schemas = {
  DriverSummary,
  DriverOrderEarnings,
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
        name: "period",
        type: "Query",
        schema: z.string().optional().default("month"),
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
  {
    method: "get",
    path: "/api/v1/money/driver/orders",
    alias: "fetchOrders_1",
    requestFormat: "json",
    parameters: [
      {
        name: "date",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.array(DriverOrderEarnings),
  },
  {
    method: "get",
    path: "/api/v1/money/driver/orders/:orderId/earnings",
    alias: "fetchOrderEarningsInternal_1",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DriverOrderEarnings,
  },
]);

export const Driver_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
