import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const ToggleStatusRequest = z
  .object({
    driverId: z
      .string()
      .min(0)
      .max(36)
      .regex(/^[0-9a-fA-F\-]{36}$/),
    available: z.boolean(),
  })
  .passthrough();
const DeliveryOnboardRequest = z
  .object({
    fullName: z.string().min(0).max(100),
    phoneNumber: z
      .string()
      .min(0)
      .max(20)
      .regex(/^\+?[1-9]\d{1,14}$/),
    vehicleNumber: z.string().min(0).max(50),
    photoUrl: z.string().min(0).max(255).optional(),
    vehicleType: z
      .enum(["BICYCLE", "MCWG", "LMV", "EV_TWO_WHEELER"])
      .optional(),
  })
  .passthrough();
const UpdateOrderStatusRequest = z
  .object({
    status: z.enum([
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
    pickupOtp: z.string().min(0).max(10).regex(/^\d+$/).optional(),
    deliveryOtp: z.string().min(0).max(10).regex(/^\d+$/).optional(),
    goOfflineAfter: z.boolean().optional(),
  })
  .passthrough();

export const schemas = {
  ToggleStatusRequest,
  DeliveryOnboardRequest,
  UpdateOrderStatusRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/delivery/status",
    alias: "toggleStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ToggleStatusRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/delivery/onboard",
    alias: "onboardDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DeliveryOnboardRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/delivery/drivers/:driverId/orders/:orderId/status",
    alias: "updateOrderStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateOrderStatusRequest,
      },
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/delivery/drivers/:driverId/orders/:orderId/reject",
    alias: "rejectOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/delivery/drivers/:driverId/orders/:orderId/accept",
    alias: "acceptOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/delivery/drivers/:driverId/orders/:orderId/abort",
    alias: "abortOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/delivery/profile",
    alias: "getProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/delivery/drivers/:driverId/pings",
    alias: "getPendingPings",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/delivery/drivers/:driverId/orders/:orderId/restaurant-status-stream",
    alias: "streamRestaurantStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
]);

export const Delivery_executive_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
