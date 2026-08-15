import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const Customer = z
  .object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const OrderItemRequest = z
  .object({ menuItemId: z.string().uuid(), quantity: z.number().int().gte(1) })
  .passthrough();
const OrderRequest = z
  .object({
    customerId: z.string().uuid(),
    customerName: z.string().optional(),
    restaurantId: z.string().uuid(),
    deliveryAddressId: z.string().uuid(),
    items: z.array(OrderItemRequest),
  })
  .passthrough();
const DelayApprovalRequest = z
  .object({ approved: z.boolean() })
  .partial()
  .passthrough();
const VerifyOtp200Response = z
  .object({ success: z.boolean(), data: z.string(), message: z.string() })
  .partial()
  .passthrough();
const PartialRefundRequest = z
  .object({
    amount: z.number(),
    reason: z.string(),
    faultType: z.enum([
      "PLATFORM_FAULT",
      "RESTAURANT_FAULT",
      "RIDER_FAULT",
      "CUSTOMER_FAULT",
      "UNKNOWN",
    ]),
  })
  .partial()
  .passthrough();
const AddressRequest = z
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
const ReviewRequest = z.object({ notes: z.string() }).partial().passthrough();
const ResolveRequest = z
  .object({ approved: z.boolean(), notes: z.string(), faultType: z.string() })
  .partial()
  .passthrough();
const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
const ApiResponseCustomer = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: Customer,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const OrderItemResponse = z
  .object({
    id: z.string().uuid(),
    menuItemId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().int(),
    price: z.number(),
  })
  .partial()
  .passthrough();
const OrderResponse = z
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
    deliveryAddress: z.string(),
    deliveryLat: z.number(),
    deliveryLng: z.number(),
    items: z.array(OrderItemResponse),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    riderId: z.string().uuid(),
    paymentIntent: z.string(),
    pickupOtp: z.string(),
    otp: z.string(),
    estimatedCompletionTime: z.number().int(),
    remainingPingSeconds: z.number().int(),
    distanceKm: z.number(),
    expiresAt: z.number().int(),
  })
  .partial()
  .passthrough();
const ApiResponseOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: OrderResponse,
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
const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.string(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const CustomerAddressDto = z
  .object({
    id: z.string().uuid(),
    customerId: z.string().uuid(),
    label: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    isDefault: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponseCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: CustomerAddressDto,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const SupportTicket = z
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
const ApiResponseMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.object({}).partial().passthrough()),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseBoolean = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.boolean(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(z.object({}).partial().passthrough()),
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
const PageOrderResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(OrderResponse),
    number: z.number().int(),
    sort: z.array(SortObject),
    first: z.boolean(),
    pageable: PageableObject,
    numberOfElements: z.number().int(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponsePageOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: PageOrderResponse,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListOrderResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(OrderResponse),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const Order = z
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
const Pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();
const PageOrder = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(Order),
    number: z.number().int(),
    sort: z.array(SortObject),
    first: z.boolean(),
    pageable: PageableObject,
    numberOfElements: z.number().int(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const PageSupportTicket = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(SupportTicket),
    number: z.number().int(),
    sort: z.array(SortObject),
    first: z.boolean(),
    pageable: PageableObject,
    numberOfElements: z.number().int(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const PageMapStringObject = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(z.record(z.object({}).partial().passthrough())),
    number: z.number().int(),
    sort: z.array(SortObject),
    first: z.boolean(),
    pageable: PageableObject,
    numberOfElements: z.number().int(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const PageCustomerAddressDto = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CustomerAddressDto),
    number: z.number().int(),
    sort: z.array(SortObject),
    first: z.boolean(),
    pageable: PageableObject,
    numberOfElements: z.number().int(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponsePageCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: PageCustomerAddressDto,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(CustomerAddressDto),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  Customer,
  OrderItemRequest,
  OrderRequest,
  DelayApprovalRequest,
  VerifyOtp200Response,
  PartialRefundRequest,
  AddressRequest,
  ReviewRequest,
  ResolveRequest,
  pageable,
  ApiResponseCustomer,
  OrderItemResponse,
  OrderResponse,
  ApiResponseOrderResponse,
  ApiResponseVoid,
  ApiResponseString,
  CustomerAddressDto,
  ApiResponseCustomerAddressDto,
  SupportTicket,
  ApiResponseMapStringObject,
  ApiResponseBoolean,
  ApiResponseListObject,
  ApiResponseListMapStringObject,
  SseEmitter,
  SortObject,
  PageableObject,
  PageOrderResponse,
  ApiResponsePageOrderResponse,
  ApiResponseListOrderResponse,
  Order,
  Pageable,
  PageOrder,
  PageSupportTicket,
  PageMapStringObject,
  PageCustomerAddressDto,
  ApiResponsePageCustomerAddressDto,
  ApiResponseListCustomerAddressDto,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/admin/refunds",
    alias: "getTickets",
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
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/admin/refunds/:ticketId/resolve",
    alias: "resolveTicket",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResolveRequest,
      },
      {
        name: "ticketId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-Admin-Id",
        type: "Header",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/admin/refunds/:ticketId/review",
    alias: "addReviewNotes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ notes: z.string() }).partial().passthrough(),
      },
      {
        name: "ticketId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/customer/orders/:orderId/refund-request",
    alias: "requestPostDeliveryRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
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
    path: "/api/v1/customers/:customerId/addresses",
    alias: "getAddresses",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/customers/:customerId/addresses",
    alias: "addAddress",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddressRequest,
      },
      {
        name: "customerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/v1/customers/:id",
    alias: "updateProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: Customer,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/customers/profile",
    alias: "getProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/customers/profile",
    alias: "createProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: Customer,
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/delivery/orders/active",
    alias: "getActiveOrders_1",
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
    path: "/api/v1/delivery/orders/available",
    alias: "getAvailableOrders",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/delivery/orders/history",
    alias: "getHistoryOrders",
    requestFormat: "json",
    parameters: [
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/customers/addresses",
    alias: "getAllCustomerAddresses",
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
    method: "post",
    path: "/api/v1/internal/admin/orders/:orderId/override-status",
    alias: "overrideOrderStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
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
    path: "/api/v1/internal/admin/orders/:orderId/reconcile",
    alias: "reconcileOrderState",
    requestFormat: "json",
    parameters: [
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
    path: "/api/v1/internal/admin/orders/:orderId/refund/partial",
    alias: "initiatePartialRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartialRefundRequest,
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
    path: "/api/v1/internal/admin/orders/:orderId/refund/post-delivery",
    alias: "initiatePostDeliveryRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PartialRefundRequest,
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
    path: "/api/v1/internal/admin/orders/active-all",
    alias: "getAllActiveOrders",
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
        schema: z.number().int().optional().default(50),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/dlq/refunds",
    alias: "getFailedRefunds",
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
    method: "post",
    path: "/api/v1/internal/admin/orders/dlq/refunds/:orderId/retry",
    alias: "retryRefund",
    requestFormat: "json",
    parameters: [
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
    path: "/api/v1/internal/admin/orders/dlq/retry",
    alias: "retryDlqEvent",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
      {
        name: "topic",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/intervention",
    alias: "getOrdersRequiringIntervention",
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
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/:orderId/assign-driver",
    alias: "assignDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
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
    path: "/api/v1/internal/admin/orders/intervention/:orderId/cancel",
    alias: "cancelOrder_1",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
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
    path: "/api/v1/internal/admin/orders/intervention/:orderId/force-cancel",
    alias: "forceCancelOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
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
    path: "/api/v1/internal/admin/orders/intervention/:orderId/force-refund",
    alias: "forceRefund",
    requestFormat: "json",
    parameters: [
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
    path: "/api/v1/internal/admin/orders/intervention/:orderId/refund/partial",
    alias: "partialRefund_1",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
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
    path: "/api/v1/internal/admin/orders/intervention/:orderId/refund/post-delivery",
    alias: "postDeliveryRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
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
    path: "/api/v1/internal/admin/orders/intervention/support-tickets",
    alias: "getOpenSupportTickets",
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
      {
        name: "status",
        type: "Query",
        schema: z.string().optional().default("OPEN"),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/intervention/support-tickets/:ticketId/resolve",
    alias: "resolveSupportTicket",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
      },
      {
        name: "ticketId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/unassigned",
    alias: "getUnassignedOrders_1",
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
    path: "/api/v1/internal/admin/orders/user/:userId/active",
    alias: "getActiveOrdersForUser",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/auth/initiate",
    alias: "initiateAuth",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z
          .string()
          .min(8)
          .max(20)
          .regex(/^[0-9]+$/),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/auth/verify",
    alias: "verifyOtp",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z
          .string()
          .min(8)
          .max(20)
          .regex(/^[0-9]+$/),
      },
      {
        name: "otp",
        type: "Query",
        schema: z
          .string()
          .min(6)
          .max(6)
          .regex(/^[0-9]{6}$/),
      },
    ],
    response: VerifyOtp200Response,
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/:orderId/invoice",
    alias: "getOrderInvoice",
    requestFormat: "json",
    parameters: [
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
    path: "/api/v1/internal/orders/:orderId/partial-refund",
    alias: "partialRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
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
    path: "/api/v1/internal/orders/:orderId/participants",
    alias: "getOrderParticipants",
    requestFormat: "json",
    parameters: [
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
    path: "/api/v1/internal/orders/driver/:driverId/active",
    alias: "getActiveOrdersForDriver",
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/driver/:driverId/history",
    alias: "getOrderHistoryForDriver",
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/orders/unassigned",
    alias: "getUnassignedOrders",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/orders",
    alias: "createOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OrderRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/orders/:orderId",
    alias: "getOrder",
    requestFormat: "json",
    parameters: [
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
    path: "/api/v1/orders/:orderId/cancel",
    alias: "cancelOrder",
    requestFormat: "json",
    parameters: [
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
    path: "/api/v1/orders/:orderId/delay-approval",
    alias: "handleDelayApproval",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ approved: z.boolean() }).partial().passthrough(),
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
    path: "/api/v1/orders/:orderId/live-tracking",
    alias: "trackOrder",
    requestFormat: "json",
    parameters: [
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
    path: "/api/v1/orders/active",
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
        schema: z.number().int().optional().default(10),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/orders/batch",
    alias: "getOrdersBatch",
    requestFormat: "json",
    parameters: [
      {
        name: "ids",
        type: "Query",
        schema: z.array(z.string().uuid()),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/orders/history",
    alias: "getOrderHistory",
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
        schema: z.number().int().optional().default(10),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/orders/refunds",
    alias: "getRefundOrders",
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
        schema: z.number().int().optional().default(10),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/places/autocomplete",
    alias: "autocomplete",
    requestFormat: "json",
    parameters: [
      {
        name: "input",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/places/reverse-geocode",
    alias: "reverseGeocode",
    requestFormat: "json",
    parameters: [
      {
        name: "lat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:id/delivery-availability",
    alias: "checkDeliveryAvailability",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:id/delivery-pricing",
    alias: "getDeliveryPricing",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "addressId",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/brands/:brandId/outlets",
    alias: "getBrandOutlets",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "lat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "radius",
        type: "Query",
        schema: z.number().optional().default(5),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/nearby",
    alias: "getNearbyRestaurants",
    requestFormat: "json",
    parameters: [
      {
        name: "lat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "radius",
        type: "Query",
        schema: z.number().optional().default(5),
      },
    ],
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
