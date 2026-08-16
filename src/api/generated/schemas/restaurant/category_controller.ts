import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { LocalTime } from "./common";

const CategoryTimingDTO = z
  .object({ openingTime: LocalTime, closingTime: LocalTime })
  .partial()
  .passthrough();
const CategoryDTO = z
  .object({
    id: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    name: z.string().min(2).max(100),
    description: z.string().min(0).max(255).optional(),
    timings: z.array(CategoryTimingDTO).optional(),
  })
  .passthrough();
const TimingDTO = z
  .object({ openingTime: z.string(), closingTime: z.string() })
  .partial()
  .passthrough();
const SetOutletCategoryTimingRequest = z
  .object({ categoryId: z.string().uuid(), timings: z.array(TimingDTO) })
  .partial()
  .passthrough();
const SetBrandCategoryTimingRequest = z
  .object({
    categoryId: z.string().uuid(),
    timings: z.array(TimingDTO).optional(),
  })
  .passthrough();

export const schemas = {
  CategoryTimingDTO,
  CategoryDTO,
  TimingDTO,
  SetOutletCategoryTimingRequest,
  SetBrandCategoryTimingRequest,
};

const endpoints = makeApi([
  {
    method: "put",
    path: "/api/v1/categories/:categoryId",
    alias: "updateCategory",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CategoryDTO,
      },
      {
        name: "categoryId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/outlets/:outletId/categories/timings",
    alias: "setOutletCategoryTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetOutletCategoryTimingRequest,
      },
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/categories",
    alias: "getCategories",
    requestFormat: "json",
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/categories",
    alias: "createCategory",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CategoryDTO,
      },
    ],
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/brands/:brandId/categories",
    alias: "getBrandCategories",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/brands/:brandId/categories",
    alias: "createBrandCategory",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CategoryDTO,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/brands/:brandId/categories/timings",
    alias: "setBrandCategoryTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SetBrandCategoryTimingRequest,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/outlets/:outletId/categories/:categoryId/timings",
    alias: "getOutletCategoryTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "categoryId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/brands/:brandId/categories/:categoryId/timings",
    alias: "getBrandCategoryTimings",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "categoryId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
]);

export const Category_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
