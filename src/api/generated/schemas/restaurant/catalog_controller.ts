import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const MasterMenuItem = z
  .object({
    id: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    name: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    basePrice: z.number(),
    packingCharge: z.number().gte(0).lt(10),
    defaultPrepTimeMinutes: z.number().int().optional(),
    version: z.number().int().optional(),
  })
  .passthrough();
const OutletMenuOverride = z
  .object({
    id: z.string().uuid().optional(),
    outletId: z.string().uuid().optional(),
    masterMenuItemId: z.string().uuid().optional(),
    overriddenPrice: z.number().optional(),
    isAvailable: z.boolean(),
    overriddenPrepTimeMinutes: z.number().int().optional(),
    version: z.number().int().optional(),
  })
  .passthrough();

export const schemas = {
  MasterMenuItem,
  OutletMenuOverride,
};

const endpoints = makeApi([
  {
    method: "put",
    path: "/api/v1/brands/:brandId/master-menu/:itemId",
    alias: "editMasterMenuItem",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MasterMenuItem,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "itemId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/outlets/:outletId/menu-overrides/:masterMenuItemId",
    alias: "overrideMenuItem",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: OutletMenuOverride,
      },
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "masterMenuItemId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/brands/:brandId/master-menu",
    alias: "getMasterMenuItems",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/brands/:brandId/master-menu",
    alias: "addMasterMenuItem",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MasterMenuItem,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/menu/batch",
    alias: "getEffectiveMenuBatch",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "ids",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:restaurantId/catalog/items",
    alias: "getEffectiveMenu",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/outlets/:outletId/menu-overrides",
    alias: "getOverrides",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
]);

export const Catalog_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
