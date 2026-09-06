import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";

export const RestaurantOrder = z
  .object({
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
        "INITIATED",
        "SUCCESS",
        "FAILED",
        "PENDING_COLLECTION",
        "COLLECTED",
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
    customerId: z.string().uuid().optional(),
    customerName: z.string().optional(),
    foodCost: z.number().optional(),
    restaurantPlatformFee: z.number().optional(),
    restaurantDeliveryContribution: z.number().optional(),
    platformBonus: z.number().optional(),
    restaurantPayout: z.number().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
    id: z.string().uuid(),
    deliveryExecutiveName: z.string().optional(),
    total: z.number().optional(),
    items: z.object({}).partial().passthrough().optional(),
  })
  .passthrough();
export const ApiResponseListRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(RestaurantOrder).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .passthrough();
export const PageRestaurantOrder = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(RestaurantOrder),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageRestaurantOrder.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const AcceptOrderRequest = z
  .object({ additionalPrepTime: z.number().int(), delayReason: z.string() })
  .partial()
  .passthrough();

export const schemas = {
  RestaurantOrder,
  ApiResponseListRestaurantOrder,
  SortObject,
  PageableObject,
  PageRestaurantOrder,
  ApiResponsePageRestaurantOrder,
  AcceptOrderRequest,
};

export const endpoints = makeApi([
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
        schema: z.record(z.object({}).partial().passthrough()),
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
