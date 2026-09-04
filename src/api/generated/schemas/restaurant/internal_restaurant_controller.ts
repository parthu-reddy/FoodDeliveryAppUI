import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const ApiResponseBoolean = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.boolean().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  ApiResponseBoolean,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/restaurants/products/:productId/exists",
    alias: "productExists",
    requestFormat: "json",
    parameters: [
      {
        name: "productId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ApiResponseBoolean,
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
    response: z.array(z.string()),
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/outlets/:outletId/owner",
    alias: "getOutletOwner",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/outlets/:outletId/exists",
    alias: "outletExists",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ApiResponseBoolean,
  },
]);

export const Internal_restaurant_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
