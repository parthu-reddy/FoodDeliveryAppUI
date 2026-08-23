import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const ApiResponseObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({}).partial().passthrough(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  ApiResponseObject,
};

const endpoints = makeApi([
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
    response: ApiResponseObject,
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
        schema: z.record(z.object({}).partial().passthrough()),
      },
    ],
    response: ApiResponseObject,
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
    response: ApiResponseObject,
  },
]);

export const Campaign_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
