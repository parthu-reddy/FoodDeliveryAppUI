import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const VerifyOtp200Response = z
  .object({ success: z.boolean(), data: z.string(), message: z.string() })
  .partial()
  .passthrough();

export const schemas = {
  VerifyOtp200Response,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/auth/verify",
    alias: "verifyOtp",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z
          .string()
          .min(8)
          .max(20)
          .regex(/^[0-9]+$/),
      },
      {
        name: "otp",
        type: "Query",
        schema: z
          .string()
          .min(6)
          .max(6)
          .regex(/^[0-9]{6}$/),
      },
    ],
    response: VerifyOtp200Response,
  },
  {
    method: "post",
    path: "/api/v1/internal/auth/initiate",
    alias: "initiateAuth",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z
          .string()
          .min(8)
          .max(20)
          .regex(/^[0-9]+$/),
      },
    ],
    response: z.any(),
  },
]);

export const ApiApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
