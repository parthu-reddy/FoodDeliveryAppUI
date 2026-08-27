import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const DeliveryExecutive = z
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
    cityId: z.string(),
    version: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const LocationPayload = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    speedKmh: z.number(),
    isMockLocation: z.boolean(),
    timestampMs: z.number().int(),
  })
  .partial()
  .passthrough();
export const TelemetryEventRequest = z
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
export const RCRequest = z
  .object({
    registrationNumber: z.string(),
    documentUrl: z.string().optional(),
  })
  .passthrough();
export const ApiResponseObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.object({}).partial().passthrough().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const DLRequest = z
  .object({
    dlNumber: z.string(),
    dateOfBirth: z.string(),
    documentUrl: z.string().optional(),
  })
  .passthrough();
export const BiometricRequest = z.object({ selfieUrl: z.string() }).passthrough();
export const BankRequest = z
  .object({
    accountNumber: z.string(),
    ifscCode: z.string(),
    kycFullName: z.string(),
  })
  .passthrough();
export const ToggleStatusRequest = z
  .object({
    driverId: z
      .string()
      .min(0)
      .max(36)
      .regex(/^[0-9a-fA-F\-]{36}$/),
    available: z.boolean(),
  })
  .passthrough();
export const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.object({}).partial().passthrough().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const DeliveryOnboardRequest = z
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
export const ApiResponseDeliveryExecutive = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: DeliveryExecutive.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const UpdateOrderStatusRequest = z
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
export const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
export const SortObject = z
  .object({
    direction: z.string(),
    nullHandling: z.string(),
    ascending: z.boolean(),
    property: z.string(),
    ignoreCase: z.boolean(),
  })
  .partial()
  .passthrough();
export const PageableObject = z
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
export const PageDeliveryExecutive = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(DeliveryExecutive),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const DriverLocationDTO = z
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
export const PageDriverLocationDTO = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(DriverLocationDTO),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const JsonNode = z.object({}).partial().passthrough();
export const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.record(z.string()).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseListMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(z.record(z.object({}).partial().passthrough())).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const Pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
export const SseEmitter = z
  .object({ timeout: z.number().int() })
  .partial()
  .passthrough();
