import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const LocalTime = z
  .object({
    hour: z.number().int(),
    minute: z.number().int(),
    second: z.number().int(),
    nano: z.number().int(),
  })
  .partial()
  .passthrough();
const TimingRequest = z
  .object({ openingTime: LocalTime, closingTime: LocalTime })
  .passthrough();
const OutletTimingsUpdateRequest = z
  .object({ timings: z.array(TimingRequest) })
  .passthrough();
const OutletStatusUpdateRequest = z
  .object({ isActive: z.boolean() })
  .passthrough();
const OutletSettingsUpdateRequest = z
  .object({ defaultPrepTimeSeconds: z.number().int() })
  .passthrough();
const CategoryTimingDTO = z
  .object({ openingTime: LocalTime, closingTime: LocalTime })
  .partial()
  .passthrough();
const CategoryDTO = z
  .object({
    id: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    name: z.string().min(2).max(100),
    description: z.string().min(0).max(255).optional(),
    timings: z.array(CategoryTimingDTO).optional(),
  })
  .passthrough();
const MasterMenuItem = z
  .object({
    id: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    name: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    basePrice: z.number(),
    packingCharge: z.number().gte(0).lt(10),
    defaultPrepTimeMinutes: z.number().int().optional(),
    version: z.number().int().optional(),
  })
  .passthrough();
const AcceptOrderRequest = z
  .object({ additionalPrepTime: z.number().int(), delayReason: z.string() })
  .partial()
  .passthrough();
const GstinRequest = z
  .object({
    brandId: z.string().uuid(),
    gstin: z.string(),
    brandName: z.string(),
  })
  .partial()
  .passthrough();
const BankAccountRequest = z
  .object({
    brandId: z.string().uuid(),
    accountNumber: z.string(),
    ifscCode: z.string(),
    brandName: z.string(),
  })
  .partial()
  .passthrough();
const OutletMenuOverride = z
  .object({
    id: z.string().uuid().optional(),
    outletId: z.string().uuid().optional(),
    masterMenuItemId: z.string().uuid().optional(),
    overriddenPrice: z.number().optional(),
    isAvailable: z.boolean(),
    overriddenPrepTimeMinutes: z.number().int().optional(),
    version: z.number().int().optional(),
  })
  .passthrough();
const TimingDTO = z
  .object({ openingTime: LocalTime, closingTime: LocalTime })
  .partial()
  .passthrough();
const SetOutletCategoryTimingRequest = z
  .object({ categoryId: z.string().uuid(), timings: z.array(TimingDTO) })
  .partial()
  .passthrough();
const VerificationCallbackRequest = z
  .object({
    verificationType: z.string(),
    status: z.string(),
    legalEntityName: z.string(),
    bankBeneficiaryName: z.string(),
    matchScore: z.number(),
  })
  .partial()
  .passthrough();
const BrandOnboardRequest = z
  .object({
    name: z.string(),
    gstin: z.string(),
    pan: z.string(),
    cin: z.string().optional(),
    bankAccountNumber: z.string(),
    ifscCode: z.string(),
    logoUrl: z.string().optional(),
  })
  .passthrough();
const OutletOnboardRequest = z
  .object({
    name: z.string(),
    fssaiLicenseNumber: z.string(),
    lat: z.number(),
    lng: z.number(),
    timings: z.array(TimingRequest),
    bannerUrl: z.string().optional(),
    cuisine: z.string().optional(),
    rating: z.number().optional(),
    reviewsCount: z.number().int().optional(),
    deliveryTime: z.number().int().optional(),
    deliveryFee: z.number().optional(),
    tags: z.string().optional(),
  })
  .passthrough();
const SetBrandCategoryTimingRequest = z
  .object({
    categoryId: z.string().uuid(),
    timings: z.array(TimingDTO).optional(),
  })
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
const ApiResponseCategoryDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: CategoryDTO,
    timestamp: z.string().datetime({ offset: true }),
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
const ApiResponseMasterMenuItem = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: MasterMenuItem,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseOutletMenuOverride = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: OutletMenuOverride,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListTimingDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(TimingDTO),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListMasterMenuItem = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(MasterMenuItem),
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
const Brand = z
  .object({
    id: z.string().uuid(),
    ownerId: z.string().uuid(),
    name: z.string(),
    gstin: z.string(),
    pan: z.string(),
    cin: z.string(),
    bankAccountNumber: z.string(),
    bankIfsc: z.string(),
    logoUrl: z.string(),
    legalEntityName: z.string(),
    kycStatus: z.enum([
      "PENDING",
      "APPROVED",
      "VERIFIED",
      "REJECTED",
      "MANUAL_REVIEW",
      "FAILED",
    ]),
    bankBeneficiaryName: z.string(),
    pennyDropStatus: z.enum([
      "PENDING",
      "APPROVED",
      "VERIFIED",
      "REJECTED",
      "MANUAL_REVIEW",
      "FAILED",
    ]),
    isGstinVerified: z.boolean(),
    isBankVerified: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int(),
  })
  .partial()
  .passthrough();
