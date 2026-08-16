import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();

export const schemas = {
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
    response: z.void(),
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
    response: z.void(),
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/available-with-location",
    alias: "getAvailableDriversWithLocation",
    requestFormat: "json",
    parameters: [
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/delivery/drivers/all-with-location",
    alias: "getAllDriversWithLocation",
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
]);

export const Admin_delivery_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
