import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/logistics/route",
    alias: "getRoute",
    requestFormat: "json",
    parameters: [
      {
        name: "sourceLat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "sourceLng",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "destLat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "destLng",
        type: "Query",
        schema: z.number(),
      },
    ],
    response: z.void(),
  },
]);

export const Logistics_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
