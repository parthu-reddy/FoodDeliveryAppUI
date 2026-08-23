import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseMapStringObject } from "./common";

const ApiResponseListMapStringObject = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(z.record(z.object({}).partial().passthrough())),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  ApiResponseListMapStringObject,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/places/reverse-geocode",
    alias: "reverseGeocode",
    requestFormat: "json",
    parameters: [
      {
        name: "lat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number(),
      },
    ],
    response: ApiResponseMapStringObject,
  },
  {
    method: "get",
    path: "/api/v1/places/autocomplete",
    alias: "autocomplete",
    requestFormat: "json",
    parameters: [
      {
        name: "input",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: ApiResponseListMapStringObject,
  },
]);

export const Places_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
