import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";
import { CampaignPacingDTO } from "./common";

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/campaigns/batch/budgets",
    alias: "getDailyBudgets",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(z.string()),
      },
    ],
    response: z.record(CampaignPacingDTO),
  },
  {
    method: "get",
    path: "/api/v1/internal/campaigns/active-for-bidding",
    alias: "getActiveCampaignsForBidding",
    requestFormat: "json",
    response: z.array(z.record(z.object({}).partial().passthrough())),
  },
]);

export const Internal_campaign_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
