import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { PageOrder } from "./common";
import { pageable } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";
import { Order } from "./common";

const endpoints = makeApi([
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
    response: z.array(z.string()),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/unassigned",
    alias: "getUnassignedOrders",
    requestFormat: "json",
    response: z.array(Order),
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
    response: PageOrder,
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
    response: PageOrder,
  },
]);

export const Internal_order_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
