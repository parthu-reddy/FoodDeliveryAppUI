import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponsePageResponseDtoOrderResponse } from "./common";
import { PageResponseDtoOrderResponse } from "./common";
import { OrderResponse } from "./common";
import { OrderItemResponse } from "./common";

const endpoints = makeApi([
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
    response: ApiResponsePageResponseDtoOrderResponse,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/unassigned",
    alias: "getUnassignedOrders",
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
    response: ApiResponsePageResponseDtoOrderResponse,
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
    response: ApiResponsePageResponseDtoOrderResponse,
  },
]);

export const Admin_order_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
