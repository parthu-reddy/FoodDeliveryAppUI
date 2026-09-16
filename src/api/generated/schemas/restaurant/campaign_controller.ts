import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const CampaignDto = z
  .object({
    id: z.string().uuid(),
    advertiserId: z.string().uuid(),
    name: z.string(),
    budget: z.number(),
    status: z.string(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const ApiResponseCampaignDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: CampaignDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseListCampaignDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(CampaignDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const CampaignRequestDto = z
  .object({
    restaurantId: z.string().uuid(),
    name: z.string(),
    budget: z.number(),
    status: z.string(),
  })
  .partial()
  .passthrough();

export const schemas = {
  CampaignDto,
  ApiResponseCampaignDto,
  ApiResponseListCampaignDto,
  CampaignRequestDto,
};

export const endpoints = makeApi([
  {
    method: "put",
    path: "/api/v1/campaigns/:campaignId/pause",
    alias: "pauseCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "campaignId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "restaurantId",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseCampaignDto,
  },
  {
    method: "post",
    path: "/api/v1/campaigns",
    alias: "createCampaign",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CampaignRequestDto,
      },
    ],
    response: ApiResponseCampaignDto,
  },
  {
    method: "get",
    path: "/api/v1/campaigns/restaurant/:restaurantId",
    alias: "getCampaigns",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseListCampaignDto,
  },
]);

export const Campaign_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
