import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { RefundView } from "./common";

const ApiResponseListRefundView = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(RefundView).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  ApiResponseListRefundView,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/restaurants/outlets/:outletId/refund-requests",
    alias: "getActiveRefundRequests",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseListRefundView,
  },
]);

export const Restaurant_support_ticket_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
