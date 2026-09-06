import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";
import { RefundView } from "./common";

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
    path: "/api/v1/internal/money/admin/refunds",
    alias: "getRefunds",
    requestFormat: "json",
    response: z.array(RefundView),
  },
]);

export const Internal_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
