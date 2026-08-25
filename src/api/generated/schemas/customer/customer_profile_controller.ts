import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseMapStringObject } from "./common";

const Customer = z
  .object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
const ApiResponseCustomer = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: Customer.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  Customer,
  ApiResponseCustomer,
};

const endpoints = makeApi([
  {
    method: "put",
    path: "/api/v1/customers/:id",
    alias: "updateProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: Customer,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseCustomer,
  },
  {
    method: "get",
    path: "/api/v1/customers/profile",
    alias: "getProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseMapStringObject,
  },
  {
    method: "post",
    path: "/api/v1/customers/profile",
    alias: "createProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: Customer,
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseCustomer,
  },
]);

export const Customer_profile_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
