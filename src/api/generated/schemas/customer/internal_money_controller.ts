import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

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
