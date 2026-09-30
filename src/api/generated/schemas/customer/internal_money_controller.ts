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
    method: "post",
    path: "/api/v1/internal/money/driver/:driverId/orders/batch",
    alias: "fetchDriverOrderMoneyBatch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(z.string()),
      },
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(DriverOrderEarnings),
  },
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
    response: z.object({ orderTotals: z.number() }).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/internal/money/daily-payables",
    alias: "getDailyPayables",
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
    response: DailyPayableDto,
  },
]);

export const Internal_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
