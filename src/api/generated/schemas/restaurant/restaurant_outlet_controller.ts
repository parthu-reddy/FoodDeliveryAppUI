import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { LocalTime } from "./common";

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

export const schemas = {
  TimingRequest,
  OutletTimingsUpdateRequest,
  OutletOnboardRequest,
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
    response: z.any(),
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
    response: z.any(),
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
    response: z.any(),
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
    response: z.any(),
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
    response: z.any(),
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
    response: z.any(),
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
    response: z.any(),
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
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/outlets",
    alias: "getOutlets",
    requestFormat: "json",
    response: z.any(),
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
    response: z.any(),
  },
]);

export const Restaurant_outlet_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
