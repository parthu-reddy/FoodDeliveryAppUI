import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { pageable } from "./common";
import { PageableObject } from "./common";
import { SortObject } from "./common";

export const OrderReviewItemDto = z
  .object({ menuItemId: z.string().uuid(), name: z.string() })
  .partial()
  .passthrough();
export const OrderReviewContextDto = z
  .object({
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    customerName: z.string(),
    restaurantId: z.string().uuid(),
    restaurantName: z.string(),
    deliveryExecutiveId: z.string().uuid(),
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
    deliveredAt: z.string().datetime({ offset: true }),
    items: z.array(OrderReviewItemDto),
  })
  .partial()
  .passthrough();
export const ApiResponseOrderReviewContextDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: OrderReviewContextDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const Order = z
  .object({
    id: z.string().uuid(),
    customerId: z.string().uuid(),
    customerName: z.string().optional(),
    restaurantId: z.string().uuid(),
    restaurantName: z.string().optional(),
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
    paymentMethod: z.enum(["CARD", "UPI", "WALLET"]).optional(),
    deliveryStatus: z
      .enum([
        "PENDING",
        "SEARCHING_FOR_DRIVER",
        "MANUAL_INTERVENTION_REQUIRED",
        "ASSIGNED",
        "AT_RESTAURANT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
      ])
      .optional(),
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
    totalAmount: z.number(),
    itemTotal: z.number().optional(),
    customerPlatformFee: z.number().optional(),
    restaurantPlatformFee: z.number().optional(),
    platformBonus: z.number().optional(),
    restaurantDeliveryContribution: z.number().optional(),
    restaurantPayout: z.number().optional(),
    sgst: z.number().optional(),
    cgst: z.number().optional(),
    deliveryFee: z.number().optional(),
    driverGrossPayout: z.number().optional(),
    driverTaxes: z.number().optional(),
    driverNetPayout: z.number().optional(),
    quoteId: z.string().uuid().optional(),
    rateBasePrice: z.number().optional(),
    ratePerKm: z.number().optional(),
    rateRestMaxContributionPercent: z.number().optional(),
    rateFixedPlatformFee: z.number().optional(),
    ratePlatformExcessCutPercent: z.number().optional(),
    rateSgstPercent: z.number().optional(),
    rateCgstPercent: z.number().optional(),
    rateDeliverySgstPercent: z.number().optional(),
    rateDeliveryCgstPercent: z.number().optional(),
    distanceKm: z.number().optional(),
    deliveryExecutiveId: z.string().uuid().optional(),
    deliveryAddressId: z.string().uuid().optional(),
    deliveryLat: z.number().optional(),
    deliveryLng: z.number().optional(),
    deliveryAddress: z.string().optional(),
    dispatchCityId: z.string().optional(),
    fleetSearchRadiusKm: z.number().optional(),
    pickupOtp: z.string().optional(),
    otp: z.string().optional(),
    estimatedPrepTimeMinutes: z.number().int().optional(),
    estimatedCompletionTime: z.number().int().optional(),
    cancellationReason: z.string().optional(),
    requestedDelayMinutes: z.number().int().optional(),
    delayReason: z.string().optional(),
    version: z.number().int().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    deliveredAt: z.string().datetime({ offset: true }).optional(),
    deliveryTravelSeconds: z.number().int().optional(),
    handedOverAt: z.number().int().optional(),
  })
  .passthrough();
export const PageOrder = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(Order),
    number: z.number().int(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();

export const schemas = {
  OrderReviewItemDto,
  OrderReviewContextDto,
  ApiResponseOrderReviewContextDto,
  Order,
  PageOrder,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/orders/:orderId/review-context",
    alias: "fetchOrderReviewContext",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseOrderReviewContextDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/:orderId/participants",
    alias: "fetchOrderParticipants",
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
    path: "/api/v1/internal/orders/:orderId/dispatch-details",
    alias: "fetchOrderDispatchDetails",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.string()),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/unassigned",
    alias: "fetchUnassignedOrders",
    requestFormat: "json",
    response: z.array(Order),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/driver/:driverId/history",
    alias: "fetchOrderHistoryForDriver",
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
    alias: "fetchActiveOrdersForDriver",
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
