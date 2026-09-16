import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/auth/admin/otp",
    alias: "getOtp",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "serviceName",
        type: "Query",
        schema: z.string().optional().default("CUSTOMER"),
      },
    ],
    response: ApiResponseString,
  },
]);

export const Admin_otp_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
