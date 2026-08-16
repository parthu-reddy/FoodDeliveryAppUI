import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

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
    response: z.any(),
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
    response: z.any(),
  },
]);

export const Places_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
