import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PayoutSummaryDto } from "./common";
import { PageResponseDtoLedgerStatementLineDto } from "./common";
import { LedgerStatementLineDto } from "./common";
import { RestaurantOrderEarnings } from "./common";
import { RefundView } from "./common";

export const BeneficiaryStatusDto = z
  .object({
    beneficiaryId: z.string(),
    verificationStatus: z.string(),
    active: z.boolean(),
  })
  .partial()
  .passthrough();
export const RestaurantSummary = z
  .object({
    orders: z.number().int(),
    grossFoodCost: z.number(),
    platformFees: z.number(),
    deliveryContribution: z.number(),
    platformBonus: z.number(),
    netEarnings: z.number(),
    clawbacks: z.number(),
    pendingBalance: z.number(),
    lastPayout: PayoutSummaryDto,
    beneficiaryStatus: BeneficiaryStatusDto,
  })
  .partial()
  .passthrough();

export const schemas = {
  BeneficiaryStatusDto,
  RestaurantSummary,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/summary",
    alias: "fetchSummary",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "period",
        type: "Query",
        schema: z.string().optional().default("month"),
      },
    ],
    response: RestaurantSummary,
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/statement",
    alias: "fetchStatement",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
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
    response: PageResponseDtoLedgerStatementLineDto,
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/refunds",
    alias: "fetchRestaurantRefunds",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(RefundView),
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/refund-requests",
    alias: "fetchActiveRefundRequests",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(RefundView),
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/orders",
    alias: "fetchOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "from",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().optional().default(0),
      },
    ],
    response: z.array(RestaurantOrderEarnings),
  },
  {
    method: "get",
    path: "/api/v1/money/restaurant/:outletId/orders/:orderId",
    alias: "fetchOrderEarnings",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RestaurantOrderEarnings,
  },
]);

export const Restaurant_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
