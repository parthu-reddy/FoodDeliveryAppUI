import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";
import { JsonNode } from "./common";

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/delivery/orders/history",
    alias: "getOrderHistory",
    requestFormat: "json",
    parameters: [
      {
        name: "date",
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
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/delivery/orders/available",
    alias: "getAvailableOrders",
    requestFormat: "json",
    response: z.array(JsonNode),
  },
  {
    method: "get",
    path: "/api/v1/delivery/orders/active",
    alias: "getActiveOrders",
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
        schema: z.number().int().optional().default(20),
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
]);

export const Delivery_order_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
