import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseMapStringObject } from "./common";

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

export const schemas = {
  ApiResponseBoolean,
  ApiResponseListObject,
};

const endpoints = makeApi([
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
    response: ApiResponseMapStringObject,
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
    response: ApiResponseBoolean,
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
    response: ApiResponseListObject,
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
    response: ApiResponseListObject,
  },
]);

export const Customer_restaurant_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
