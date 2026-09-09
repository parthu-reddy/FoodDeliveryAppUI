import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageableObject } from "./common";
import { SortObject } from "./common";
import { CashSummaryDto } from "./common";

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
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(CashRemittance),
    first: z.boolean(),
    last: z.boolean(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
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
    path: "/api/v1/internal/admin/cash/remit",
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
    path: "/api/v1/internal/admin/cash/drivers/:driverId",
    alias: "getCashByDriver_2",
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
  {
    method: "get",
    path: "/api/v1/internal/admin/cash/drivers/:driverId/summary",
    alias: "getCashSummary_2",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: CashSummaryDto,
  },
]);

export const Cash_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
