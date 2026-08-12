import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
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
    response: z.void(),
  },
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
    response: z
      .object({ success: z.boolean(), data: z.string(), message: z.string() })
      .partial()
      .passthrough(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}

// Export individual schemas for form validation
export const phoneSchema = endpoints.find(e => e.alias === 'initiateAuth')!.parameters!.find(p => p.name === 'phoneNumber')!.schema as z.ZodString;
export const otpSchema = endpoints.find(e => e.alias === 'verifyOtp')!.parameters!.find(p => p.name === 'otp')!.schema as z.ZodString;
