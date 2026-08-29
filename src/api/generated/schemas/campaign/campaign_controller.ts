import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";
import { pageable } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

const CampaignResponse = z
  .object({
    id: z.string().uuid(),
    advertiserId: z.string().uuid(),
    name: z.string(),
    status: z.enum([
      "DRAFT",
      "SCHEDULED",
      "ACTIVE",
      "PAUSED",
      "COMPLETED",
      "ARCHIVED",
      "DELETED",
    ]),
    dailyBudget: z.number(),
    lifetimeBudget: z.number(),
    maxBid: z.number(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }).optional(),
    frequencyCap: z.number().int(),
    version: z.number().int(),
  })
  .passthrough();
const ApiResponseCampaignResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: CampaignResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const PageCampaignResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CampaignResponse),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
const ApiResponsePageCampaignResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageCampaignResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const CampaignPerformanceResponse = z
  .object({
    id: z.string().uuid(),
    advertiserId: z.string().uuid(),
    campaignId: z.string().uuid(),
    date: z.string(),
    impressions: z.number().int().optional(),
    clicks: z.number().int().optional(),
    conversions: z.number().int().optional(),
    spend: z.number(),
  })
  .passthrough();
const PageCampaignPerformanceResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CampaignPerformanceResponse),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
const ApiResponsePageCampaignPerformanceResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageCampaignPerformanceResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const CampaignRequest = z
  .object({
    advertiserId: z.string().uuid(),
    name: z.string().min(0).max(255),
    dailyBudget: z.number(),
    lifetimeBudget: z.number().optional(),
    maxBid: z.number(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }).optional(),
    frequencyCap: z.number().int().optional(),
  })
  .passthrough();
const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.record(z.string()).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const TopupWalletRequest = z
  .object({ amount: z.number(), gatewayName: z.string().optional() })
  .passthrough();

export const schemas = {
  CampaignResponse,
  ApiResponseCampaignResponse,
  PageCampaignResponse,
  ApiResponsePageCampaignResponse,
  CampaignPerformanceResponse,
  PageCampaignPerformanceResponse,
  ApiResponsePageCampaignPerformanceResponse,
  CampaignRequest,
  ApiResponseMapStringString,
  TopupWalletRequest,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:id",
    alias: "getCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseCampaignResponse,
  },
  {
    method: "put",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:id",
    alias: "updateCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CampaignRequest,
      },
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "If-Match",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseCampaignResponse,
  },
  {
    method: "delete",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:id",
    alias: "deleteCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseVoid,
  },
  {
    method: "get",
    path: "/api/v1/advertisers/:advertiserId/campaigns",
    alias: "getCampaigns",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: ApiResponsePageCampaignResponse,
  },
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/campaigns",
    alias: "createCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CampaignRequest,
      },
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseCampaignResponse,
  },
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:id/resume",
    alias: "resumeCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseVoid,
  },
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:id/pause",
    alias: "pauseCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseVoid,
  },
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:id/activate",
    alias: "activateCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseCampaignResponse,
  },
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/campaigns/wallet/topup",
    alias: "topupWallet",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: TopupWalletRequest,
      },
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseMapStringString,
  },
  {
    method: "get",
    path: "/api/v1/advertisers/:advertiserId/campaigns/:id/performance",
    alias: "getCampaignPerformance",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "from",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: ApiResponsePageCampaignPerformanceResponse,
  },
  {
    method: "get",
    path: "/api/v1/advertisers/:advertiserId/campaigns/performance",
    alias: "getAllCampaignPerformance",
    requestFormat: "json",
    parameters: [
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "from",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: ApiResponsePageCampaignPerformanceResponse,
  },
]);

export const Campaign_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
