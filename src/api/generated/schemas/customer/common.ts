import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const Customer = z
  .object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
export const ApiResponseCustomer = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: Customer.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const OrderItemRequest = z
  .object({ menuItemId: z.string().uuid(), quantity: z.number().int().gte(1) })
  .passthrough();
export const OrderRequest = z
  .object({
    quoteId: z.string().uuid(),
    customerId: z.string().uuid(),
    customerName: z.string().optional(),
    restaurantId: z.string().uuid(),
    deliveryAddressId: z.string().uuid(),
    paymentMethod: z.enum(["CARD", "UPI", "WALLET", "COD"]).optional(),
    items: z.array(OrderItemRequest),
  })
  .passthrough();
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
    total: z.number(),
    subtotal: z.number(),
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
    deliveryExecutiveId: z.string().uuid().optional(),
    paymentIntent: z.string().optional(),
    pickupOtp: z.string().optional(),
    otp: z.string().optional(),
    estimatedCompletionTime: z.number().int().optional(),
    remainingPingSeconds: z.number().int().optional(),
    distanceKm: z.number().optional(),
    expiresAt: z.number().int().optional(),
  })
  .passthrough();
export const ApiResponseOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: OrderResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const DelayApprovalRequest = z.object({ approved: z.boolean() }).passthrough();
export const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.object({}).partial().passthrough().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const QuoteRequest = z
  .object({
    restaurantId: z.string().uuid(),
    deliveryAddressId: z.string().uuid(),
    items: z.array(OrderItemRequest).optional(),
  })
  .passthrough();
export const QuoteResponse = z
  .object({
    quoteId: z.string().uuid(),
    expiresAt: z.string().datetime({ offset: true }),
    subtotal: z.number(),
    deliveryFee: z.number(),
    platformFee: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    total: z.number(),
    minAmountForFreeDelivery: z.number(),
    distanceKm: z.number(),
    driverPayout: z.number(),
    restaurantDeliveryContribution: z.number(),
  })
  .passthrough();
export const ApiResponseQuoteResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: QuoteResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const DriverOrderEarnings = z
  .object({
    id: z.string().uuid(),
    driverId: z.string().uuid(),
    grossPayout: z.number(),
    taxes: z.number(),
    netPayout: z.number(),
    customerContribution: z.number(),
    restaurantContribution: z.number(),
    platformBonus: z.number(),
  })
  .partial()
  .passthrough();
export const Item = z
  .object({ orderItemId: z.string().uuid(), quantity: z.number().int() })
  .partial()
  .passthrough();
export const RefundCommand = z
  .object({
    id: z.string().uuid(),
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
export const RefundView = z
  .object({
    id: z.string().uuid(),
    amount: z.number(),
    status: z.enum([
      "REQUESTED",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ]),
    destination: z.enum(["ORIGINAL_METHOD", "STORE_CREDIT", "NONE"]),
    method: z.enum(["CARD", "UPI", "WALLET", "COD"]),
    reasonCode: z.string(),
    requestedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }),
    expectedBy: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const ReviewRequest = z.object({ notes: z.string() }).partial().passthrough();
export const SupportTicket = z
  .object({
    version: z.number().int().optional(),
    id: z.string().uuid(),
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
export const ResolveRequest = z
  .object({
    approved: z.boolean(),
    notes: z.string().optional(),
    faultType: z.string().optional(),
    overrideAmount: z.number().optional(),
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
export const ApiResponseListCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(CustomerAddressDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const AddressRequest = z
  .object({
    label: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  })
  .passthrough();
export const ApiResponseCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: CustomerAddressDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
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
export const ApiResponseBoolean = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.boolean().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseListObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(z.object({}).partial().passthrough()).optional(),
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
export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const PageableObject = z
  .object({
    unpaged: z.boolean(),
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    offset: z.number().int(),
  })
  .passthrough();
export const PageOrderResponse = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(OrderResponse),
    number: z.number().int(),
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
export const JsonNode = z.object({}).partial().passthrough();
export const RestaurantSummary = z
  .object({
    orders: z.number().int(),
    grossFoodCost: z.number(),
    platformFees: z.number(),
    deliveryContribution: z.number(),
    platformBonus: z.number(),
    netEarnings: z.number(),
    clawbacks: z.number(),
    pendingBalance: z.number(),
    lastPayout: JsonNode,
    beneficiaryStatus: JsonNode,
  })
  .partial()
  .passthrough();
export const RestaurantOrderEarnings = z
  .object({
    id: z.string().uuid(),
    restaurantId: z.string().uuid(),
    foodCost: z.number(),
    platformFee: z.number(),
    deliveryContribution: z.number(),
    netPayout: z.number(),
  })
  .partial()
  .passthrough();
export const DriverSummary = z
  .object({
    deliveries: z.number().int(),
    gross: z.number(),
    taxes: z.number(),
    net: z.number(),
    cashCollected: z.number(),
    cashRemitted: z.number(),
    cashInHand: z.number(),
    pendingBalance: z.number(),
    lastPayout: JsonNode,
  })
  .partial()
  .passthrough();
export const ReceiptItem = z
  .object({ name: z.string(), quantity: z.number().int(), price: z.number() })
  .partial()
  .passthrough();
export const CustomerReceipt = z
  .object({
    items: z.array(ReceiptItem),
    subtotal: z.number(),
    deliveryFee: z.number(),
    platformFee: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    total: z.number(),
    paymentMethod: z.string(),
    paidAt: z.string().datetime({ offset: true }),
    refunds: z.array(RefundView),
    storeCreditUsed: z.number(),
  })
  .partial()
  .passthrough();
export const ApiResponseListRefundView = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(RefundView).optional(),
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
    paymentMethod: z.enum(["CARD", "UPI", "WALLET", "COD"]).optional(),
    cashCollectedAmount: z.number().optional(),
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
        "PENDING_COLLECTION",
        "COLLECTED",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
        "REFUND_PENDING",
        "REFUND_FAILED",
      ])
      .optional(),
    total: z.number(),
    subtotal: z.number().optional(),
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
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(Order),
    number: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const PageSupportTicket = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(SupportTicket),
    number: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const LedgerStatementLineDto = z
  .object({
    transactionId: z.string().uuid(),
    referenceId: z.string().uuid(),
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
      "CASH_COLLECTED",
      "CASH_REMITTED",
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
export const AdminOrderMoney = z
  .object({
    id: z.string().uuid(),
    total: z.number(),
    foodCost: z.number(),
    deliveryFee: z.number(),
    customerPlatformFee: z.number(),
    restaurantPayout: z.number(),
    restaurantPlatformFee: z.number(),
    restaurantDeliveryContribution: z.number(),
    driverGrossPayout: z.number(),
    driverTaxes: z.number(),
    driverNetPayout: z.number(),
    platformBonus: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    ledgerLines: z.array(LedgerStatementLineDto),
  })
  .partial()
  .passthrough();
export const PageMapStringObject = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(z.record(z.object({}).partial().passthrough())),
    number: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const PageCustomerAddressDto = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(CustomerAddressDto),
    number: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageCustomerAddressDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const SseEmitter = z
  .object({ timeout: z.number().int() })
  .partial()
  .passthrough();
export const Pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: SortObject,
  })
  .partial()
  .passthrough();
