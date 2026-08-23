import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseObject } from "./common";

const RCRequest = z
  .object({ registrationNumber: z.string(), documentUrl: z.string() })
  .passthrough();
const DLRequest = z
  .object({ dlNumber: z.string(), documentUrl: z.string(), dob: z.string() })
  .passthrough();
const BankRequest = z
  .object({
    accountNumber: z.string(),
    ifscCode: z.string(),
    kycFullName: z.string(),
  })
  .passthrough();
const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.string()),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  RCRequest,
  DLRequest,
  BankRequest,
  ApiResponseMapStringString,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/delivery/verification/vehicle-rc",
    alias: "verifyVehicleRC",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RCRequest,
      },
    ],
    response: ApiResponseObject,
  },
  {
    method: "post",
    path: "/api/delivery/verification/driving-license",
    alias: "verifyDrivingLicense",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DLRequest,
      },
    ],
    response: ApiResponseObject,
  },
  {
    method: "post",
    path: "/api/delivery/verification/biometric",
    alias: "verifyBiometric",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ selfieUrl: z.string() }).passthrough(),
      },
    ],
    response: ApiResponseObject,
  },
  {
    method: "post",
    path: "/api/delivery/verification/bank-account",
    alias: "verifyBankAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BankRequest,
      },
    ],
    response: ApiResponseObject,
  },
  {
    method: "get",
    path: "/api/delivery/verification/upload-url",
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
  {
    method: "get",
    path: "/api/delivery/verification/status",
    alias: "getVerificationStatus",
    requestFormat: "json",
    response: ApiResponseObject,
  },
  {
    method: "get",
    path: "/api/delivery/verification/download-url",
    alias: "getPresignedDownloadUrl",
    requestFormat: "json",
    parameters: [
      {
        name: "objectKey",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: ApiResponseMapStringString,
  },
]);

export const Delivery_verification_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
