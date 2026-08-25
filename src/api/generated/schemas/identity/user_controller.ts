import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.string()).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const UpdateProfileRequest = z
  .object({
    name: z.string().min(0).max(100),
    email: z.string().min(0).max(255).optional(),
    phone: z
      .string()
      .min(0)
      .max(20)
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
  })
  .passthrough();

export const schemas = {
  ApiResponseMapStringString,
  UpdateProfileRequest,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/users/profile",
    alias: "getProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: ApiResponseMapStringString,
  },
  {
    method: "put",
    path: "/api/v1/users/profile",
    alias: "updateProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateProfileRequest,
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: ApiResponseString,
  },
]);

export const User_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
