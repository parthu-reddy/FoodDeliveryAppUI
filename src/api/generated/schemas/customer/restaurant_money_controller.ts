import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { JsonNode } from "./common";
import { RefundView } from "./common";

const RestaurantSummary = z
  .object({
    orders: z.number().int(),
    grossFoodCost: z.number(),
    platformFees: z.number(),
    deliveryContribution: z.number(),
    platformBonus: z.number(),
    netEarnings: z.number(),
    clawbacks: z.number(),
    pendingBalance: z.number(),
    lastPayout: JsonNode,
    beneficiaryStatus: JsonNode,
  })
  .partial()
  .passthrough();
const RestaurantOrderEarnings = z
  .object({
    orderId: z.string().uuid(),
    restaurantId: z.string().uuid(),
    foodCost: z.number(),
    platformFee: z.number(),
    deliveryContribution: z.number(),
    netPayout: z.number(),
  })
  .partial()
  .passthrough();

export const schemas = {
  RestaurantSummary,
  RestaurantOrderEarnings,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/summary",
    alias: "getSummary",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "period",
        type: "Query",
        schema: z.string().optional().default("month"),
      },
    ],
    response: RestaurantSummary,
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/statement",
    alias: "getStatement",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
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
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/refunds",
    alias: "getRestaurantRefunds",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(RefundView),
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/orders",
    alias: "getOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "from",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().optional().default(0),
      },
    ],
    response: z.array(RestaurantOrderEarnings),
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/orders/:orderId",
    alias: "getOrderEarnings",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RestaurantOrderEarnings,
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/orders/:orderId/earnings",
    alias: "getOrderEarningsInternal",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RestaurantOrderEarnings,
  },
]);

export const Restaurant_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
