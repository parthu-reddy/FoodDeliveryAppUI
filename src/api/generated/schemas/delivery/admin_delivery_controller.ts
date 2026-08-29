import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { DeliveryExecutive } from "./common";

const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .passthrough();
const PageDeliveryExecutive = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(DeliveryExecutive),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
const DriverLocationDTO = z
  .object({
    id: z.string().uuid(),
    fullName: z.string().optional(),
    phoneNumber: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    status: z.string(),
  })
  .passthrough();
const PageDriverLocationDTO = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    content: z.array(DriverLocationDTO),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
const pageable = z
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

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/delivery/orders/:orderId/assign",
    alias: "forceAssignOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "driverId",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
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
        schema: z.string(),
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
        schema: z.string(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: PageDriverLocationDTO,
  },
]);

export const Admin_delivery_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
