import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const DispatchOrderRequest = z
  .object({
    cityId: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    restaurantCoords: z
      .string()
      .min(0)
      .max(50)
      .regex(
        /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
      ),
  })
  .passthrough();
const SetAvailabilityRequest = z
  .object({
    cityId: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    driverId: z
      .string()
      .min(0)
      .max(36)
      .regex(/^[0-9a-fA-F\-]{36}$/),
    available: z.boolean(),
  })
  .passthrough();
const UpdateLocationRequest = z
  .object({
    cityId: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    driverId: z
      .string()
      .min(0)
      .max(36)
      .regex(/^[0-9a-fA-F\-]{36}$/),
    lat: z.number(),
    lng: z.number(),
  })
  .passthrough();

export const schemas = {
  DispatchOrderRequest,
  SetAvailabilityRequest,
  UpdateLocationRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/logistics/dispatch",
    alias: "dispatchOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DispatchOrderRequest,
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "post",
    path: "/api/fleet/release",
    alias: "releaseDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetAvailabilityRequest,
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/fleet/location",
    alias: "getDriverLocation",
    requestFormat: "json",
    parameters: [
      {
        name: "cityId",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "driverId",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "post",
    path: "/api/fleet/location",
    alias: "updateLocation",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateLocationRequest,
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "post",
    path: "/api/fleet/availability",
    alias: "setAvailability",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetAvailabilityRequest,
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/places/reverse-geocode",
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
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/places/autocomplete",
    alias: "autocomplete",
    requestFormat: "json",
    parameters: [
      {
        name: "input",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "lat",
        type: "Query",
        schema: z.number().optional(),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number().optional(),
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/logistics/route",
    alias: "getRoute",
    requestFormat: "json",
    parameters: [
      {
        name: "origin",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "destination",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/logistics/distance",
    alias: "getDistance",
    requestFormat: "json",
    parameters: [
      {
        name: "origin",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "destination",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/fleet/nearby",
    alias: "getNearbyDrivers",
    requestFormat: "json",
    parameters: [
      {
        name: "cityId",
        type: "Query",
        schema: z.string(),
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
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/fleet/available",
    alias: "getAvailableDrivers",
    requestFormat: "json",
    parameters: [
      {
        name: "cityId",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/fleet/availability/check",
    alias: "checkDriverAvailability",
    requestFormat: "json",
    parameters: [
      {
        name: "cityId",
        type: "Query",
        schema: z.string(),
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
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "delete",
    path: "/api/fleet/driver",
    alias: "deleteDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "cityId",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "driverId",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
]);

export const Integration_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
