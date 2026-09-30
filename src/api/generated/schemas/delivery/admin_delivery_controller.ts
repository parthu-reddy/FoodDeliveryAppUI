import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { DeliveryExecutive } from "./common";

export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .passthrough();
export const PageDeliveryExecutive = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(DeliveryExecutive),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const DriverLocationDTO = z
  .object({
    id: z.string().uuid(),
    fullName: z.string().optional(),
    phoneNumber: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    status: z.string(),
  })
  .passthrough();
export const PageDriverLocationDTO = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(DriverLocationDTO),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
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

export const schemas = {
  SortObject,
  PageableObject,
  PageDeliveryExecutive,
  DriverLocationDTO,
  PageDriverLocationDTO,
  pageable,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/delivery/drivers/batch",
    alias: "getDriversByIds",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(z.string().uuid()),
      },
    ],
    response: z.array(DeliveryExecutive),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/fleet-cities",
    alias: "getFleetCities",
    requestFormat: "json",
    response: z.array(z.string()),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/:driverId",
    alias: "getDriverById",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: DeliveryExecutive,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/available",
    alias: "getAvailableDrivers",
    requestFormat: "json",
    parameters: [
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: PageDeliveryExecutive,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/available-with-location",
    alias: "getAvailableDriversWithLocation",
    requestFormat: "json",
    parameters: [
      {
        name: "cityId",
        type: "Query",
        schema: z
          .string()
          .regex(/^[A-Z][A-Z0-9_-]{0,63}$/)
          .optional(),
      },
      {
        name: "lat",
        type: "Query",
        schema: z.number().optional().default(0),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number().optional().default(0),
      },
      {
        name: "radiusKm",
        type: "Query",
        schema: z.number().optional().default(50),
      },
    ],
    response: z.array(DriverLocationDTO),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/all-with-location",
    alias: "getAllDriversWithLocation",
    requestFormat: "json",
    parameters: [
      {
        name: "cityId",
        type: "Query",
        schema: z
          .string()
          .regex(/^[A-Z][A-Z0-9_-]{0,63}$/)
          .optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(100),
      },
    ],
    response: PageDriverLocationDTO,
  },
]);

export const Admin_delivery_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
