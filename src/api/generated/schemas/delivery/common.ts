import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const DeliveryExecutive = z
  .object({
    id: z.string().uuid(),
    fullName: z.string().optional(),
    phoneNumber: z.string(),
    vehicleNumber: z.string().optional(),
    photoUrl: z.string().optional(),
    email: z.string().optional(),
    status: z.enum(["OFFLINE", "ONLINE", "ON_DELIVERY"]),
    verificationStatus: z
      .enum([
        "PENDING",
        "APPROVED",
        "VERIFIED",
        "REJECTED",
        "MANUAL_REVIEW",
        "FAILED",
      ])
      .optional(),
    vehicleType: z
      .enum(["BICYCLE", "MCWG", "LMV", "EV_TWO_WHEELER"])
      .optional(),
    active: z.boolean().optional(),
    lastBiometricVerificationAt: z
      .string()
      .datetime({ offset: true })
      .optional(),
    cityId: z.string().optional(),
    version: z.number().int().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const LocationPayload = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    speedKmh: z.number(),
    isMockLocation: z.boolean(),
    timestampMs: z.number().int(),
  })
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
export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: SortObject,
  })
  .partial()
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
export const PageDeliveryExecutive = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(DeliveryExecutive),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const DriverLocationDTO = z
  .object({
    id: z.string().uuid(),
    fullName: z.string().optional(),
    phoneNumber: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    status: z.string(),
  })
  .passthrough();
export const PageDriverLocationDTO = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(DriverLocationDTO),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
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
    sort: SortObject,
  })
  .partial()
  .passthrough();
export const SseEmitter = z
  .object({ timeout: z.number().int() })
  .partial()
  .passthrough();
