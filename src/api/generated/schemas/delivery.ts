import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const LocationPayload = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    speedKmh: z.number(),
    isMockLocation: z.boolean(),
    timestampMs: z.number().int(),
  })
  .partial()
  .passthrough();
const TelemetryEventRequest = z
  .object({
    driverId: z
      .string()
      .min(0)
      .max(36)
      .regex(/^[0-9a-fA-F\-]{36}$/),
    lat: z.number(),
    lng: z.number(),
    orderId: z
      .string()
      .min(0)
      .max(36)
      .regex(/^[0-9a-fA-F\-]{36}$/)
      .optional(),
    speedKmh: z.number().optional(),
    isMockLocation: z.boolean().optional(),
    timestampMs: z.number().int().optional(),
  })
  .passthrough();
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
const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
const DeliveryExecutive = z
  .object({
    id: z.string().uuid(),
    fullName: z.string(),
    phoneNumber: z.string(),
    vehicleNumber: z.string(),
    photoUrl: z.string(),
    email: z.string(),
    status: z.enum(["OFFLINE", "ONLINE", "ON_DELIVERY"]),
    verificationStatus: z.enum([
      "PENDING",
      "APPROVED",
      "VERIFIED",
      "REJECTED",
      "MANUAL_REVIEW",
      "FAILED",
    ]),
    vehicleType: z.enum(["BICYCLE", "MCWG", "LMV", "EV_TWO_WHEELER"]),
    active: z.boolean(),
    lastBiometricVerificationAt: z.string().datetime({ offset: true }),
    version: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({}).partial().passthrough(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({}).partial().passthrough(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseDeliveryExecutive = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: DeliveryExecutive,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const Pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
const SortObject = z
  .object({
    direction: z.string(),
    nullHandling: z.string(),
    ascending: z.boolean(),
    property: z.string(),
    ignoreCase: z.boolean(),
  })
  .partial()
  .passthrough();
const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: z.array(SortObject),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .partial()
  .passthrough();
const PageDeliveryExecutive = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(DeliveryExecutive),
    number: z.number().int(),
    sort: z.array(SortObject),
    first: z.boolean(),
    pageable: PageableObject,
    last: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const DriverLocationDTO = z
  .object({
    id: z.string().uuid(),
    fullName: z.string(),
    phoneNumber: z.string(),
    lat: z.number(),
    lng: z.number(),
    status: z.string(),
  })
  .partial()
  .passthrough();
const PageDriverLocationDTO = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(DriverLocationDTO),
    number: z.number().int(),
    sort: z.array(SortObject),
    first: z.boolean(),
    pageable: PageableObject,
    last: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const JsonNode = z.object({}).partial().passthrough();
const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.string()),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(z.record(z.object({}).partial().passthrough())),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const SseEmitter = z
  .object({ timeout: z.number().int() })
  .partial()
  .passthrough();

export const schemas = {
  LocationPayload,
  TelemetryEventRequest,
  ToggleStatusRequest,
  DeliveryOnboardRequest,
  UpdateOrderStatusRequest,
  pageable,
  DeliveryExecutive,
  ApiResponseObject,
  ApiResponseVoid,
  ApiResponseDeliveryExecutive,
  Pageable,
  SortObject,
  PageableObject,
  PageDeliveryExecutive,
  DriverLocationDTO,
  PageDriverLocationDTO,
  JsonNode,
  ApiResponseMapStringString,
  ApiResponseListMapStringObject,
  SseEmitter,
};

const endpoints = makeApi([
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
    path: "/api/delivery/verification/bank-account",
    alias: "verifyBankAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/delivery/verification/biometric",
    alias: "verifyBiometric",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/delivery/verification/download-url",
    alias: "getPresignedDownloadUrl",
    requestFormat: "json",
    parameters: [
      {
        name: "objectKey",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/delivery/verification/driving-license",
    alias: "verifyDrivingLicense",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/delivery/verification/status",
    alias: "getVerificationStatus",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/delivery/verification/upload-url",
    alias: "getPresignedUploadUrl",
    requestFormat: "json",
    parameters: [
      {
        name: "docType",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "contentType",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/delivery/verification/vehicle-rc",
    alias: "verifyVehicleRC",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
    ],
    response: z.void(),
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/delivery/orders/available",
    alias: "getAvailableOrders",
    requestFormat: "json",
    response: z.void(),
  },
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
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/delivery/telemetry/batch",
    alias: "processBatchTelemetry",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(TelemetryEventRequest),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/delivery/telemetry/sync",
    alias: "syncLocation",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LocationPayload,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/:driverId",
    alias: "getDriverById",
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
    path: "/api/v1/internal/admin/delivery/drivers/all-with-location",
    alias: "getAllDriversWithLocation",
    requestFormat: "json",
    parameters: [
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/available",
    alias: "getAvailableDrivers",
    requestFormat: "json",
    parameters: [
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/available-with-location",
    alias: "getAvailableDriversWithLocation",
    requestFormat: "json",
    parameters: [
      {
        name: "lat",
        type: "Query",
        schema: z.number().optional().default(0),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number().optional().default(0),
      },
      {
        name: "radiusKm",
        type: "Query",
        schema: z.number().optional().default(50),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/delivery/drivers/batch",
    alias: "getDriversByIds",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(z.string().uuid()),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/delivery/orders/:orderId/assign",
    alias: "forceAssignOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "driverId",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/delivery/drivers/:driverId/suspend",
    alias: "suspendDriver",
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
    path: "/api/v1/logistics/route",
    alias: "getRoute",
    requestFormat: "json",
    parameters: [
      {
        name: "sourceLat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "sourceLng",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "destLat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "destLng",
        type: "Query",
        schema: z.number(),
      },
    ],
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
