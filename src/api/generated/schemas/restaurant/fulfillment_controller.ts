import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";
import { ApiResponseMapStringObject } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

const RestaurantOrder = z
  .object({
    orderId: z.string().uuid(),
    restaurantId: z.string().uuid(),
    status: z.enum([
      "CREATED",
      "PENDING_ACCEPTANCE",
      "AWAITING_DELAY_APPROVAL",
      "ACCEPTED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "HANDED_OVER",
      "CANCELLED",
      "CANCELLED_BY_RESTAURANT",
    ]),
    deliveryStatus: z.enum([
      "PENDING",
      "SEARCHING_FOR_DRIVER",
      "MANUAL_INTERVENTION_REQUIRED",
      "ASSIGNED",
      "AT_RESTAURANT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "FAILED",
    ]),
    paymentStatus: z
      .enum([
        "CREATED",
        "INITIATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "CAPTURED",
        "PAID",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
        "REFUND_PENDING",
        "REFUND_FAILED",
      ])
      .optional(),
    version: z.number().int().optional(),
    prepTime: z.number().int().optional(),
    additionalPrepTime: z.number().int().optional(),
    estimatedCompletionTime: z.number().int().optional(),
    deliveryLat: z.number().optional(),
    deliveryLng: z.number().optional(),
    deliveryAddress: z.string().optional(),
    pickupOtp: z.string().optional(),
    deliveryOtp: z.string().optional(),
    deliveryExecutiveId: z.string().uuid().optional(),
    customerName: z.string().optional(),
    riderName: z.string().optional(),
    itemsJson: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
const ApiResponseListRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(RestaurantOrder).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const PageRestaurantOrder = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(RestaurantOrder),
    sort: z.array(SortObject).optional(),
    pageable: PageableObject.optional(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .passthrough();
const ApiResponsePageRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageRestaurantOrder.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const AcceptOrderRequest = z
  .object({ additionalPrepTime: z.number().int(), delayReason: z.string() })
  .partial()
  .passthrough();

export const schemas = {
  RestaurantOrder,
  ApiResponseListRestaurantOrder,
  PageRestaurantOrder,
  ApiResponsePageRestaurantOrder,
  AcceptOrderRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/reject",
    alias: "rejectOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/refund/partial",
    alias: "partialRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
      },
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/ready",
    alias: "readyOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/prepare",
    alias: "prepareOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/cancel",
    alias: "cancelOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/accept",
    alias: "acceptOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AcceptOrderRequest,
      },
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
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
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders",
    alias: "getRestaurantOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseListRestaurantOrder,
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/invoice",
    alias: "getOrderInvoice",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseMapStringObject,
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/history",
    alias: "getHistoricalRestaurantOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
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
        schema: z.number().int().optional().default(10),
      },
    ],
    response: ApiResponsePageRestaurantOrder,
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/active",
    alias: "getActiveRestaurantOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseListRestaurantOrder,
  },
]);

export const Fulfillment_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
