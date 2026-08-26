import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

const AdvertiserResponse = z
  .object({
    id: z.string().uuid(),
    userId: z.string(),
    companyName: z.string(),
    externalRef: z.string(),
    walletBalanceId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseAdvertiserResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: AdvertiserResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const AdvertiserRegistrationRequest = z
  .object({ companyName: z.string(), externalRef: z.string().optional() })
  .passthrough();

export const schemas = {
  AdvertiserResponse,
  ApiResponseAdvertiserResponse,
  AdvertiserRegistrationRequest,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/advertisers",
    alias: "getAdvertiserByExternalRef",
    requestFormat: "json",
    parameters: [
      {
        name: "externalRef",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: ApiResponseAdvertiserResponse,
  },
  {
    method: "post",
    path: "/api/v1/advertisers",
    alias: "register",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AdvertiserRegistrationRequest,
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: ApiResponseAdvertiserResponse,
  },
  {
    method: "get",
    path: "/api/v1/advertisers/:id",
    alias: "getAdvertiser",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseAdvertiserResponse,
  },
  {
    method: "get",
    path: "/api/v1/advertisers/:advertiserId/presigned-url",
    alias: "getPresignedUrlForUpload",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "fileName",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "contentType",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: ApiResponseString,
  },
  {
    method: "get",
    path: "/api/v1/advertisers/me",
    alias: "getMyAdvertiser",
    requestFormat: "json",
    parameters: [
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: ApiResponseAdvertiserResponse,
  },
]);

export const Advertiser_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
