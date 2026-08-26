import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { OrderResponse } from "./common";
import { OrderItemResponse } from "./common";
import { ApiResponseVoid } from "./common";
import { ApiResponsePageOrderResponse } from "./common";
import { PageOrderResponse } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";
import { ApiResponseListOrderResponse } from "./common";

const OrderItemRequest = z
  .object({ menuItemId: z.string().uuid(), quantity: z.number().int().gte(1) })
  .passthrough();
const OrderRequest = z
  .object({
    customerId: z.string().uuid(),
    customerName: z.string().optional(),
    restaurantId: z.string().uuid(),
    deliveryAddressId: z.string().uuid(),
    paymentMethod: z.enum(["CARD", "UPI", "WALLET", "COD"]).optional(),
    items: z.array(OrderItemRequest),
  })
  .passthrough();
const ApiResponseOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: OrderResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const QuoteRequest = z
  .object({
    restaurantId: z.string().uuid(),
    deliveryAddressId: z.string().uuid(),
    items: z.array(OrderItemRequest).optional(),
  })
  .passthrough();
const QuoteResponse = z
  .object({
    subtotal: z.number(),
    deliveryFee: z.number(),
    platformFee: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    total: z.number(),
    minAmountForFreeDelivery: z.number().nullable().optional(),
    distanceKm: z.number(),
    driverPayout: z.number(),
    restaurantDeliveryContribution: z.number(),
  })
  .passthrough();
const ApiResponseQuoteResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: QuoteResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  OrderItemRequest,
  OrderRequest,
  ApiResponseOrderResponse,
  QuoteRequest,
  QuoteResponse,
  ApiResponseQuoteResponse,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/orders",
    alias: "createOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OrderRequest,
      },
    ],
    response: ApiResponseOrderResponse,
  },
  {
    method: "post",
    path: "/api/v1/orders/:orderId/delay-approval",
    alias: "handleDelayApproval",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ approved: z.boolean() }).partial().passthrough(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseVoid,
  },
  {
    method: "post",
    path: "/api/v1/orders/:orderId/cancel",
    alias: "cancelOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseVoid,
  },
  {
    method: "post",
    path: "/api/v1/orders/quote",
    alias: "quoteOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: QuoteRequest,
      },
    ],
    response: ApiResponseQuoteResponse,
  },
  {
    method: "get",
    path: "/api/v1/orders/:orderId",
    alias: "getOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseOrderResponse,
  },
  {
    method: "get",
    path: "/api/v1/orders/refunds",
    alias: "getRefundOrders",
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
        schema: z.number().int().optional().default(10),
      },
    ],
    response: ApiResponsePageOrderResponse,
  },
  {
    method: "get",
    path: "/api/v1/orders/history",
    alias: "getOrderHistory",
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
        schema: z.number().int().optional().default(10),
      },
    ],
    response: ApiResponsePageOrderResponse,
  },
  {
    method: "get",
    path: "/api/v1/orders/batch",
    alias: "getOrdersBatch",
    requestFormat: "json",
    parameters: [
      {
        name: "ids",
        type: "Query",
        schema: z.array(z.string().uuid()),
      },
    ],
    response: ApiResponseListOrderResponse,
  },
  {
    method: "get",
    path: "/api/v1/orders/active",
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
        schema: z.number().int().optional().default(10),
      },
    ],
    response: ApiResponsePageOrderResponse,
  },
]);

export const Order_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
