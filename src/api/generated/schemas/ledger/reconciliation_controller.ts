import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { SortObject } from "./common";
import { PageableObject } from "./common";

export const ReconciliationRun = z
  .object({
    id: z.string().uuid(),
    startedAt: z.string().datetime({ offset: true }),
    finishedAt: z.string().datetime({ offset: true }),
    status: z.string(),
    summary: z.string(),
  })
  .partial()
  .passthrough();
export const PageReconciliationRun = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(ReconciliationRun),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const ReconciliationBreak = z
  .object({
    id: z.string().uuid(),
    runId: z.string().uuid(),
    kind: z.enum([
      "GATEWAY_VS_LEDGER",
      "ORDERS_VS_CLEARING",
      "WALLET_VS_LEDGER",
      "PAYABLE_VS_ORDERS",
      "DOUBLE_ENTRY",
      "STUCK",
    ]),
    subjectType: z.string(),
    subjectId: z.string().uuid(),
    expected: z.number(),
    actual: z.number(),
    detail: z.string(),
    resolvedAt: z.string().datetime({ offset: true }),
    resolvedBy: z.string().uuid(),
    note: z.string(),
  })
  .partial()
  .passthrough();
export const PageReconciliationBreak = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(ReconciliationBreak),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const ResolveBreakRequest = z
  .object({ resolvedBy: z.string().uuid(), note: z.string() })
  .partial()
  .passthrough();
export const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: SortObject,
  })
  .partial()
  .passthrough();

export const schemas = {
  ReconciliationRun,
  PageReconciliationRun,
  ReconciliationBreak,
  PageReconciliationBreak,
  ResolveBreakRequest,
  pageable,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/ledger/admin/reconciliation/runs/:id/resolve-breaks",
    alias: "resolveBreak",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResolveBreakRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/ledger/admin/reconciliation/runs/:id/execute",
    alias: "executeRun",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "date",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ReconciliationRun,
  },
  {
    method: "get",
    path: "/api/v1/ledger/admin/reconciliation/runs",
    alias: "getRuns",
    requestFormat: "json",
    parameters: [
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: PageReconciliationRun,
  },
  {
    method: "get",
    path: "/api/v1/ledger/admin/reconciliation/runs/:id",
    alias: "getRun",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ReconciliationRun,
  },
  {
    method: "get",
    path: "/api/v1/ledger/admin/reconciliation/runs/:id/breaks",
    alias: "getBreaks",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "kind",
        type: "Query",
        schema: z
          .enum([
            "GATEWAY_VS_LEDGER",
            "ORDERS_VS_CLEARING",
            "WALLET_VS_LEDGER",
            "PAYABLE_VS_ORDERS",
            "DOUBLE_ENTRY",
            "STUCK",
          ])
          .optional(),
      },
      {
        name: "resolved",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: PageReconciliationBreak,
  },
]);

export const Reconciliation_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
