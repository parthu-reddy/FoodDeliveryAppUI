import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const RCRequest = z
  .object({
    registrationNumber: z.string(),
    documentUrl: z.string().optional(),
  })
  .passthrough();
const DLRequest = z
  .object({
    dlNumber: z.string(),
    dateOfBirth: z.string(),
    documentUrl: z.string().optional(),
  })
  .passthrough();
const PennyDropWebhook = z
  .object({
    brandId: z.string().uuid(),
    beneficiaryName: z.string(),
    status: z.string(),
    registeredBrandName: z.string(),
  })
  .partial()
  .passthrough();
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
const BiometricRequest = z.object({ selfieUrl: z.string() }).passthrough();
const BankRequest = z
  .object({
    accountNumber: z.string(),
    ifscCode: z.string(),
    kycFullName: z.string(),
  })
  .passthrough();

export const schemas = {
  RCRequest,
  DLRequest,
  PennyDropWebhook,
  GstinRequest,
  BankAccountRequest,
  BiometricRequest,
  BankRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/verification/bank-account",
    alias: "verifyBankAccount_1",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BankRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/verification/biometric",
    alias: "verifyBiometric",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ selfieUrl: z.string() }).passthrough(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/verification/brands/bank-account",
    alias: "verifyBankAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BankAccountRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/verification/brands/gstin",
    alias: "verifyGstin",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GstinRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/verification/brands/webhooks/penny-drop",
    alias: "handlePennyDropWebhook",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PennyDropWebhook,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/verification/download-url",
    alias: "getPresignedDownloadUrl",
    requestFormat: "json",
    parameters: [
      {
        name: "objectKey",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/verification/driving-license",
    alias: "verifyDrivingLicense",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DLRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/verification/status/:executiveId",
    alias: "getVerificationSummary",
    requestFormat: "json",
    parameters: [
      {
        name: "executiveId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/verification/upload-url",
    alias: "getPresignedUploadUrl",
    requestFormat: "json",
    parameters: [
      {
        name: "docType",
        type: "Query",
        schema: z.enum([
          "AADHAAR",
          "PAN",
          "DRIVING_LICENSE",
          "RC",
          "SELFIE",
          "GSTIN",
          "FSSAI",
        ]),
      },
      {
        name: "contentType",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/verification/vehicle-rc",
    alias: "verifyVehicleRC",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RCRequest,
      },
    ],
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
