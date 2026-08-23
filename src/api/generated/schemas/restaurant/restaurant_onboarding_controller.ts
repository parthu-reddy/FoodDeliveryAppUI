import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const Brand = z
  .object({
    id: z.string().uuid(),
    ownerId: z.string().uuid(),
    name: z.string(),
    gstin: z.string(),
    pan: z.string(),
    cin: z.string(),
    bankAccountNumber: z.string(),
    bankIfsc: z.string(),
    logoUrl: z.string(),
    legalEntityName: z.string(),
    kycStatus: z.enum([
      "PENDING",
      "APPROVED",
      "VERIFIED",
      "REJECTED",
      "MANUAL_REVIEW",
      "FAILED",
    ]),
    bankBeneficiaryName: z.string(),
    pennyDropStatus: z.enum([
      "PENDING",
      "APPROVED",
      "VERIFIED",
      "REJECTED",
      "MANUAL_REVIEW",
      "FAILED",
    ]),
    isGstinVerified: z.boolean(),
    isBankVerified: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int(),
  })
  .partial()
  .passthrough();
const ApiResponseBrand = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: Brand,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseListBrand = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(Brand),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
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
  Brand,
  ApiResponseBrand,
  ApiResponseListBrand,
  BrandOnboardRequest,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/brands",
    alias: "getBrands",
    requestFormat: "json",
    response: ApiResponseListBrand,
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
    response: ApiResponseBrand,
  },
]);

export const Restaurant_onboarding_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
