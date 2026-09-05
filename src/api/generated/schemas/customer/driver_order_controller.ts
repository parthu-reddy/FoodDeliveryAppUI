import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponsePageOrderResponse } from "./common";
import { pageable } from "./common";
import { PageOrderResponse } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";
import { OrderResponse } from "./common";
import { OrderItemResponse } from "./common";
import { ApiResponseListOrderResponse } from "./common";

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/delivery/orders/history",
    alias: "getHistoryOrders",
    requestFormat: "json",
    parameters: [
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
    response: ApiResponsePageOrderResponse,
  },
  {
    method: "get",
    path: "/api/v1/delivery/orders/available",
    alias: "getAvailableOrders",
    requestFormat: "json",
    response: ApiResponseListOrderResponse,
  },
  {
    method: "get",
    path: "/api/v1/delivery/orders/active",
    alias: "getActiveOrders_1",
    requestFormat: "json",
    parameters: [
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: ApiResponsePageOrderResponse,
  },
]);

export const Driver_order_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
