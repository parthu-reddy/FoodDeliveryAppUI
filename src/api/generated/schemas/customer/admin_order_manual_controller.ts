import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";
import { PageResponseDtoOrderResponse } from "./common";
import { OrderResponse } from "./common";
import { OrderItemResponse } from "./common";
import { SupportTicket } from "./common";

export const PageResponseDtoSupportTicket = z
  .object({
    content: z.array(SupportTicket),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const AdminManualAssignmentRequest = z
  .object({
    deliveryExecutiveId: z.string().uuid(),
    reason: z.string().min(5).max(500),
  })
  .passthrough();

export const schemas = {
  PageResponseDtoSupportTicket,
  AdminManualAssignmentRequest,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/:orderId/force-cancel",
    alias: "forceCancelOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(5).max(500) }).passthrough(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z
          .string()
          .min(8)
          .max(80)
          .regex(/[A-Za-z0-9][A-Za-z0-9._:-]{7,79}/),
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
        schema: z.object({ reason: z.string().min(5).max(500) }).passthrough(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z
          .string()
          .min(8)
          .max(80)
          .regex(/[A-Za-z0-9][A-Za-z0-9._:-]{7,79}/),
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
        schema: AdminManualAssignmentRequest,
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z
          .string()
          .min(8)
          .max(80)
          .regex(/[A-Za-z0-9][A-Za-z0-9._:-]{7,79}/),
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
    response: PageResponseDtoOrderResponse,
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
    response: PageResponseDtoSupportTicket,
  },
]);

export const Admin_order_manual_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
