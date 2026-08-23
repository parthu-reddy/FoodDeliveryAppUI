import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { MasterMenuItem } from "./common";
import { ApiResponseListMasterMenuItem } from "./common";

const ApiResponseMasterMenuItem = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: MasterMenuItem,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
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
const ApiResponseOutletMenuOverride = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: OutletMenuOverride,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const MenuItemDTO = z
  .object({
    id: z.string().uuid(),
    restaurantId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    isAvailable: z.boolean(),
    prepTimeMinutes: z.number().int(),
    imageUrl: z.string(),
    categoryId: z.string().uuid(),
    categoryName: z.string(),
  })
  .partial()
  .passthrough();
const ApiResponseListMenuItemDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(MenuItemDTO),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListOutletMenuOverride = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(OutletMenuOverride),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  ApiResponseMasterMenuItem,
  OutletMenuOverride,
  ApiResponseOutletMenuOverride,
  MenuItemDTO,
  ApiResponseListMenuItemDTO,
  ApiResponseListOutletMenuOverride,
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
    response: ApiResponseMasterMenuItem,
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
    response: ApiResponseOutletMenuOverride,
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
    response: ApiResponseListMasterMenuItem,
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
    response: ApiResponseMasterMenuItem,
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
    response: z.array(MenuItemDTO),
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
    response: ApiResponseListMenuItemDTO,
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
    response: ApiResponseListOutletMenuOverride,
  },
]);

export const Catalog_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
