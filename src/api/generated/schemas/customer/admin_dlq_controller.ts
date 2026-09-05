import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

const PageMapStringObject = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(z.record(z.object({}).partial().passthrough())),
    number: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();

export const schemas = {
  PageMapStringObject,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/dlq/retry",
    alias: "retryDlqEvent",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
      {
        name: "topic",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/orders/dlq/refunds/:refundId/retry",
    alias: "retryRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "refundId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/dlq/refunds",
    alias: "getFailedRefunds",
    requestFormat: "json",
    parameters: [
      {
        name: "page",
        type: "Query",
        schema: z.number().int().optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
    ],
    response: PageMapStringObject,
  },
]);

export const Admin_dlq_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
