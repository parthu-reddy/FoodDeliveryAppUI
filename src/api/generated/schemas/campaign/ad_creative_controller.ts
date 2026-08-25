import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";
import { ApiResponseString } from "./common";

const AdCreativeResponse = z
  .object({
    id: z.string().uuid(),
    adGroupId: z.string().uuid(),
    format: z.enum(["BANNER", "CAROUSEL", "VIDEO", "VIDEO_VAST", "NATIVE"]),
    assetUrl: z.string(),
    vastXml: z.string(),
    auditStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseAdCreativeResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: AdCreativeResponse,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListAdCreativeResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(AdCreativeResponse),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const AdCreativeRequest = z
  .object({
    format: z.enum(["BANNER", "CAROUSEL", "VIDEO", "VIDEO_VAST", "NATIVE"]),
    assetUrl: z.string().optional(),
    vastXml: z.string().optional(),
  })
  .passthrough();

export const schemas = {
  AdCreativeResponse,
  ApiResponseAdCreativeResponse,
  ApiResponseListAdCreativeResponse,
  AdCreativeRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/creatives/:creativeId/audit",
    alias: "auditCreative",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.object({}).partial().passthrough()),
      },
      {
        name: "creativeId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseVoid,
  },
  {
    method: "get",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:campaignId/ad-groups/:adGroupId/creatives",
    alias: "listCreatives",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "campaignId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "adGroupId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseListAdCreativeResponse,
  },
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:campaignId/ad-groups/:adGroupId/creatives",
    alias: "createCreative",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AdCreativeRequest,
      },
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "campaignId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "adGroupId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseAdCreativeResponse,
  },
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:campaignId/ad-groups/:adGroupId/creatives/upload-url",
    alias: "generateUploadUrl",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "campaignId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "adGroupId",
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
]);

export const Ad_creative_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
