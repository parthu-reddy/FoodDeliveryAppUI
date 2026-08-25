import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";
import { LocalTime } from "./common";
import { ApiResponseMapStringObject } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

const TimingRequest = z
  .object({ openingTime: LocalTime, closingTime: LocalTime })
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
const ApiResponseListOutlet = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(Outlet),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const PageMapStringObject = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    sort: z.array(SortObject),
    size: z.number().int(),
    content: z.array(z.record(z.object({}).partial().passthrough())),
    pageable: PageableObject,
    last: z.boolean(),
    first: z.boolean(),
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
const ApiResponseListMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(z.record(z.object({}).partial().passthrough())),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  TimingRequest,
  OutletTimingsUpdateRequest,
  OutletOnboardRequest,
  OutletTiming,
  Outlet,
  ApiResponseOutlet,
  ApiResponseListOutlet,
  PageMapStringObject,
  ApiResponsePageMapStringObject,
  ApiResponseListMapStringObject,
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
    response: ApiResponseListOutlet,
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
    response: ApiResponseOutlet,
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
    response: ApiResponseMapStringObject,
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
    response: ApiResponseListMapStringObject,
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
    response: ApiResponseListMapStringObject,
  },
  {
    method: "get",
    path: "/api/v1/outlets",
    alias: "getOutlets",
    requestFormat: "json",
    response: ApiResponseListOutlet,
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
    response: ApiResponsePageMapStringObject,
  },
]);

export const Restaurant_outlet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
