import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const LocalTime = z
  .object({
    hour: z.number().int(),
    minute: z.number().int(),
    second: z.number().int(),
    nano: z.number().int(),
  })
  .partial()
  .passthrough();
export const TimingRequest = z
  .object({ openingTime: LocalTime, closingTime: LocalTime })
  .passthrough();
export const OutletTimingsUpdateRequest = z
  .object({ timings: z.array(TimingRequest) })
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
export const OutletStatusUpdateRequest = z
  .object({ isActive: z.boolean() })
  .passthrough();
export const OutletSettingsUpdateRequest = z
  .object({ defaultPrepTimeSeconds: z.number().int() })
  .passthrough();
export const CategoryTimingDTO = z
  .object({ openingTime: LocalTime, closingTime: LocalTime })
  .passthrough();
export const CategoryDTO = z
  .object({
    id: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    name: z.string().min(2).max(100),
    description: z.string().min(0).max(255).optional(),
    timings: z.array(CategoryTimingDTO).optional(),
  })
  .passthrough();
export const ApiResponseCategoryDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: CategoryDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
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
export const MasterMenuItem = z
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
export const ApiResponseMasterMenuItem = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: MasterMenuItem.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const AcceptOrderRequest = z
  .object({ additionalPrepTime: z.number().int(), delayReason: z.string() })
  .partial()
  .passthrough();
export const GstinRequest = z
  .object({
    brandId: z.string().uuid().optional(),
    gstin: z.string(),
    brandName: z.string(),
  })
  .passthrough();
export const BankAccountRequest = z
  .object({
    brandId: z.string().uuid().optional(),
    accountNumber: z.string(),
    ifscCode: z.string(),
    brandName: z.string(),
  })
  .passthrough();
export const OutletMenuOverride = z
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
export const ApiResponseOutletMenuOverride = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: OutletMenuOverride.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const TimingDTO = z
  .object({ openingTime: z.string(), closingTime: z.string() })
  .passthrough();
export const SetOutletCategoryTimingRequest = z
  .object({ categoryId: z.string().uuid(), timings: z.array(TimingDTO) })
  .passthrough();
export const ApiResponseListTimingDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(TimingDTO).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const VerificationCallbackRequest = z
  .object({
    verificationType: z.string(),
    status: z.string(),
    legalEntityName: z.string().optional(),
    bankBeneficiaryName: z.string().optional(),
    matchScore: z.number().optional(),
  })
  .passthrough();
export const ApiResponseListMasterMenuItem = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(MasterMenuItem).optional(),
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
export const ApiResponseListCategoryDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(CategoryDTO).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const Brand = z
  .object({
    id: z.string().uuid(),
    ownerId: z.string().uuid(),
    name: z.string(),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    cin: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfsc: z.string().optional(),
    logoUrl: z.string().optional(),
    legalEntityName: z.string().optional(),
    kycStatus: z
      .enum([
        "PENDING",
        "APPROVED",
        "VERIFIED",
        "REJECTED",
        "MANUAL_REVIEW",
        "FAILED",
      ])
      .optional(),
    bankBeneficiaryName: z.string().optional(),
    pennyDropStatus: z
      .enum([
        "PENDING",
        "APPROVED",
        "VERIFIED",
        "REJECTED",
        "MANUAL_REVIEW",
        "FAILED",
      ])
      .optional(),
    isGstinVerified: z.boolean().optional(),
    isBankVerified: z.boolean().optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
    updatedAt: z.string().datetime({ offset: true }).optional(),
    version: z.number().int().optional(),
  })
  .passthrough();
export const ApiResponseListBrand = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(Brand).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const BrandOnboardRequest = z
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
export const ApiResponseBrand = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: Brand.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const OutletTiming = z
  .object({
    id: z.string().uuid(),
    openingTime: LocalTime,
    closingTime: LocalTime,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int().optional(),
  })
  .passthrough();
export const Outlet = z
  .object({
    id: z.string().uuid(),
    brandId: z.string().uuid(),
    name: z.string(),
    fssaiLicenseNumber: z.string().optional(),
    bannerUrl: z.string().optional(),
    timings: z.array(OutletTiming).optional(),
    defaultPrepTimeSeconds: z.number().int().optional(),
    cuisine: z.string().optional(),
    rating: z.number().optional(),
    reviewsCount: z.number().int().optional(),
    deliveryTime: z.number().int().optional(),
    deliveryFee: z.number().optional(),
    tags: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
    updatedAt: z.string().datetime({ offset: true }).optional(),
    version: z.number().int().optional(),
  })
  .passthrough();
export const ApiResponseListOutlet = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(Outlet).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const OutletOnboardRequest = z
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
export const ApiResponseOutlet = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: Outlet.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const SetBrandCategoryTimingRequest = z
  .object({
    categoryId: z.string().uuid(),
    timings: z.array(TimingDTO).optional(),
  })
  .passthrough();
export const MenuItemDTO = z
  .object({
    id: z.string().uuid(),
    restaurantId: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    isAvailable: z.boolean(),
    prepTimeMinutes: z.number().int().optional(),
    imageUrl: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    categoryName: z.string().optional(),
  })
  .passthrough();
export const RestaurantOrder = z
  .object({
    id: z.string().uuid(),
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
    version: z.number().int().optional(),
    prepTime: z.number().int().optional(),
    additionalPrepTime: z.number().int().optional(),
    estimatedCompletionTime: z.number().int().optional(),
    deliveryLat: z.number().optional(),
    deliveryLng: z.number().optional(),
    deliveryAddress: z.string().optional(),
    pickupOtp: z.string().optional(),
    deliveryOtp: z.string().optional(),
    deliveryExecutiveId: z.string().uuid().optional(),
    customerName: z.string().optional(),
    deliveryExecutiveName: z.string().optional(),
    total: z.number().optional(),
    foodCost: z.number().optional(),
    restaurantPlatformFee: z.number().optional(),
    restaurantDeliveryContribution: z.number().optional(),
    platformBonus: z.number().optional(),
    restaurantPayout: z.number().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
export const ApiResponseListRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(RestaurantOrder).optional(),
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
export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const PageableObject = z
  .object({
    offset: z.number().int(),
    unpaged: z.boolean(),
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
  })
  .passthrough();
export const PageRestaurantOrder = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(RestaurantOrder),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageRestaurantOrder = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageRestaurantOrder.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseListMenuItemDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(MenuItemDTO).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.record(z.string()).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const NearbyRestaurantDTO = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    image: z.string(),
    logoUrl: z.string(),
    rating: z.number(),
    reviewCount: z.number().int(),
    deliveryFee: z.number(),
    minDeliveryTime: z.number().int(),
    maxDeliveryTime: z.number().int(),
    distance: z.number(),
    isPromoted: z.boolean(),
    isClosed: z.boolean(),
    outlets: z.array(Outlet),
  })
  .partial()
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
export const ApiResponseListOutletMenuOverride = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(OutletMenuOverride).optional(),
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
export const PageMapStringObject = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(z.record(z.object({}).partial().passthrough())),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageMapStringObject.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const SseEmitter = z
  .object({ timeout: z.number().int() })
  .partial()
  .passthrough();
