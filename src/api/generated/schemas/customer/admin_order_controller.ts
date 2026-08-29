import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageOrder } from "./common";
import { pageable } from "./common";
import { Order } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

const PartialRefundRequest = z
  .object({
    amount: z.number(),
    reason: z.string().optional(),
    faultType: z
      .enum([
        "PLATFORM_FAULT",
        "RESTAURANT_FAULT",
        "RIDER_FAULT",
        "CUSTOMER_FAULT",
        "UNKNOWN",
      ])
      .optional(),
  })
  .passthrough();

export const schemas = {
  PartialRefundRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/:orderId/refund/post-delivery",
    alias: "initiatePostDeliveryRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartialRefundRequest,
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.string()),
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/:orderId/refund/partial",
    alias: "initiatePartialRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartialRefundRequest,
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.string()),
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/:orderId/reconcile",
    alias: "reconcileOrderState",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.string()),
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/:orderId/override-status",
    alias: "overrideOrderStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.string()),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/user/:userId/active",
    alias: "getActiveOrdersForUser",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: PageOrder,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/unassigned",
    alias: "getUnassignedOrders_1",
    requestFormat: "json",
    parameters: [
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: PageOrder,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/active-all",
    alias: "getAllActiveOrders",
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
    response: PageOrder,
  },
]);

export const Admin_order_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
