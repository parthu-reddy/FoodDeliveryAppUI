import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";
import { pageable } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

const GeoTargeting = z
  .object({ regions: z.array(z.string()).max(400) })
  .passthrough();
const Daypart = z
  .object({ dayOfWeek: z.string(), startTime: z.string(), endTime: z.string() })
  .passthrough();
const DaypartingConfig = z
  .object({ dayparts: z.array(Daypart).max(400) })
  .passthrough();
const ContextualKeywords = z
  .object({ keywords: z.array(z.string()).max(400) })
  .passthrough();
const AdGroupRequest = z
  .object({
    name: z.string(),
    geoTargeting: GeoTargeting.optional(),
    daypartingConfig: DaypartingConfig.optional(),
    contextualKeywords: ContextualKeywords.optional(),
    brandSafetyBlocklist: z.array(z.string()).optional(),
    active: z.boolean().optional(),
  })
  .passthrough();
const AdGroupResponse = z
  .object({
    id: z.string().uuid(),
    campaignId: z.string().uuid(),
    name: z.string(),
    geoTargeting: GeoTargeting.optional(),
    daypartingConfig: DaypartingConfig.optional(),
    contextualKeywords: ContextualKeywords.optional(),
    brandSafetyBlocklist: z.array(z.string()).optional(),
    active: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const ApiResponseAdGroupResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: AdGroupResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const PageAdGroupResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    sort: z.array(SortObject).optional(),
    numberOfElements: z.number().int(),
    pageable: PageableObject.optional(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(AdGroupResponse),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .passthrough();
const ApiResponsePageAdGroupResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageAdGroupResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  GeoTargeting,
  Daypart,
  DaypartingConfig,
  ContextualKeywords,
  AdGroupRequest,
  AdGroupResponse,
  ApiResponseAdGroupResponse,
  PageAdGroupResponse,
  ApiResponsePageAdGroupResponse,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:campaignId/ad-groups/:adGroupId",
    alias: "getAdGroup",
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
    response: ApiResponseAdGroupResponse,
  },
  {
    method: "put",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:campaignId/ad-groups/:adGroupId",
    alias: "updateAdGroup",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AdGroupRequest,
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
    response: ApiResponseAdGroupResponse,
  },
  {
    method: "delete",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:campaignId/ad-groups/:adGroupId",
    alias: "deleteAdGroup",
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
    response: ApiResponseVoid,
  },
  {
    method: "get",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:campaignId/ad-groups",
    alias: "listAdGroups",
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
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: ApiResponsePageAdGroupResponse,
  },
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:campaignId/ad-groups",
    alias: "createAdGroup",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AdGroupRequest,
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
    ],
    response: ApiResponseAdGroupResponse,
  },
]);

export const Ad_group_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
