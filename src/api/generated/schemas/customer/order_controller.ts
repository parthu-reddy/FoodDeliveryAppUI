import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { OrderResponse } from "./common";
import { OrderItemResponse } from "./common";
import { ApiResponseVoid } from "./common";
import { ApiResponsePageResponseDtoOrderResponse } from "./common";
import { PageResponseDtoOrderResponse } from "./common";
import { ApiResponseListOrderResponse } from "./common";

export const OrderItemRequest = z
  .object({ menuItemId: z.string().uuid(), quantity: z.number().int().gte(1) })
  .passthrough();
export const OrderRequest = z
  .object({
    quoteId: z.string().uuid(),
    customerId: z.string().uuid(),
    customerName: z.string().optional(),
    restaurantId: z.string().uuid(),
    deliveryAddressId: z.string().uuid(),
    paymentMethod: z.enum(["CARD", "UPI", "WALLET", "COD"]).optional(),
    items: z.array(OrderItemRequest),
  })
  .passthrough();
export const ApiResponseOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: OrderResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const QuoteRequest = z
  .object({
    restaurantId: z.string().uuid(),
    deliveryAddressId: z.string().uuid(),
    items: z.array(OrderItemRequest).optional(),
  })
  .passthrough();
export const QuoteResponse = z
  .object({
    quoteId: z.string().uuid(),
    expiresAt: z.string().datetime({ offset: true }),
    subtotal: z.number(),
    deliveryFee: z.number(),
    platformFee: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    total: z.number(),
    minAmountForFreeDelivery: z.number(),
    distanceKm: z.number(),
    driverPayout: z.number(),
    restaurantDeliveryContribution: z.number(),
  })
  .passthrough();
export const ApiResponseQuoteResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
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

export const endpoints = makeApi([
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
        schema: z.object({ approved: z.boolean() }).passthrough(),
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
    response: ApiResponsePageResponseDtoOrderResponse,
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
    response: ApiResponsePageResponseDtoOrderResponse,
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
    response: ApiResponsePageResponseDtoOrderResponse,
  },
]);

export const Order_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
