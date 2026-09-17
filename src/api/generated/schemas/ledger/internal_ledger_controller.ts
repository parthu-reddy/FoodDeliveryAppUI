import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";
import { LedgerStatementLineDto } from "./common";

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/ledger/statements/references/:referenceId",
    alias: "getStatementByReference",
    requestFormat: "json",
    parameters: [
      {
        name: "referenceId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(LedgerStatementLineDto),
  },
  {
    method: "get",
    path: "/api/v1/internal/ledger/orders/:orderId/total",
    alias: "getOrderLedgerAmount",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
]);

export const Internal_ledger_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
