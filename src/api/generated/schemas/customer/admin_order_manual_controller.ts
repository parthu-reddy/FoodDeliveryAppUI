import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";
import { PageOrder } from "./common";
import { PageableObject } from "./common";
import { SortObject } from "./common";
import { Order } from "./common";
import { PageSupportTicket } from "./common";
import { SupportTicket } from "./common";

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/:orderId/refund/post-delivery",
    alias: "postDeliveryRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/:orderId/refund/partial",
    alias: "partialRefund_1",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/:orderId/force-refund",
    alias: "forceRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/:orderId/force-cancel",
    alias: "forceCancelOrder",
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
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/:orderId/cancel",
    alias: "cancelOrder_1",
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
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/:orderId/assign-driver",
    alias: "assignDriver",
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
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/support-tickets/:ticketId/resolve",
    alias: "resolveSupportTicket",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
      },
      {
        name: "ticketId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/intervention",
    alias: "getOrdersRequiringIntervention",
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
    response: PageOrder,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/intervention/support-tickets",
    alias: "getOpenSupportTickets",
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
      {
        name: "status",
        type: "Query",
        schema: z.string().optional().default("OPEN"),
      },
    ],
    response: PageSupportTicket,
  },
]);

export const Admin_order_manual_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
