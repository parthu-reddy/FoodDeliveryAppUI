import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/advertiser/register",
    alias: "registerAdvertiser",
    requestFormat: "json",
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/advertiser/:advertiserId/presigned-url",
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
    ],
    response: z.any(),
  },
]);

export const Advertiser_portal_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
