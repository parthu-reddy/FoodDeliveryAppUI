import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { MasterMenuItem } from "./common";

const ApiResponseListMasterMenuItem = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(MasterMenuItem).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  ApiResponseListMasterMenuItem,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/restaurants/:restaurantId/catalog/batch",
    alias: "batchSyncCatalog",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(MasterMenuItem),
      },
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseListMasterMenuItem,
  },
]);

export const Catalog_admin_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
