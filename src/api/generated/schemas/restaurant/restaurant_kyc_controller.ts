import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const GstinRequest = z
  .object({
    brandId: z.string().uuid(),
    gstin: z.string(),
    brandName: z.string(),
  })
  .partial()
  .passthrough();
const BankAccountRequest = z
  .object({
    brandId: z.string().uuid(),
    accountNumber: z.string(),
    ifscCode: z.string(),
    brandName: z.string(),
  })
  .partial()
  .passthrough();
const VerificationCallbackRequest = z
  .object({
    verificationType: z.string(),
    status: z.string(),
    legalEntityName: z.string(),
    bankBeneficiaryName: z.string(),
    matchScore: z.number(),
  })
  .partial()
  .passthrough();

export const schemas = {
  GstinRequest,
  BankAccountRequest,
  VerificationCallbackRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/restaurants/verification/brands/gstin",
    alias: "verifyGstin",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GstinRequest,
      },
    ],
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/restaurants/verification/brands/bank-account",
    alias: "verifyBankAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BankAccountRequest,
      },
    ],
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/internal/brands/:brandId/verification-callback",
    alias: "updateVerificationStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: VerificationCallbackRequest,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.any(),
  },
  {
    method: "get",
    path: "/api/v1/restaurants/verification/upload-url",
    alias: "getPresignedUploadUrl",
    requestFormat: "json",
    parameters: [
      {
        name: "docType",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "contentType",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.any(),
  },
]);

export const Restaurant_kyc_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
