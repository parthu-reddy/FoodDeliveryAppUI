import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/tracking/click",
    alias: "trackClick",
    requestFormat: "json",
    parameters: [
      {
        name: "campaignId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "advertiserId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "wp",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "X-Device-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "X-Forwarded-For",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/tracking/conversion",
    alias: "trackConversion",
    requestFormat: "json",
    parameters: [
      {
        name: "campaignId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "advertiserId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "wp",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "X-Device-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "X-Forwarded-For",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/tracking/impression",
    alias: "trackImpression",
    requestFormat: "json",
    parameters: [
      {
        name: "campaignId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "advertiserId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "wp",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "X-Device-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "X-Forwarded-For",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
