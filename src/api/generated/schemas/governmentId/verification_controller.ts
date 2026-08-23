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
  BankRequest,
};

const endpoints = makeApi([
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
    response: z.object({}).partial().passthrough(),
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
    response: z.object({}).partial().passthrough(),
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
    response: z.object({}).partial().passthrough(),
  },
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
    response: z.object({}).partial().passthrough(),
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
    response: z.object({}).partial().passthrough(),
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
    response: z.object({}).partial().passthrough(),
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
    response: z.object({}).partial().passthrough(),
  },
]);

export const Verification_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
