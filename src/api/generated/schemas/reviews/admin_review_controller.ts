import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponsePagedModelReviewDetailDto } from "./common";
import { PagedModelReviewDetailDto } from "./common";
import { ReviewDetailDto } from "./common";
import { PageMetadata } from "./common";

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/admin/reviews",
    alias: "getReviewsForEntity",
    requestFormat: "json",
    parameters: [
      {
        name: "entityType",
        type: "Query",
        schema: z.enum(["RESTAURANT", "DRIVER", "PRODUCT"]),
      },
      {
        name: "entityId",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(20),
      },
    ],
    response: ApiResponsePagedModelReviewDetailDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/reviews/by-user/:userId",
    alias: "getReviewsByUser",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(20),
      },
    ],
    response: ApiResponsePagedModelReviewDetailDto,
  },
]);

export const Admin_review_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
