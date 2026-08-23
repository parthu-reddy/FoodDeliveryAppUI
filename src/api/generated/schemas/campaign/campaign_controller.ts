import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";
import { CampaignPerformance } from "./common";

const CampaignResponse = z
  .object({
    id: z.string().uuid(),
    advertiserId: z.string().uuid(),
    name: z.string(),
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
    dailyBudget: z.number(),
    lifetimeBudget: z.number(),
    maxBid: z.number(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }),
    version: z.number().int(),
  })
  .partial()
  .passthrough();
const SortObject = z
  .object({
    direction: z.string(),
    nullHandling: z.string(),
    ascending: z.boolean(),
    property: z.string(),
    ignoreCase: z.boolean(),
  })
  .partial()
  .passthrough();
const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: z.array(SortObject),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .partial()
  .passthrough();
const PageCampaignResponse = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CampaignResponse),
    number: z.number().int(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    last: z.boolean(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const CampaignRequest = z
  .object({
    advertiserId: z.string().uuid(),
    name: z.string(),
    dailyBudget: z.number(),
    lifetimeBudget: z.number(),
    maxBid: z.number(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: z.array(z.string()),
  })
  .partial()
  .passthrough();

export const schemas = {
  CampaignResponse,
  SortObject,
  PageableObject,
  PageCampaignResponse,
  CampaignRequest,
  pageable,
};

const endpoints = makeApi([
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
        schema: z.number().int().optional(),
      },
    ],
    response: CampaignResponse,
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
    response: PageCampaignResponse,
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
    response: CampaignResponse,
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
    response: z.void(),
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
        schema: z.record(z.object({}).partial().passthrough()),
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
    response: z.record(z.string()),
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
    ],
    response: z.array(CampaignPerformance),
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
    ],
    response: z.array(CampaignPerformance),
  },
]);

export const Campaign_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
