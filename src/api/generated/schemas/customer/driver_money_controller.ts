import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { JsonNode } from "./common";

const DriverSummary = z
  .object({
    deliveries: z.number().int(),
    gross: z.number(),
    taxes: z.number(),
    net: z.number(),
    cashCollected: z.number(),
    cashRemitted: z.number(),
    cashInHand: z.number(),
    pendingBalance: z.number(),
    lastPayout: JsonNode,
  })
  .partial()
  .passthrough();
const DriverOrderEarnings = z
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

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/money/driver/:driverId/orders/:orderId",
    alias: "getOrderEarnings_1",
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
    alias: "getSummary_1",
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
    alias: "getStatement_1",
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
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/money/driver/orders",
    alias: "getOrders_1",
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
    alias: "getOrderEarningsInternal_1",
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
  {
    method: "get",
    path: "/api/v1/money/driver/cash",
    alias: "getCash",
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
    response: z.object({}).partial().passthrough(),
  },
]);

export const Driver_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
