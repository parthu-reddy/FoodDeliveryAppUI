import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";

export const RestaurantOrder = z
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
      "CANCELLED_BY_PLATFORM",
      "DELIVERY_FAILED",
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
    dispatchCityId: z.string().optional(),
    fleetSearchRadiusKm: z.number().optional(),
    pickupOtp: z.string().optional(),
    deliveryOtp: z.string().optional(),
    deliveryExecutiveId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    paymentMethod: z.enum(["CARD", "UPI", "WALLET"]).optional(),
    customerName: z.string().optional(),
    foodCost: z.number().optional(),
    restaurantPlatformFee: z.number().optional(),
    restaurantDeliveryContribution: z.number().optional(),
    platformBonus: z.number().optional(),
    restaurantPayout: z.number().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
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
export const PageResponseDtoRestaurantOrder = z
  .object({
    content: z.array(RestaurantOrder),
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
export const ApiResponsePageResponseDtoRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoRestaurantOrder.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PartialRefundRequestDto = z
  .object({
    amount: z.number().gte(0.01),
    reason: z.string().optional(),
    items: z.array(z.string()).optional(),
  })
  .passthrough();
export const AcceptOrderRequest = z
  .object({ additionalPrepTime: z.number().int(), delayReason: z.string() })
  .partial()
  .passthrough();

export const schemas = {
  RestaurantOrder,
  ApiResponseListRestaurantOrder,
  PageResponseDtoRestaurantOrder,
  ApiResponsePageResponseDtoRestaurantOrder,
  PartialRefundRequestDto,
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
        schema: PartialRefundRequestDto,
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
        name: "from",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
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
    response: ApiResponsePageResponseDtoRestaurantOrder,
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
