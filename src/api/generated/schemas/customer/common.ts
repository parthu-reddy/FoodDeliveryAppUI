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
    orderId: z.string().uuid(),
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
export const ReviewRequest = z.object({ notes: z.string() }).partial().passthrough();
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
export const ResolveRequest = z
  .object({
    approved: z.boolean(),
    notes: z.string().optional(),
    faultType: z.string().optional(),
    overrideAmount: z.number().optional(),
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
    method: z.enum(["CARD", "UPI", "WALLET", "COD"]),
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
export const PricingConfigDto = z
  .object({
    basePrice: z.number(),
    perKmRate: z.number(),
    restMaxContributionPercent: z.number(),
    fixedPlatformFee: z.number(),
    platformExcessCutPercent: z.number(),
    sgstPercent: z.number(),
    cgstPercent: z.number(),
  })
  .partial()
  .passthrough();
export const DeliveryPricingDto = z
  .object({ distanceKm: z.number(), config: PricingConfigDto })
  .partial()
  .passthrough();
export const ApiResponseDeliveryPricingDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: DeliveryPricingDto.optional(),
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
export const SponsoredListingDTO = z
  .object({
    adId: z.string(),
    campaignId: z.string(),
    impressionUrl: z.string(),
    clickUrl: z.string(),
    adm: z.string(),
    creativeFormat: z.string(),
  })
  .partial()
  .passthrough();
export const RestaurantDto = z
  .object({
    id: z.string().uuid(),
    brandId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    rating: z.number(),
    distance: z.number(),
    isSponsored: z.boolean(),
    adData: SponsoredListingDTO,
  })
  .partial()
  .passthrough();
export const ApiResponseListRestaurantDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(RestaurantDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PlaceGeocodeDto = z
  .object({
    formattedAddress: z.string(),
    placeId: z.string(),
    lat: z.number(),
    lng: z.number(),
  })
  .partial()
  .passthrough();
export const ApiResponsePlaceGeocodeDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PlaceGeocodeDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PlaceAutocompleteDto = z
  .object({ placeId: z.string(), description: z.string() })
  .partial()
  .passthrough();
export const ApiResponseListPlaceAutocompleteDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(PlaceAutocompleteDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
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
export const ApiResponseListOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(OrderResponse).optional(),
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
export const BeneficiaryStatusDto = z
  .object({
    beneficiaryId: z.string(),
    verificationStatus: z.string(),
    active: z.boolean(),
  })
  .partial()
  .passthrough();
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
    lastPayout: PayoutSummaryDto,
    beneficiaryStatus: BeneficiaryStatusDto,
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
      "CASH_RECEIVABLE",
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
export const RestaurantOrderEarnings = z
  .object({
    orderId: z.string().uuid(),
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
    lastPayout: PayoutSummaryDto,
  })
  .partial()
  .passthrough();
export const CashRemittanceDto = z
  .object({
    id: z.string().uuid(),
    driverId: z.string().uuid(),
    amount: z.number(),
    reference: z.string(),
    recordedBy: z.string().uuid(),
    ledgerTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const PageResponseDtoCashRemittanceDto = z
  .object({
    content: z.array(CashRemittanceDto),
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
export const WalletDto = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: z.enum(["CUSTOMER", "ADVERTISER"]),
    balance: z.number(),
    currency: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  })
  .passthrough();
export const PageResponseDtoMapStringObject = z
  .object({
    content: z.array(z.record(z.object({}).partial().passthrough())),
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
export const ReceiptItem = z
  .object({ name: z.string(), quantity: z.number().int(), price: z.number() })
  .partial()
  .passthrough();
export const CustomerReceipt = z
  .object({
    items: z.array(ReceiptItem),
    itemTotal: z.number(),
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
export const PageOrder = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(Order),
    empty: z.boolean(),
  })
  .passthrough();
export const DailyTotalDto = z
  .object({ orderTotals: z.number() })
  .partial()
  .passthrough();
export const DailyPayableDto = z
  .object({ restaurantPayable: z.number(), driverPayable: z.number() })
  .partial()
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
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(SupportTicket),
    empty: z.boolean(),
  })
  .passthrough();
export const RefundLine = z
  .object({
    id: z.string().uuid(),
    amount: z.number(),
    status: z.string(),
    destination: z.string(),
    faultType: z.string(),
    reasonCode: z.string(),
    gatewayRefundId: z.string(),
    failureReason: z.string(),
    requestedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const AdminOrderMoney = z
  .object({
    orderId: z.string().uuid(),
    totalAmount: z.number(),
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
    paymentMethod: z.enum(["CARD", "UPI", "WALLET", "COD"]),
    paymentStatus: z.enum([
      "INITIATED",
      "SUCCESS",
      "FAILED",
      "PENDING_COLLECTION",
      "COLLECTED",
      "PARTIALLY_REFUNDED",
      "REFUNDED",
      "REFUND_PENDING",
      "REFUND_FAILED",
    ]),
    gatewayName: z.enum(["RAZORPAY", "CASHFREE", "VYAPAR"]),
    gatewayOrderId: z.string(),
    refunds: z.array(RefundLine),
    ledgerLines: z.array(LedgerStatementLineDto),
  })
  .partial()
  .passthrough();
export const PageResponseDtoSupportTicket = z
  .object({
    content: z.array(SupportTicket),
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
export const FailedRefundDto = z
  .object({
    refundId: z.string().uuid(),
    orderId: z.string().uuid(),
    amount: z.number(),
    status: z.enum([
      "REQUESTED",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ]),
    errorMessage: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    customerName: z.string().uuid(),
    restaurantId: z.string().uuid(),
    orderStatus: z.enum([
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
    totalAmount: z.number(),
  })
  .partial()
  .passthrough();
export const PageResponseDtoFailedRefundDto = z
  .object({
    content: z.array(FailedRefundDto),
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
export const PageResponseDtoCustomerAddressDto = z
  .object({
    content: z.array(CustomerAddressDto),
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
export const ApiResponsePageResponseDtoCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoCustomerAddressDto.optional(),
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
