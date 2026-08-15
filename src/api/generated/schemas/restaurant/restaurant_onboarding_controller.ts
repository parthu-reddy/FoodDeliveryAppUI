import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const BrandOnboardRequest = z
  .object({
    name: z.string(),
    gstin: z.string(),
    pan: z.string(),
    cin: z.string().optional(),
    bankAccountNumber: z.string(),
    ifscCode: z.string(),
    logoUrl: z.string().optional(),
  })
  .passthrough();

export const schemas = {
  BrandOnboardRequest,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/brands",
    alias: "getBrands",
    requestFormat: "json",
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/brands",
    alias: "onboardBrand",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BrandOnboardRequest,
      },
    ],
    response: z.any(),
  },
]);

export const Restaurant_onboarding_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
