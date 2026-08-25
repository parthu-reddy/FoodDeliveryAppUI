import { z } from "zod";

export const OrderItemResponse = z
  .object({
    id: z.string().uuid(),
    menuItemId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().int(),
    price: z.number(),
  })
  .passthrough();
export const OrderResponse = z
  .object({
    id: z.string().uuid(),
    customerId: z.string().uuid(),
    restaurantId: z.string().uuid(),
    restaurantName: z.string(),
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
    totalAmount: z.number(),
    itemTotal: z.number(),
    foodCost: z.number(),
    customerPlatformFee: z.number(),
    restaurantPlatformFee: z.number().optional(),
    platformBonus: z.number().optional(),
    restaurantDeliveryContribution: z.number().optional(),
    restaurantPayout: z.number().optional(),
    sgst: z.number(),
    cgst: z.number(),
    deliveryFee: z.number(),
    driverGrossPayout: z.number().optional(),
    driverTaxes: z.number().optional(),
    driverNetPayout: z.number().optional(),
    deliveryAddress: z.string(),
    deliveryLat: z.number().optional(),
    deliveryLng: z.number().optional(),
    items: z.array(OrderItemResponse),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
    riderId: z.string().uuid().optional(),
    paymentIntent: z.string().optional(),
    pickupOtp: z.string().optional(),
    otp: z.string().optional(),
    estimatedCompletionTime: z.number().int().optional(),
    remainingPingSeconds: z.number().int().optional(),
    distanceKm: z.number().optional(),
    expiresAt: z.number().int().optional(),
  })
  .passthrough();
export const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({}).partial().passthrough().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const SupportTicket = z
  .object({
    version: z.number().int(),
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    reason: z.string(),
    status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
    resolutionNotes: z.string(),
    resolvedBy: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    resolvedAt: z.string().datetime({ offset: true }),
    chatSessionId: z.string().uuid(),
    requestedRefundItems: z.string(),
    refundAmount: z.number(),
    restaurantComments: z.string(),
    riderComments: z.string(),
  })
  .partial()
  .passthrough();
export const CustomerAddressDto = z
  .object({
    id: z.string().uuid(),
    customerId: z.string().uuid(),
    label: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    isDefault: z.boolean().optional(),
  })
  .passthrough();
export const ApiResponseMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.object({}).partial().passthrough()).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
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
export const PageOrderResponse = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(OrderResponse),
    first: z.boolean(),
    last: z.boolean(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const ApiResponsePageOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: PageOrderResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseListOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(OrderResponse).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const Order = z
  .object({
    id: z.string().uuid(),
    customerId: z.string().uuid(),
    customerName: z.string(),
    restaurantId: z.string().uuid(),
    restaurantName: z.string(),
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
    paymentStatus: z.enum([
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
    ]),
    totalAmount: z.number(),
    itemTotal: z.number(),
    customerPlatformFee: z.number(),
    restaurantPlatformFee: z.number(),
    platformBonus: z.number(),
    restaurantDeliveryContribution: z.number(),
    restaurantPayout: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    deliveryFee: z.number(),
    driverGrossPayout: z.number(),
    driverTaxes: z.number(),
    driverNetPayout: z.number(),
    refundedAmount: z.number(),
    distanceKm: z.number(),
    deliveryExecutiveId: z.string().uuid(),
    deliveryAddressId: z.string().uuid(),
    deliveryLat: z.number(),
    deliveryLng: z.number(),
    deliveryAddress: z.string(),
    pickupOtp: z.string(),
    otp: z.string(),
    estimatedPrepTimeMinutes: z.number().int(),
    estimatedCompletionTime: z.number().int(),
    cancellationReason: z.string(),
    version: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    deliveredAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
export const PageOrder = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(Order),
    first: z.boolean(),
    last: z.boolean(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const PageSupportTicket = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(SupportTicket),
    first: z.boolean(),
    last: z.boolean(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
