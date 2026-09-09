import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageResponseDtoPayoutDto } from "./common";
import { PayoutDto } from "./common";
import { BeneficiaryResponse } from "./common";
import { PayoutLineDto } from "./common";
import { PendingPayoutResponse } from "./common";

export const PayoutDetailResponse = z
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
    beneficiary: BeneficiaryResponse,
    beneficiarySnapshot: z.string(),
    bankReference: z.string(),
    failureReason: z.string(),
    createdBy: z.string().uuid(),
    approvedBy: z.string().uuid(),
    paidBy: z.string().uuid(),
    ledgerTransactionId: z.string().uuid(),
    settledTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    approvedAt: z.string().datetime({ offset: true }),
    paidAt: z.string().datetime({ offset: true }),
    lines: z.array(PayoutLineDto),
  })
  .partial()
  .passthrough();
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
  PayoutDetailResponse,
  Payout,
  CreatePayoutRequest,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/admin/payouts",
    alias: "getPayouts_2",
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
    response: PageResponseDtoPayoutDto,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/payouts",
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
    path: "/api/v1/internal/admin/payouts/:payoutId/mark-paid",
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
    path: "/api/v1/internal/admin/payouts/:payoutId/fail",
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
    path: "/api/v1/internal/admin/payouts/:payoutId/cancel",
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
    path: "/api/v1/internal/admin/payouts/:payoutId/approve",
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
    path: "/api/v1/internal/admin/payouts/:payoutId",
    alias: "getPayoutDetail_1",
    requestFormat: "json",
    parameters: [
      {
        name: "payoutId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: PayoutDetailResponse,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/payouts/pending",
    alias: "getPendingPayouts",
    requestFormat: "json",
    parameters: [
      {
        name: "page",
        type: "Query",
        schema: z.number().int().optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().optional().default(50),
      },
    ],
    response: z.array(PendingPayoutResponse),
  },
]);

export const Payout_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
