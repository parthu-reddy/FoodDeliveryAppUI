import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { SortObject } from "./common";
import { PageableObject } from "./common";
import { PendingPayoutResponse } from "./common";

export const Payout = z
  .object({
    id: z.string().uuid(),
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    payeeDisplayName: z.string(),
    periodFrom: z.string().datetime({ offset: true }),
    periodTo: z.string().datetime({ offset: true }),
    amount: z.number(),
    currency: z.string(),
    status: z.enum(["DRAFT", "APPROVED", "PAID", "FAILED", "CANCELLED"]),
    beneficiarySnapshot: z.string(),
    bankReference: z.string(),
    failureReason: z.string(),
    createdBy: z.string().uuid(),
    approvedBy: z.string().uuid(),
    paidBy: z.string().uuid(),
    idempotencyKey: z.string(),
    ledgerTransactionId: z.string().uuid(),
    settledTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    approvedAt: z.string().datetime({ offset: true }),
    paidAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const PagePayout = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(Payout),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const CreatePayoutRequest = z
  .object({
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    periodTo: z.string().datetime({ offset: true }),
    force: z.boolean(),
  })
  .partial()
  .passthrough();

export const schemas = {
  Payout,
  PagePayout,
  CreatePayoutRequest,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/admin/payouts",
    alias: "getPayouts",
    requestFormat: "json",
    parameters: [
      {
        name: "payeeType",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "payeeId",
        type: "Query",
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
    response: PagePayout,
  },
  {
    method: "post",
    path: "/api/v1/admin/payouts",
    alias: "createPayout",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreatePayoutRequest,
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: Payout,
  },
  {
    method: "post",
    path: "/api/v1/admin/payouts/:payoutId/mark-paid",
    alias: "markPayoutPaid",
    requestFormat: "json",
    parameters: [
      {
        name: "payoutId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "bankReference",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/admin/payouts/:payoutId/fail",
    alias: "failPayout",
    requestFormat: "json",
    parameters: [
      {
        name: "payoutId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "reason",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/admin/payouts/:payoutId/cancel",
    alias: "cancelPayout",
    requestFormat: "json",
    parameters: [
      {
        name: "payoutId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/admin/payouts/:payoutId/approve",
    alias: "approvePayout",
    requestFormat: "json",
    parameters: [
      {
        name: "payoutId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/admin/payouts/:payoutId",
    alias: "getPayout",
    requestFormat: "json",
    parameters: [
      {
        name: "payoutId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Payout,
  },
  {
    method: "get",
    path: "/api/v1/admin/payouts/pending",
    alias: "getPendingPayouts",
    requestFormat: "json",
    response: z.array(PendingPayoutResponse),
  },
]);

export const Payout_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
