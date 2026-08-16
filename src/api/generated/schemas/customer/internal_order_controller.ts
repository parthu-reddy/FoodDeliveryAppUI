import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { pageable } from "./common";

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/orders/:orderId/partial-refund",
    alias: "partialRefund",
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
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/:orderId/participants",
    alias: "getOrderParticipants",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/:orderId/invoice",
    alias: "getOrderInvoice",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/unassigned",
    alias: "getUnassignedOrders",
    requestFormat: "json",
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/driver/:driverId/history",
    alias: "getOrderHistoryForDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "date",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/driver/:driverId/active",
    alias: "getActiveOrdersForDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: z.any(),
  },
]);

export const Internal_order_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
