import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/restaurants/owner/:ownerId/outlets",
    alias: "getOwnerOutlets",
    requestFormat: "json",
    parameters: [
      {
        name: "ownerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(z.string()),
  },
]);

export const Internal_restaurant_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
