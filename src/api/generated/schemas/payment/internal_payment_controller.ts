import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/payments/daily-totals",
    alias: "getDailyTotals",
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
      {
        name: "gatewayName",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.record(z.number()),
  },
]);

export const Internal_payment_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
