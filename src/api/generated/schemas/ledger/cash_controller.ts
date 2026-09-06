import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { SortObject } from "./common";
import { PageableObject } from "./common";

export const CashRemittance = z
  .object({
    id: z.string().uuid(),
    driverId: z.string().uuid(),
    amount: z.number(),
    reference: z.string(),
    recordedBy: z.string().uuid(),
    ledgerTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const PageCashRemittance = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CashRemittance),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const CashRemittanceRequest = z
  .object({
    driverId: z.string().uuid(),
    amount: z.number(),
    reference: z.string(),
  })
  .partial()
  .passthrough();

export const schemas = {
  CashRemittance,
  PageCashRemittance,
  CashRemittanceRequest,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/admin/cash/remit",
    alias: "remitCash",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CashRemittanceRequest,
      },
    ],
    response: CashRemittance,
  },
  {
    method: "get",
    path: "/api/v1/admin/cash/drivers/:driverId",
    alias: "getCashByDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
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
    response: PageCashRemittance,
  },
]);

export const Cash_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
