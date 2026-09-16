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
    totalAmount: z.number(),
    itemTotal: z.number(),
    customerPlatformFee: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    deliveryFee: z.number(),
    deliveryAddress: z.string(),
    deliveryLat: z.number().optional(),
    deliveryLng: z.number().optional(),
    items: z.array(OrderItemResponse),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
    riderId: z.string().uuid().optional(),
    deliveryExecutiveId: z.string().uuid().optional(),
    customerName: z.string().optional(),
    deliveryExecutiveName: z.string().optional(),
    paymentIntent: z.string().optional(),
    pickupOtp: z.string().optional(),
    otp: z.string().optional(),
    estimatedCompletionTime: z.number().int().optional(),
    remainingPingSeconds: z.number().int().optional(),
    distanceKm: z.number().optional(),
    paymentMethod: z.enum(["CARD", "UPI", "WALLET"]).optional(),
    cancellationReason: z.string().optional(),
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
export const Item = z
  .object({ orderItemId: z.string().uuid(), quantity: z.number().int() })
  .partial()
  .passthrough();
export const RefundCommand = z
  .object({
    orderId: z.string().uuid(),
    amount: z.number(),
    items: z.array(Item),
    reasonCode: z.string(),
    reasonText: z.string(),
    faultType: z.enum([
      "PLATFORM_FAULT",
      "RESTAURANT_FAULT",
      "RIDER_FAULT",
      "CUSTOMER_FAULT",
      "UNKNOWN",
    ]),
    destination: z.enum(["ORIGINAL_METHOD", "STORE_CREDIT", "NONE"]),
    source: z.enum([
      "CUSTOMER_TICKET",
      "RESTAURANT",
      "ADMIN",
      "SYSTEM_CANCELLATION",
      "SYSTEM_DELIVERY_FAILED",
      "SYSTEM_LATE_PAYMENT",
    ]),
    initiatorType: z.enum(["CUSTOMER", "RESTAURANT", "ADMIN", "SYSTEM"]),
    initiatorId: z.string().uuid(),
    idempotencyKey: z.string(),
    ticketId: z.string().uuid(),
  })
  .partial()
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
export const RefundView = z
  .object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    amount: z.number(),
    status: z.enum([
      "REQUESTED",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ]),
    destination: z.enum(["ORIGINAL_METHOD", "STORE_CREDIT", "NONE"]),
    method: z.enum(["CARD", "UPI", "WALLET"]),
    reasonCode: z.string(),
    requestedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }),
    expectedBy: z.string().datetime({ offset: true }),
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
export const PageResponseDtoOrderResponse = z
  .object({
    content: z.array(OrderResponse),
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
export const ApiResponsePageResponseDtoOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoOrderResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PayoutSummaryDto = z
  .object({
    payoutId: z.string(),
    amount: z.number(),
    status: z.string(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const LedgerStatementLineDto = z
  .object({
    transactionId: z.string().uuid(),
    referenceId: z.string().uuid(),
    accountId: z.string().uuid(),
    ownerId: z.string().uuid(),
    ownerType: z.enum([
      "GATEWAY_RECEIVABLE",
      "BANK",
      "PLATFORM_CLEARING",
      "PLATFORM_REVENUE",
      "TAX_PAYABLE",
      "PAYOUT_IN_TRANSIT",
      "RESTAURANT_PAYABLE",
      "DRIVER_PAYABLE",
      "CUSTOMER_CREDIT",
      "ADVERTISER_PREPAID",
    ]),
    category: z.enum([
      "DELIVERY_FEE",
      "PLATFORM_FIXED_FEE",
      "PLATFORM_BONUS",
      "FOOD_COST",
      "SGST",
      "CGST",
      "REFUND",
      "ORDER_TOTAL",
      "AD_IMPRESSION",
      "AD_CLICK",
      "AD_CONVERSION",
      "AD_WALLET_TOPUP",
      "CLAWBACK",
      "PAYOUT_TRANSFER",
      "STORE_CREDIT",
    ]),
    amount: z.number(),
    direction: z.enum(["CREDIT", "DEBIT"]),
    createdAt: z.string().datetime({ offset: true }),
    description: z.string(),
    payoutId: z.string().uuid(),
    payoutStatus: z.string(),
    settled: z.boolean(),
  })
  .partial()
  .passthrough();
export const PageResponseDtoLedgerStatementLineDto = z
  .object({
    content: z.array(LedgerStatementLineDto),
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
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
    offset: z.number().int(),
  })
  .passthrough();
