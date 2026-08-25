import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseVoid } from "./common";

const GstinRequest = z
  .object({
    brandId: z.string().uuid().optional(),
    gstin: z.string(),
    brandName: z.string(),
  })
  .passthrough();
const BankAccountRequest = z
  .object({
    brandId: z.string().uuid().optional(),
    accountNumber: z.string(),
    ifscCode: z.string(),
    brandName: z.string(),
  })
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
const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.string()).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  GstinRequest,
  BankAccountRequest,
  VerificationCallbackRequest,
  ApiResponseMapStringString,
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
    response: ApiResponseVoid,
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
    response: ApiResponseVoid,
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
    response: z.void(),
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
    response: ApiResponseMapStringString,
  },
]);

export const Restaurant_kyc_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
