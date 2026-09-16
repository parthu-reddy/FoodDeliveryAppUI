import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const StatusResponseDto = z
  .object({
    status: z.string(),
    referenceId: z.string(),
    message: z.string(),
    valid: z.boolean(),
  })
  .partial()
  .passthrough();
export const ApiResponseStatusResponseDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: StatusResponseDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const RiderVerificationStatusDto = z
  .object({
    dlStatus: z.string(),
    rcStatus: z.string(),
    bankStatus: z.string(),
    biometricStatus: z.string(),
    fullyVerified: z.boolean(),
  })
  .partial()
  .passthrough();
export const ApiResponseRiderVerificationStatusDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: RiderVerificationStatusDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const RCRequest = z
  .object({
    registrationNumber: z.string(),
    documentUrl: z.string().optional(),
  })
  .passthrough();
export const DLRequest = z
  .object({
    dlNumber: z.string(),
    dateOfBirth: z.string(),
    documentUrl: z.string().optional(),
  })
  .passthrough();
export const BankRequest = z
  .object({
    accountNumber: z.string(),
    ifscCode: z.string(),
    kycFullName: z.string(),
  })
  .passthrough();
export const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.record(z.string()).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  StatusResponseDto,
  ApiResponseStatusResponseDto,
  RiderVerificationStatusDto,
  ApiResponseRiderVerificationStatusDto,
  RCRequest,
  DLRequest,
  BankRequest,
  ApiResponseMapStringString,
};

export const endpoints = makeApi([
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
    response: ApiResponseStatusResponseDto,
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
    response: ApiResponseStatusResponseDto,
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
    response: ApiResponseStatusResponseDto,
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
    response: ApiResponseStatusResponseDto,
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
    response: ApiResponseRiderVerificationStatusDto,
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
