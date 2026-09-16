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
        name: "date",
        type: "Query",
        schema: z.string(),
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
