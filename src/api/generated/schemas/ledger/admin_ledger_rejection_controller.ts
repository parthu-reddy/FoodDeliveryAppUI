import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const LedgerRejectionDto = z
  .object({
    id: z.string().uuid(),
    eventId: z.string(),
    producer: z.string(),
    reason: z.string(),
    payload: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    resolvedAt: z.string().datetime({ offset: true }),
    resolvedBy: z.string(),
    resolutionNote: z.string(),
    ageMinutes: z.number().int(),
  })
  .partial()
  .passthrough();
export const PageResponseDtoLedgerRejectionDto = z
  .object({
    content: z.array(LedgerRejectionDto),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();

export const schemas = {
  LedgerRejectionDto,
  PageResponseDtoLedgerRejectionDto,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/ledger/rejections/:id/resolve",
    alias: "resolve",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ note: z.string() }).partial().passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LedgerRejectionDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/ledger/rejections",
    alias: "list",
    requestFormat: "json",
    parameters: [
      {
        name: "resolved",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "producer",
        type: "Query",
        schema: z.string().optional(),
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
    response: PageResponseDtoLedgerRejectionDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/ledger/rejections/:id",
    alias: "get",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LedgerRejectionDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/ledger/rejections/count",
    alias: "unresolvedCount",
    requestFormat: "json",
    response: z.void(),
  },
]);

export const Admin_ledger_rejection_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
