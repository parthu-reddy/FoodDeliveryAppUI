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
    errorCode: z.string().optional(),
    data: z.object({}).partial().passthrough().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const SupportTicket = z
  .object({
    version: z.number().int().optional(),
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    reason: z.string(),
    status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
    resolutionNotes: z.string().optional(),
    resolvedBy: z.string().uuid().optional(),
    createdAt: z.string().datetime({ offset: true }),
    resolvedAt: z.string().datetime({ offset: true }).optional(),
    chatSessionId: z.string().uuid().optional(),
    requestedRefundItems: z.string().optional(),
    refundAmount: z.number().optional(),
    restaurantComments: z.string().optional(),
    riderComments: z.string().optional(),
  })
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
    errorCode: z.string().optional(),
    data: z.record(z.object({}).partial().passthrough()).optional(),
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
export const PageOrderResponse = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(OrderResponse),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageOrderResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseListOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(OrderResponse).optional(),
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
    ]),
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
    refundedAmount: z.number().optional(),
    distanceKm: z.number().optional(),
    deliveryExecutiveId: z.string().uuid().optional(),
    deliveryAddressId: z.string().uuid().optional(),
    deliveryLat: z.number().optional(),
    deliveryLng: z.number().optional(),
    deliveryAddress: z.string().optional(),
    pickupOtp: z.string().optional(),
    otp: z.string().optional(),
    estimatedPrepTimeMinutes: z.number().int().optional(),
    estimatedCompletionTime: z.number().int().optional(),
    cancellationReason: z.string().optional(),
    version: z.number().int().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    deliveredAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
export const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: SortObject,
  })
  .partial()
  .passthrough();
export const PageOrder = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(Order),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const PageSupportTicket = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(SupportTicket),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
