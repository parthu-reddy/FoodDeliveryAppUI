import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const MasterMenuItem = z.any();

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
    response: z.any(),
  },
]);

export const Catalog_admin_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
