import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";
import { MembershipDto } from "./common";

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/users/:userId/organisations",
    alias: "memberships",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(MembershipDto),
  },
]);

export const Internal_user_organisations_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
