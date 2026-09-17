import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { RestaurantOrderEarnings } from "./common";
import { DriverOrderEarnings } from "./common";

export const DailyPayableDto = z
  .object({ restaurantPayable: z.number(), driverPayable: z.number() })
  .partial()
  .passthrough();

export const schemas = {
  DailyPayableDto,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/money/restaurant/orders/:orderId/earnings",
    alias: "fetchRestaurantOrderEarningsInternal",
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
  {
    method: "get",
    path: "/api/v1/internal/money/driver/orders/:orderId/earnings",
    alias: "fetchDriverOrderEarningsInternal",
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
    path: "/api/v1/internal/money/daily-totals",
    alias: "getDailyPaidOrderTotal",
    requestFormat: "json",
    parameters: [
      {
        name: "date",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.object({ orderTotals: z.number() }).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/internal/money/daily-payables",
    alias: "getDailyPayables",
    requestFormat: "json",
    parameters: [
      {
        name: "date",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: DailyPayableDto,
  },
]);

export const Internal_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