const ApiResponseBrand = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: Brand,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const OutletTiming = z
  .object({
    id: z.string().uuid(),
    openingTime: LocalTime,
    closingTime: LocalTime,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int(),
  })
  .partial()
  .passthrough();
const Outlet = z
  .object({
    id: z.string().uuid(),
    brandId: z.string().uuid(),
    name: z.string(),
    fssaiLicenseNumber: z.string(),
    bannerUrl: z.string(),
    timings: z.array(OutletTiming),
    isActive: z.boolean(),
    defaultPrepTimeSeconds: z.number().int(),
    cuisine: z.string(),
    rating: z.number(),
    reviewsCount: z.number().int(),
    deliveryTime: z.number().int(),
    deliveryFee: z.number(),
    tags: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int(),
  })
  .partial()
  .passthrough();
const ApiResponseOutlet = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: Outlet,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const MenuItemDTO = z
  .object({
    id: z.string().uuid(),
    restaurantId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    isAvailable: z.boolean(),
    prepTimeMinutes: z.number().int(),
    imageUrl: z.string(),
    categoryId: z.string().uuid(),
    categoryName: z.string(),
  })
  .partial()
  .passthrough();
const RestaurantOrder = z
  .object({
    orderId: z.string().uuid(),
    restaurantId: z.string().uuid(),
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
    version: z.number().int(),
    prepTime: z.number().int(),
    additionalPrepTime: z.number().int(),
    estimatedCompletionTime: z.number().int(),
    deliveryLat: z.number(),
    deliveryLng: z.number(),
    deliveryAddress: z.string(),
    pickupOtp: z.string(),
    deliveryOtp: z.string(),
    deliveryExecutiveId: z.string().uuid(),
    customerName: z.string(),
    riderName: z.string(),
    itemsJson: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(RestaurantOrder),
    timestamp: z.string().datetime({ offset: true }),
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
const PageRestaurantOrder = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(RestaurantOrder),
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
const ApiResponsePageRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: PageRestaurantOrder,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListMenuItemDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(MenuItemDTO),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
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
const ApiResponseListOutlet = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(Outlet),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListOutletMenuOverride = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(OutletMenuOverride),
    timestamp: z.string().datetime({ offset: true }),
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
    last: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponsePageMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: PageMapStringObject,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListCategoryDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(CategoryDTO),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListBrand = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(Brand),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const SseEmitter = z
  .object({ timeout: z.number().int() })
  .partial()
  .passthrough();

export const schemas = {
  LocalTime,
  TimingRequest,
  OutletTimingsUpdateRequest,
  OutletStatusUpdateRequest,
  OutletSettingsUpdateRequest,
  CategoryTimingDTO,
  CategoryDTO,
  MasterMenuItem,
  AcceptOrderRequest,
  GstinRequest,
  BankAccountRequest,
  OutletMenuOverride,
  TimingDTO,
  SetOutletCategoryTimingRequest,
  VerificationCallbackRequest,
  BrandOnboardRequest,
  OutletOnboardRequest,
  SetBrandCategoryTimingRequest,
  ApiResponseVoid,
  ApiResponseCategoryDTO,
  ApiResponseObject,
  ApiResponseMasterMenuItem,
  ApiResponseOutletMenuOverride,
  ApiResponseListTimingDTO,
  ApiResponseListMasterMenuItem,
  ApiResponseString,
  Brand,
  ApiResponseBrand,
  OutletTiming,
  Outlet,
  ApiResponseOutlet,
  MenuItemDTO,
  RestaurantOrder,
  ApiResponseListRestaurantOrder,
  ApiResponseMapStringObject,
  SortObject,
  PageableObject,
  PageRestaurantOrder,
  ApiResponsePageRestaurantOrder,
  ApiResponseListMenuItemDTO,
  ApiResponseMapStringString,
  ApiResponseListMapStringObject,
  ApiResponseListOutlet,
  ApiResponseListOutletMenuOverride,
  PageMapStringObject,
  ApiResponsePageMapStringObject,
  ApiResponseListCategoryDTO,
  ApiResponseListBrand,
  SseEmitter,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/brands",
    alias: "getBrands",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/brands",
    alias: "onboardBrand",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BrandOnboardRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/brands/:brandId/categories",
    alias: "getBrandCategories",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/brands/:brandId/categories",
    alias: "createBrandCategory",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CategoryDTO,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/brands/:brandId/categories/:categoryId/timings",
    alias: "getBrandCategoryTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "categoryId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/brands/:brandId/categories/timings",
    alias: "setBrandCategoryTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetBrandCategoryTimingRequest,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/brands/:brandId/master-menu",
    alias: "getMasterMenuItems",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/brands/:brandId/master-menu",
    alias: "addMasterMenuItem",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MasterMenuItem,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/v1/brands/:brandId/master-menu/:itemId",
    alias: "editMasterMenuItem",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MasterMenuItem,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "itemId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/brands/:brandId/outlets",
    alias: "getOutletsByBrand",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/brands/:brandId/outlets",
    alias: "onboardOutlet",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OutletOnboardRequest,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/brands/stream",
    alias: "streamBrands",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/campaigns",
    alias: "createCampaign",
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
    method: "put",
    path: "/api/v1/campaigns/:campaignId/pause",
    alias: "pauseCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "campaignId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "restaurantId",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/campaigns/restaurant/:restaurantId",
    alias: "getCampaigns",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/categories",
    alias: "getCategories",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/categories",
    alias: "createCategory",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CategoryDTO,
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/v1/categories/:categoryId",
    alias: "updateCategory",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CategoryDTO,
      },
      {
        name: "categoryId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/images/upload",
    alias: "uploadImage",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ file: z.instanceof(File) }).passthrough(),
      },
      {
        name: "folderId",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "imageType",
        type: "Query",
        schema: z.string().optional().default("default"),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/restaurants/:restaurantId/catalog/batch",
    alias: "batchSyncCatalog",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(MasterMenuItem),
      },
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/restaurants/all-with-location",
    alias: "getAllOutletsWithLocation",
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
        schema: z.number().int().optional().default(100),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/brands/:brandId/verification-callback",
    alias: "updateVerificationStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: VerificationCallbackRequest,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/orders/:orderId/status",
    alias: "getOrderStatus",
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
    path: "/api/v1/internal/restaurants/owner/:ownerId/outlets",
    alias: "getOwnerOutlets",
    requestFormat: "json",
    parameters: [
      {
        name: "ownerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/outlets",
    alias: "getOutlets",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/outlets/:outletId/categories/:categoryId/timings",
    alias: "getOutletCategoryTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "categoryId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/outlets/:outletId/categories/timings",
    alias: "setOutletCategoryTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetOutletCategoryTimingRequest,
      },
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/outlets/:outletId/menu-overrides",
    alias: "getOverrides",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/outlets/:outletId/menu-overrides/:masterMenuItemId",
    alias: "overrideMenuItem",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OutletMenuOverride,
      },
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "masterMenuItemId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/v1/outlets/:outletId/settings",
    alias: "updateOutletSettings",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ defaultPrepTimeSeconds: z.number().int() })
          .passthrough(),
      },
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/v1/outlets/:outletId/status",
    alias: "updateOutletStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ isActive: z.boolean() }).passthrough(),
      },
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/v1/outlets/:outletId/timings",
    alias: "updateOutletTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OutletTimingsUpdateRequest,
      },
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:id",
    alias: "getRestaurant",
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
    path: "/api/v1/restaurants/:restaurantId/catalog/items",
    alias: "getEffectiveMenu",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders",
    alias: "getRestaurantOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/accept",
    alias: "acceptOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AcceptOrderRequest,
      },
      {
        name: "restaurantId",
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/cancel",
    alias: "cancelOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/invoice",
    alias: "getOrderInvoice",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/prepare",
    alias: "prepareOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/ready",
    alias: "readyOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/refund/partial",
    alias: "partialRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.string()),
      },
      {
        name: "restaurantId",
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/:orderId/reject",
    alias: "rejectOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
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
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/active",
    alias: "getActiveRestaurantOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/fulfillment/orders/history",
    alias: "getHistoricalRestaurantOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
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
        schema: z.number().int().optional().default(10),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/menu/batch",
    alias: "getEffectiveMenuBatch",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "ids",
        type: "Query",
        schema: z.string(),
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
  {
    method: "post",
    path: "/api/v1/restaurants/verification/brands/bank-account",
    alias: "verifyBankAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BankAccountRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/restaurants/verification/brands/gstin",
    alias: "verifyGstin",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GstinRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/verification/upload-url",
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
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
