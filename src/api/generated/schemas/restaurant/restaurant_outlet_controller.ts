import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";
import { LocalTime } from "./common";

const TimingRequest = z
  .object({ openingTime: z.string(), closingTime: z.string() })
  .passthrough();
const OutletTimingsUpdateRequest = z
  .object({ timings: z.array(TimingRequest) })
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
const OutletTimingDto = z
  .object({
    id: z.string().uuid(),
    dayOfWeek: z.number().int(),
    openingTime: LocalTime,
    closingTime: LocalTime,
  })
  .partial()
  .passthrough();
const OutletDto = z
  .object({
    id: z.string().uuid(),
    brandId: z.string().uuid(),
    name: z.string(),
    fssaiLicenseNumber: z.string(),
    lat: z.number(),
    lng: z.number(),
    bannerUrl: z.string(),
    isActive: z.boolean(),
    defaultPrepTimeSeconds: z.number().int(),
    cuisine: z.string(),
    rating: z.number(),
    reviewsCount: z.number().int(),
    deliveryTime: z.number().int(),
    deliveryFee: z.number(),
    tags: z.string(),
    timings: z.array(OutletTimingDto),
  })
  .partial()
  .passthrough();
const ApiResponseOutletDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: OutletDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const NearbyRestaurantDTO = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    isActive: z.boolean(),
    defaultPrepTimeSeconds: z.number().int(),
    isOpen: z.boolean(),
    lat: z.number(),
    lng: z.number(),
    distance: z.number(),
    image: z.string(),
    cuisine: z.string(),
    rating: z.number(),
    reviewsCount: z.number().int(),
    deliveryTime: z.number().int(),
    deliveryFee: z.number(),
    tags: z.array(z.string()),
    brandId: z.string().uuid(),
    brandName: z.string(),
    isSponsored: z.boolean(),
    logoUrl: z.string(),
  })
  .partial()
  .passthrough();
const ApiResponseNearbyRestaurantDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: NearbyRestaurantDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const ApiResponseListNearbyRestaurantDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(NearbyRestaurantDTO).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const ApiResponseListOutletDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(OutletDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const PageResponseDtoNearbyRestaurantDTO = z
  .object({
    content: z.array(NearbyRestaurantDTO),
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
const ApiResponsePageResponseDtoNearbyRestaurantDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoNearbyRestaurantDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  TimingRequest,
  OutletTimingsUpdateRequest,
  OutletOnboardRequest,
  OutletTimingDto,
  OutletDto,
  ApiResponseOutletDto,
  NearbyRestaurantDTO,
  ApiResponseNearbyRestaurantDTO,
  ApiResponseListNearbyRestaurantDTO,
  ApiResponseListOutletDto,
  PageResponseDtoNearbyRestaurantDTO,
  ApiResponsePageResponseDtoNearbyRestaurantDTO,
};

const endpoints = makeApi([
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
    response: ApiResponseVoid,
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
    response: ApiResponseVoid,
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
    response: ApiResponseVoid,
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
    response: ApiResponseListOutletDto,
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
    response: ApiResponseOutletDto,
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
    response: ApiResponseNearbyRestaurantDTO,
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
    response: ApiResponseListNearbyRestaurantDTO,
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
    response: ApiResponseListNearbyRestaurantDTO,
  },
  {
    method: "get",
    path: "/api/v1/outlets",
    alias: "getOutlets",
    requestFormat: "json",
    response: ApiResponseListOutletDto,
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
    response: ApiResponsePageResponseDtoNearbyRestaurantDTO,
  },
]);

export const Restaurant_outlet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
